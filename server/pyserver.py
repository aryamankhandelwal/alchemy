"""
No-node backend for Alchemy, port-for-port with the Vite dev API + node backend.

Why this exists: node.exe is blocked by Microsoft Defender for Endpoint on this
machine when spawned from the agent process tree, so `npm run dev` can't run here.
This Python server reproduces server/routes/bets.ts + the /api/* routes from
vite.config.ts, talks to the same MongoDB Atlas cluster, proxies the three Gemini
AI endpoints over REST, and serves the prebuilt dist/ SPA. Drop-in on :5173.

Logic ported from:
  - src/lib/applyPatch.ts      (applyPatch, dot-paths + `<arr>.add`)
  - src/lib/history.ts         (diffPatch, makeHistoryEntry, appendHistory)
  - src/lib/createBet.ts       (createBet)
  - src/lib/kpiSchema.ts        (thresholds/format used in prompts)
  - src/lib/systemPrompt.ts    (buildSystemPrompt)
  - server/chat.ts / enrich.ts / research.ts  (Gemini calls -> REST)
"""

import base64
import json
import mimetypes
import os
import re
import time
import random
import string
import urllib.request
import urllib.error
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# --- Force public DNS resolvers for Atlas SRV (mirrors server/db.ts). Only the
# default_resolver is overridden; A-record lookups still go via system getaddrinfo
# (overriding that breaks pymongo on Python 3.14). ---
import dns.resolver
_r = dns.resolver.Resolver(configure=False)
_r.nameservers = ["1.1.1.1", "8.8.8.8", "1.0.0.1"]
dns.resolver.default_resolver = _r

from bson.binary import Binary
from pymongo import MongoClient

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DIST = os.path.join(ROOT, "dist")
PORT = 5173

# ---------------------------------------------------------------- env
def load_env():
    env = {}
    with open(os.path.join(ROOT, ".env"), encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"([A-Z_]+)\s*=\s*(.+)$", line)
            if m:
                env[m.group(1)] = m.group(2).strip()
    return env

ENV = load_env()
GEMINI_KEY = ENV.get("GEMINI_API_KEY")
GEMINI_MODEL = ENV.get("GEMINI_MODEL", "gemini-2.5-flash")

# ---------------------------------------------------------------- mongo
client = MongoClient(ENV["MONGODB_URI"], serverSelectionTimeoutMS=20000)
bets_col = client[ENV.get("MONGODB_DB", "alchemy")]["bets"]
bets_col.create_index("id", unique=True)
artifacts_col = client[ENV.get("MONGODB_DB", "alchemy")]["artifacts"]
artifacts_col.create_index("id", unique=True)
artifacts_col.create_index("betId")
print(f"[db] connected to {ENV.get('MONGODB_DB', 'alchemy')}; {bets_col.count_documents({})} bet(s)")

def strip_id(doc):
    if doc and "_id" in doc:
        doc = dict(doc)
        doc.pop("_id", None)
    return doc

# ---------------------------------------------------------------- patch engine (applyPatch.ts)
def parse_path(path):
    out = []
    for m in re.finditer(r"([^.\[\]]+)|\[(\d+)\]", path):
        if m.group(1) is not None:
            out.append(m.group(1))
        else:
            out.append(int(m.group(2)))
    return out

def set_path(obj, segments, value):
    cur = obj
    for i in range(len(segments) - 1):
        seg = segments[i]
        nxt = segments[i + 1]
        if isinstance(cur, list):
            while len(cur) <= seg:
                cur.append(None)
            if cur[seg] is None:
                cur[seg] = [] if isinstance(nxt, int) else {}
        else:
            if cur.get(seg) is None:
                cur[seg] = [] if isinstance(nxt, int) else {}
        cur = cur[seg]
    last = segments[-1]
    if isinstance(cur, list):
        while len(cur) <= last:
            cur.append(None)
    cur[last] = value

def apply_patch(bet, patch):
    if not isinstance(patch, dict):
        return bet
    nxt = json.loads(json.dumps(bet))  # deep clone
    for raw_key, value in patch.items():
        if raw_key.endswith(".add"):
            arr_path = raw_key[: -len(".add")]
            segments = parse_path(arr_path)
            cur = nxt
            for seg in segments:
                if isinstance(cur, dict):
                    if cur.get(seg) is None:
                        cur[seg] = []
                cur = cur[seg]
            if isinstance(cur, list):
                cur.append(value)
            continue
        segments = parse_path(raw_key)
        if not segments:
            continue
        set_path(nxt, segments, value)
    return nxt

# ---------------------------------------------------------------- history (history.ts)
def get_path(obj, segments):
    cur = obj
    for s in segments:
        if cur is None:
            return None
        try:
            cur = cur[s]
        except (KeyError, IndexError, TypeError):
            return None
    return cur

def diff_patch(prev_bet, patch):
    if not isinstance(patch, dict):
        return []
    changes = []
    for raw_key, value in patch.items():
        if raw_key.endswith(".add"):
            changes.append({"path": raw_key[: -len(".add")], "op": "add", "after": value})
            continue
        segments = parse_path(raw_key)
        before = get_path(prev_bet, segments)
        if json.dumps(before, sort_keys=True) == json.dumps(value, sort_keys=True):
            continue
        changes.append({"path": raw_key, "op": "set", "before": before, "after": value})
    return changes

def make_history_entry(source, changes, note=None):
    if not changes:
        return None
    rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "id": f"{int(time.time() * 1000)}-{rand}",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": source,
        "note": note,
        "changes": changes,
    }

def append_history(bet, entry):
    if not entry:
        return bet
    return {**bet, "history": [entry, *bet.get("history", [])]}

# ---------------------------------------------------------------- createBet.ts
def slugify(s):
    s = str(s).lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s[:40] or "bet"

EMPTY_TIMELINE = {
    "Evaluation": {"start": None, "end": None},
    "Pilot": {"start": None, "end": None},
    "Scale": {"start": None, "end": None},
}

def create_bet(inp):
    name = inp.get("name", "")
    description = inp.get("description", "")
    suffix = format(int(time.time() * 1000), "x")[-4:]
    return {
        "id": f"{slugify(name)}-{suffix}",
        "name": name.strip(),
        "description": description.strip(),
        "stage": inp.get("stage"),
        "decision": inp.get("decision"),
        "score": None,
        "nullHypothesis": "",
        "targetCustomer": "",
        "aiSummary": "",
        "market": {"tam": "—", "sam": "—", "som": "—", "sources": {}, "competitors": []},
        "risks": [],
        "kpis": {},
        "timeline": inp.get("timeline") or EMPTY_TIMELINE,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

# ---------------------------------------------------------------- KPI schema (subset: thresholds + format) for prompts
KPI_SCHEMA = {
    "Evaluation": {
        "demandSignal": {"label": "Demand Signal", "format": "pct", "thresholds": "<5% kill · 5–15% proceed · >15% prioritise"},
        "problemSeverity": {"label": "Problem Severity", "format": "enum", "enumOrder": ["Low", "Medium", "High"], "thresholds": "Low kill · Medium proceed · High prioritise"},
        "marketClarity": {"label": "Market Clarity", "format": "enum", "enumOrder": ["Unclear", "Partial", "Well-defined"], "thresholds": "Unclear kill · Partial proceed · Well-defined prioritise"},
        "speedToMvp": {"label": "Speed to MVP", "format": "weeks", "thresholds": ">26 wk kill · 6–26 wk proceed · ≤6 wk prioritise"},
    },
    "Pilot": {
        "activationRate": {"label": "Activation Rate", "format": "pct", "thresholds": "<20% kill · 20–40% proceed · >40% prioritise"},
        "conversionRate": {"label": "Conversion Rate", "format": "pct", "thresholds": "<5% kill · 5–15% proceed · >15% prioritise"},
        "retentionD30": {"label": "Retention (D30)", "format": "pct", "thresholds": "<20% kill · 20–40% proceed · >40% prioritise"},
        "ltvCac": {"label": "LTV / CAC", "format": "x", "thresholds": "<1.0× kill · 1.0–2.0× proceed · >2.0× prioritise"},
        "riskSignals": {"label": "Risk Signals", "format": "enum", "enumOrder": ["High", "Moderate", "Low"], "thresholds": "High kill · Moderate proceed · Low prioritise"},
        "operationalLoad": {"label": "Operational Load", "format": "enum", "enumOrder": ["High", "Medium", "Low"], "thresholds": "High kill · Medium proceed · Low prioritise"},
    },
    "Scale": {
        "ltvCac": {"label": "LTV / CAC", "format": "x", "thresholds": "<1.5× kill · 1.5–2.5× proceed · >2.5× prioritise"},
        "contributionMargin": {"label": "Contribution Margin", "format": "enum", "enumOrder": ["Negative", "Approaching breakeven", "Positive + improving"], "thresholds": "Negative kill · Approaching breakeven proceed · Positive + improving prioritise"},
        "paybackMonths": {"label": "Payback Period", "format": "months", "thresholds": ">18 mo kill · 9–18 mo proceed · <9 mo prioritise"},
        "riskScalability": {"label": "Risk Scalability", "format": "enum", "enumOrder": ["Unstable", "Stabilising", "Predictable"], "thresholds": "Unstable kill · Stabilising proceed · Predictable prioritise"},
        "regulatoryReadiness": {"label": "Regulatory Readiness", "format": "enum", "enumOrder": ["Blocked", "Partial", "Fully approved"], "thresholds": "Blocked kill · Partial proceed · Fully approved prioritise"},
        "operationalScalability": {"label": "Operational Scalability", "format": "enum", "enumOrder": ["Breaks", "Needs optimisation", "Scales cleanly"], "thresholds": "Breaks kill · Needs optimisation proceed · Scales cleanly prioritise"},
        "strategicFit": {"label": "Strategic Fit", "format": "enum", "enumOrder": ["Weak", "Adjacent", "Strong"], "thresholds": "Weak kill · Adjacent proceed · Strong prioritise"},
    },
}

def render_kpi_table(stage):
    defs = KPI_SCHEMA.get(stage, {})
    return "\n".join(f"  - {d['label']} (`{k}`): {d['thresholds']}" for k, d in defs.items())

FRAMEWORK_PRIMER = """# New Horizons framework

Astra Tech's stage-gated portfolio system for new product bets. Every bet sits at one (Stage × Decision) cell.

## Stages
- **Evaluation** — validate market demand exists and the problem is worth solving.
- **Pilot** — validate real-world user behaviour and early economic signal.
- **Scale** — confirm scalable, profitable, low-risk business model.

## Decision states
- **Prioritise** — strong signals across dimensions; allocate capacity.
- **Proceed** — mixed or incomplete signals; iterate.
- **Kill** — fails thresholds (demand, economics, or risk); flagged for kill.
- **Killed** — archived with learnings.

## Per-stage KPI thresholds

### Evaluation
{evaluation}

### Pilot
{pilot}

### Scale
{scale}

## Decision logic (apply at every stage)
- Any structural failure (broken economics, blocked compliance, high risk) → Kill.
- Mixed/incomplete signals → Proceed (iterate).
- Strong across dimensions → Prioritise.
- A bet can be Proceed at one stage and Kill at the next if real-world signals shift."""

OUTPUT_CONTRACT = """# Your job

You are an in-app assistant inside Alchemy, the New Horizons portfolio dashboard. The user is a senior operator (Strategy / COO Office). You help them update bets and answer framework questions.

Return a JSON object with two keys:

1. **patch** — either `null` (no update — user is asking a question or chatting), or a flat object whose keys are dot-paths into the bet and values are the new values.

   Examples of valid patches:
   - `{ "kpis.ltvCac": 2.3 }`
   - `{ "decision": "Prioritise" }`
   - `{ "kpis.activationRate": 0.18 }`
   - `{ "risks.add": { "name": "CBUAE EWA circular", "category": "Regulatory", "severity": "High", "mitigation": "Pause employer rollout pending circular." } }`
   - `{ "market.competitors[0].threat": "High" }`
   - `{ "score": 72, "decision": "Proceed" }`  (multiple updates allowed)

   Field reference for the bet object:
   - top-level: `name`, `description`, `stage`, `decision`, `score` (0–100), `nullHypothesis`, `targetCustomer`, `aiSummary`
   - `market.tam`, `market.sam`, `market.som`
   - `market.competitors` — array of `{ name, strength, weakness, threat }`. Threat ∈ Low/Medium/High.
   - `risks` — array of `{ name, category, severity, mitigation }`. Category ∈ Regulatory/Operational/Credit/Market. Severity ∈ Low/Medium/High.
   - `kpis.<id>` — see KPI table for valid IDs per stage.

   KPI value formats: percentages as decimals (0.18 for 18%), LTV/CAC as multiples (2.3), payback as integer months, speed-to-MVP as integer weeks. Enum KPIs use the exact strings from the threshold table (e.g. "Well-defined", "Approaching breakeven", "Fully approved").

2. **reply** — one to two short sentences. Direct, professional tone. Acknowledge what was updated, or answer the question. Do NOT repeat the patch back as text. Do NOT pad with hedging.

Rules:
- If the user gives ambiguous input ("looks bad"), do not patch — ask one clarifying question in `reply` and set `patch` to null.
- If the user asks a framework question (thresholds, rationale, decision logic), answer concisely from the KPI tables above and set `patch` to null.
- If the user asks the AI to make the kill/proceed call ("should we kill this?"), give your read in `reply` but do NOT change `decision` — humans own that. Set patch to null.
- Round percentages and multiples sensibly. Don't fabricate sources or numbers the user didn't provide."""

def build_system_prompt(bet):
    primer = FRAMEWORK_PRIMER.format(
        evaluation=render_kpi_table("Evaluation"),
        pilot=render_kpi_table("Pilot"),
        scale=render_kpi_table("Scale"),
    )
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return "\n\n---\n\n".join([
        primer,
        OUTPUT_CONTRACT,
        "# Current bet (full JSON)\n\n```json\n" + json.dumps(bet, indent=2) + "\n```",
        f"Today's date is {today}.",
    ])

# ---------------------------------------------------------------- Gemini REST
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

def _uppercase_types(schema):
    """Gemini REST Schema.type wants uppercase enum values; union types collapse to STRING."""
    if isinstance(schema, dict):
        out = {}
        for k, v in schema.items():
            if k == "type":
                if isinstance(v, list):
                    pick = next((t for t in v if t != "null"), "string")
                    out[k] = str(pick).upper()
                else:
                    out[k] = str(v).upper()
            else:
                out[k] = _uppercase_types(v)
        return out
    if isinstance(schema, list):
        return [_uppercase_types(x) for x in schema]
    return schema

def gemini_generate(contents, system_instruction=None, response_mime_type=None,
                    response_schema=None, tools=None, temperature=None, max_output_tokens=None):
    if not GEMINI_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set.")
    body = {"contents": contents}
    if system_instruction:
        body["systemInstruction"] = {"parts": [{"text": system_instruction}]}
    gen_cfg = {}
    if response_mime_type:
        gen_cfg["responseMimeType"] = response_mime_type
    if response_schema:
        gen_cfg["responseSchema"] = _uppercase_types(response_schema)
    if temperature is not None:
        gen_cfg["temperature"] = temperature
    if max_output_tokens is not None:
        gen_cfg["maxOutputTokens"] = max_output_tokens
    if gen_cfg:
        body["generationConfig"] = gen_cfg
    if tools:
        body["tools"] = tools

    url = f"{GEMINI_BASE}/{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}"
    # Gemini free tier throws transient 503/429 under load — retry with backoff.
    last_err = None
    for attempt in range(4):
        if attempt:
            time.sleep(2 ** attempt + random.random())
        req = urllib.request.Request(
            url, data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"}, method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503):
                last_err = e
                continue
            raise
    else:
        raise last_err
    # extract first candidate text
    parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in parts)

def norm_contents(messages):
    return [
        {"role": "model" if m.get("role") == "assistant" else "user",
         "parts": [{"text": m.get("content", "")}]}
        for m in messages
    ]

# ---------------------------------------------------------------- AI handlers
def chat_handler(body):
    messages = body.get("messages")
    bet = body.get("bet")
    if not GEMINI_KEY:
        return {"patch": None, "reply": "No GEMINI_API_KEY configured. Add it to .env."}
    if not isinstance(messages, list) or not bet:
        return {"patch": None, "reply": "Bad request — missing messages or bet."}
    sys_inst = (build_system_prompt(bet) +
                '\n\nReturn ONLY a JSON object of shape: {"patch": <dot-path map or null>, "reply": <string>}. '
                "No prose, no markdown fences.")
    try:
        raw = gemini_generate(norm_contents(messages), system_instruction=sys_inst,
                              response_mime_type="application/json", temperature=0.2,
                              max_output_tokens=1000)
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return {"patch": None, "reply": f"AI returned non-JSON: {raw[:200]}"}
        return {"patch": parsed.get("patch"), "reply": parsed.get("reply", "")}
    except Exception as e:  # noqa
        return {"patch": None, "reply": f"AI request failed: {e}"}

def enrich_patch(bet):
    defs = KPI_SCHEMA.get(bet["stage"], {})
    kpi_keys = list(defs.keys())
    rules = []
    for k, d in defs.items():
        fmt = d["format"]
        if fmt == "enum":
            vr = "string, exactly one of: " + " | ".join(d.get("enumOrder", []))
        elif fmt == "pct":
            vr = "decimal between 0 and 1 (0.18 means 18%)"
        elif fmt == "x":
            vr = "number with one decimal, e.g. 1.8"
        elif fmt == "months":
            vr = "integer months"
        else:
            vr = "integer weeks"
        rules.append(f"  - {k} — {d['label']}. VALUE: {vr}. Reference bands: {d['thresholds']}")
    kpi_list = "\n".join(rules)
    prompt = (
        "You are an in-app assistant inside Alchemy, Astra Tech's New Horizons portfolio dashboard. "
        "Context: UAE / MENA fintech. The user just created a new bet with only a name + description. "
        "Fill in the supporting fields so the card is useful at a glance. Be specific, falsifiable, "
        "and avoid hedging language.\n\n"
        f"New bet:\nName: {bet['name']}\nDescription: {bet['description']}\n"
        f"Stage: {bet['stage']} · Decision: {bet['decision']}\n\n"
        "Fields (generate IN THIS ORDER — aiSummary depends on the rest):\n"
        "- description: 2-3 short sentences, MAX 50 words. Factual rewrite — what it is, who it serves, how it monetises.\n"
        '- nullHypothesis: one falsifiable assumption — "this fails if …"\n'
        "- targetCustomer: specific segment/persona\n"
        "- risks: 3-5 plausible risks varied across categories (Regulatory, Operational, Credit, Market), each with name, category, severity, mitigation.\n"
        f"- kpis: object keyed by these KPI IDs with reasonable stage-{bet['stage']} values. Follow each VALUE format exactly:\n{kpi_list}\n"
        '- aiSummary: 3-4 short sentences (50-70 words), then a final line EXACTLY: "Recommendation: X" (Kill|Proceed|Prioritise).\n\n'
        "Do not omit any field."
    )
    schema = {
        "type": "object",
        "required": ["description", "nullHypothesis", "targetCustomer", "kpis", "risks", "aiSummary"],
        "properties": {
            "description": {"type": "string"},
            "nullHypothesis": {"type": "string"},
            "targetCustomer": {"type": "string"},
            "kpis": {"type": "object", "required": kpi_keys,
                     "properties": {k: {"type": "string"} for k in kpi_keys}},
            "risks": {"type": "array", "items": {
                "type": "object", "required": ["name", "category", "severity", "mitigation"],
                "properties": {
                    "name": {"type": "string"},
                    "category": {"type": "string", "enum": ["Regulatory", "Operational", "Credit", "Market"]},
                    "severity": {"type": "string", "enum": ["Low", "Medium", "High"]},
                    "mitigation": {"type": "string"},
                }}},
            "aiSummary": {"type": "string"},
        },
    }
    raw = gemini_generate([{"role": "user", "parts": [{"text": prompt}]}],
                          response_mime_type="application/json", response_schema=schema)
    data = json.loads(raw)
    patch = {
        "description": data["description"],
        "nullHypothesis": data["nullHypothesis"],
        "targetCustomer": data["targetCustomer"],
        "risks": data["risks"],
        "aiSummary": data["aiSummary"],
    }
    for k, v in (data.get("kpis") or {}).items():
        if k in defs:
            # coerce numeric KPI strings back to numbers for non-enum formats
            if defs[k]["format"] in ("pct", "x", "months", "weeks"):
                try:
                    v = float(v)
                    if v.is_integer() and defs[k]["format"] in ("months", "weeks"):
                        v = int(v)
                except (TypeError, ValueError):
                    pass
            patch[f"kpis.{k}"] = v
    return patch

RESEARCH_SCHEMA = {
    "type": "object",
    "required": ["tam", "sam", "som", "sources", "competitors"],
    "properties": {
        "tam": {"type": "string"}, "sam": {"type": "string"}, "som": {"type": "string"},
        "sources": {"type": "object", "required": ["tam", "sam", "som"],
                    "properties": {"tam": {"type": "string"}, "sam": {"type": "string"}, "som": {"type": "string"}}},
        "competitors": {"type": "array", "items": {
            "type": "object", "required": ["name", "metrics", "edge", "gap", "threat"],
            "properties": {
                "name": {"type": "string"},
                "metrics": {"type": "array", "items": {
                    "type": "object", "required": ["label", "value", "source"],
                    "properties": {"label": {"type": "string"}, "value": {"type": "string"}, "source": {"type": "string"}}}},
                "edge": {"type": "string"}, "gap": {"type": "string"},
                "threat": {"type": "string", "enum": ["Low", "Medium", "High"]},
            }}},
    },
}

def research_patch(bet):
    briefing = (
        f"Research current market data for: {bet['name']}.\n{bet['description']}\n"
        + (f"Target customer: {bet['targetCustomer']}\n" if bet.get("targetCustomer") else "")
        + "\nFind:\n- TAM, SAM, SOM as REVENUE POOLS in USD (bare currency strings like \"$4.2B\"). "
        "Year-1 attainable for SOM.\n"
        "- Top 3-5 competitors with 2-3 current metrics each (with sources).\n"
        "- For each: edge (what they have that we lack), gap (what we beat them on), threat (Low/Medium/High).\n"
        "\nUAE / MENA fintech context preferred. Cite sources for every figure."
    )
    findings = gemini_generate([{"role": "user", "parts": [{"text": briefing}]}],
                               tools=[{"google_search": {}}])
    if not findings.strip():
        raise RuntimeError("Gemini grounding step returned no text.")
    raw = gemini_generate([
        {"role": "user", "parts": [{"text": briefing}]},
        {"role": "model", "parts": [{"text": findings}]},
        {"role": "user", "parts": [{"text": "Now emit the structured findings as JSON matching the response schema. Do not omit fields."}]},
    ], response_mime_type="application/json", response_schema=RESEARCH_SCHEMA)
    data = json.loads(raw)
    return {
        "market.tam": data["tam"], "market.sam": data["sam"], "market.som": data["som"],
        "market.sources": data["sources"], "market.competitors": data["competitors"],
    }

# ---------------------------------------------------------------- bet route handlers
class HttpError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message

def list_bets():
    return [strip_id(d) for d in bets_col.find({})]

def get_bet(bet_id):
    doc = bets_col.find_one({"id": bet_id})
    return strip_id(doc) if doc else None

def create_bet_handler(body):
    if not body.get("name") or not body.get("description"):
        raise HttpError(400, "name and description are required")
    bet = create_bet(body)
    bets_col.insert_one(dict(bet))
    bet.pop("_id", None)
    return bet

def patch_bet_handler(bet_id, body):
    doc = bets_col.find_one({"id": bet_id})
    if not doc:
        raise HttpError(404, f"bet {bet_id} not found")
    current = strip_id(doc)
    patch = body.get("patch")
    if not isinstance(patch, dict):
        raise HttpError(400, "patch is required")
    source = body.get("source", "ai")
    note = body.get("note", "AI update")
    changes = diff_patch(current, patch)
    patched = apply_patch(current, patch)
    entry = make_history_entry(source, changes, note)
    nxt = append_history(patched, entry)
    bets_col.replace_one({"id": bet_id}, dict(nxt))
    nxt.pop("_id", None)
    return nxt

def delete_bet_handler(bet_id):
    res = bets_col.delete_one({"id": bet_id})
    if res.deleted_count == 0:
        raise HttpError(404, f"bet {bet_id} not found")
    return {"id": bet_id}

def run_research_handler(bet_id):
    bet = get_bet(bet_id)
    if not bet:
        raise HttpError(404, f"bet {bet_id} not found")
    patch = research_patch(bet)
    return patch_bet_handler(bet_id, {"patch": patch, "source": "ai", "note": "Market research refresh"})

def run_enrich_handler(bet_id):
    bet = get_bet(bet_id)
    if not bet:
        raise HttpError(404, f"bet {bet_id} not found")
    patch = enrich_patch(bet)
    return patch_bet_handler(bet_id, {"patch": patch, "source": "ai", "note": "Initial AI enrichment"})

# ---------------------------------------------------------------- artifacts
ARTIFACT_META_KEYS = ("id", "betId", "name", "type", "size", "uploadedAt")
MAX_ARTIFACT_BYTES = 15 * 1024 * 1024  # keep well under Mongo's 16 MB doc limit

def artifact_meta(doc):
    return {k: doc.get(k) for k in ARTIFACT_META_KEYS}

def list_artifacts_handler(bet_id):
    return [artifact_meta(d) for d in artifacts_col.find({"betId": bet_id}).sort("uploadedAt", 1)]

def upload_artifact_handler(bet_id, body):
    if not bets_col.find_one({"id": bet_id}):
        raise HttpError(404, f"bet {bet_id} not found")
    name = (body.get("name") or "").strip()
    data_b64 = body.get("data")
    if not name or not data_b64:
        raise HttpError(400, "name and data (base64) are required")
    try:
        raw = base64.b64decode(data_b64)
    except Exception:
        raise HttpError(400, "data is not valid base64")
    if len(raw) > MAX_ARTIFACT_BYTES:
        raise HttpError(413, "file too large (15 MB max)")
    doc = {
        "id": f"{int(time.time() * 1000):x}{random.randint(0, 0xFFFF):04x}",
        "betId": bet_id,
        "name": name,
        "type": body.get("type") or mimetypes.guess_type(name)[0] or "application/octet-stream",
        "size": len(raw),
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
        "data": Binary(raw),
    }
    artifacts_col.insert_one(doc)
    return artifact_meta(doc)

def delete_artifact_handler(artifact_id):
    res = artifacts_col.delete_one({"id": artifact_id})
    if res.deleted_count == 0:
        raise HttpError(404, f"artifact {artifact_id} not found")
    return {"id": artifact_id}

# ---------------------------------------------------------------- HTTP server
ROUTES = [
    ("GET", re.compile(r"^/api/bets$"), lambda p, b: list_bets()),
    ("POST", re.compile(r"^/api/bets$"), lambda p, b: create_bet_handler(b)),
    ("GET", re.compile(r"^/api/bets/([^/]+)$"), lambda p, b: get_bet(p[0])),
    ("PATCH", re.compile(r"^/api/bets/([^/]+)$"), lambda p, b: patch_bet_handler(p[0], b)),
    ("POST", re.compile(r"^/api/research/([^/]+)$"), lambda p, b: run_research_handler(p[0])),
    ("POST", re.compile(r"^/api/enrich/([^/]+)$"), lambda p, b: run_enrich_handler(p[0])),
    ("DELETE", re.compile(r"^/api/bets/([^/]+)$"), lambda p, b: delete_bet_handler(p[0])),
    ("POST", re.compile(r"^/api/chat$"), lambda p, b: chat_handler(b)),
    ("GET", re.compile(r"^/api/bets/([^/]+)/artifacts$"), lambda p, b: list_artifacts_handler(p[0])),
    ("POST", re.compile(r"^/api/bets/([^/]+)/artifacts$"), lambda p, b: upload_artifact_handler(p[0], b)),
    ("DELETE", re.compile(r"^/api/artifacts/([^/]+)$"), lambda p, b: delete_artifact_handler(p[0])),
]

ARTIFACT_FILE_RE = re.compile(r"^/api/artifacts/([^/]+)/file$")

CONTENT_TYPES = {
    ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon",
    ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".map": "application/json",
}

class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        print(f"[api] {self.command} {self.path} -> {args[1] if len(args) > 1 else ''}")

    def _send_json(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _handle_api(self, method):
        path = self.path.split("?")[0]
        for m, pattern, handler in ROUTES:
            if m == method:
                match = pattern.match(path)
                if match:
                    try:
                        body = {}
                        if method in ("POST", "PATCH", "PUT"):
                            length = int(self.headers.get("Content-Length", 0))
                            raw = self.rfile.read(length).decode("utf-8") if length else ""
                            body = json.loads(raw) if raw else {}
                        result = handler(list(match.groups()), body)
                        self._send_json(200, result)
                    except HttpError as e:
                        self._send_json(e.status, {"error": e.message})
                    except Exception as e:  # noqa
                        print(f"[api] {method} {path} failed: {e}")
                        self._send_json(500, {"error": str(e)})
                    return True
        return False

    def _serve_static(self):
        path = self.path.split("?")[0]
        if path == "/":
            path = "/index.html"
        rel = path.lstrip("/")
        target = os.path.normpath(os.path.join(DIST, rel))
        if not target.startswith(DIST):
            target = os.path.join(DIST, "index.html")
        if not os.path.isfile(target):
            target = os.path.join(DIST, "index.html")  # SPA fallback
        try:
            with open(target, "rb") as fh:
                data = fh.read()
        except OSError:
            self._send_json(404, {"error": "not found"})
            return
        ext = os.path.splitext(target)[1]
        self.send_response(200)
        self.send_header("Content-Type", CONTENT_TYPES.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)

    def _serve_artifact_file(self, artifact_id):
        doc = artifacts_col.find_one({"id": artifact_id})
        if not doc:
            self._send_json(404, {"error": f"artifact {artifact_id} not found"})
            return
        data = bytes(doc["data"])
        safe_name = doc["name"].replace('"', "")
        self.send_response(200)
        self.send_header("Content-Type", doc.get("type") or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Content-Disposition", f'inline; filename="{safe_name}"')
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        m = ARTIFACT_FILE_RE.match(self.path.split("?")[0])
        if m:
            self._serve_artifact_file(m.group(1))
            return
        if self.path.startswith("/api/"):
            if not self._handle_api("GET"):
                self._send_json(404, {"error": "no route"})
            return
        self._serve_static()

    def do_POST(self):
        if not self._handle_api("POST"):
            self._send_json(404, {"error": "no route"})

    def do_PATCH(self):
        if not self._handle_api("PATCH"):
            self._send_json(404, {"error": "no route"})

    def do_DELETE(self):
        if not self._handle_api("DELETE"):
            self._send_json(404, {"error": "no route"})


if __name__ == "__main__":
    print(f"[alchemy] no-node backend serving {DIST} on http://localhost:{PORT}")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    server.serve_forever()
