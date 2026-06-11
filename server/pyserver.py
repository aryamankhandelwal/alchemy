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
import platform
import re
import subprocess
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

# .env is re-read whenever its mtime changes, so e.g. switching GEMINI_MODEL
# takes effect on the next request without restarting the server.
_env_state = {"mtime": None, "data": ENV}

def env(key, default=None):
    path = os.path.join(ROOT, ".env")
    try:
        mtime = os.path.getmtime(path)
        if mtime != _env_state["mtime"]:
            _env_state["data"] = load_env()
            _env_state["mtime"] = mtime
    except OSError:
        pass
    return _env_state["data"].get(key, default)

# ---------------------------------------------------------------- mongo
client = MongoClient(ENV["MONGODB_URI"], serverSelectionTimeoutMS=20000)
bets_col = client[ENV.get("MONGODB_DB", "alchemy")]["bets"]
bets_col.create_index("id", unique=True)
artifacts_col = client[ENV.get("MONGODB_DB", "alchemy")]["artifacts"]
artifacts_col.create_index("id", unique=True)
artifacts_col.create_index("betId")

# --- One-time seeders (mirrors server/seed.ts): bets from seed/bets.json,
# artifacts from seed/artifacts.json + seed/files/, both written by
# scripts/snapshot-seed.py. Only run when the collection is empty. ---
SEED_DIR = os.path.join(ROOT, "seed")

def seed_if_empty():
    bets_path = os.path.join(SEED_DIR, "bets.json")
    if bets_col.count_documents({}) == 0 and os.path.isfile(bets_path):
        with open(bets_path, encoding="utf-8") as fh:
            seed_bets = json.load(fh)
        if seed_bets:
            bets_col.insert_many(seed_bets)
            print(f"[seed] inserted {len(seed_bets)} bet(s)")
    manifest_path = os.path.join(SEED_DIR, "artifacts.json")
    if artifacts_col.count_documents({}) == 0 and os.path.isfile(manifest_path):
        with open(manifest_path, encoding="utf-8") as fh:
            manifest = json.load(fh)
        docs = []
        for m in manifest:
            file_path = os.path.join(SEED_DIR, "files", m["file"])
            if not os.path.isfile(file_path):
                print(f"[seed] missing artifact file: {m['file']}")
                continue
            doc = {k: v for k, v in m.items() if k != "file"}
            with open(file_path, "rb") as fh:
                doc["data"] = Binary(fh.read())
            docs.append(doc)
        if docs:
            artifacts_col.insert_many(docs)
            print(f"[seed] inserted {len(docs)} artifact(s)")

seed_if_empty()
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

def remove_from_array(arr, value):
    """value can be an index, an item id, an item name, or {id}/{name}."""
    if isinstance(value, int) and not isinstance(value, bool):
        return [x for i, x in enumerate(arr) if i != value]
    if isinstance(value, str):
        key = value
    elif isinstance(value, dict):
        key = value.get("id") or value.get("name")
    else:
        key = None
    if key is None:
        return arr
    return [x for x in arr if not (isinstance(x, dict) and (x.get("id") == key or x.get("name") == key))]

def apply_patch(bet, patch):
    if not isinstance(patch, dict):
        return bet
    nxt = json.loads(json.dumps(bet))  # deep clone
    for raw_key, value in patch.items():
        if raw_key.endswith(".remove"):
            arr_path = raw_key[: -len(".remove")]
            segments = parse_path(arr_path)
            parent = nxt
            for seg in segments[:-1]:
                if parent is None:
                    break
                try:
                    parent = parent[seg]
                except (KeyError, IndexError, TypeError):
                    parent = None
            if isinstance(parent, dict) and isinstance(parent.get(segments[-1]), list):
                parent[segments[-1]] = remove_from_array(parent[segments[-1]], value)
            continue
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
        if raw_key.endswith(".remove"):
            arr_key = raw_key[: -len(".remove")]
            arr = get_path(prev_bet, parse_path(arr_key))
            removed = None
            if isinstance(arr, list):
                for i, item in enumerate(arr):
                    if i == value or (isinstance(item, dict) and (item.get("id") == value or item.get("name") == value)):
                        removed = item
                        break
            changes.append({"path": arr_key, "op": "remove", "before": removed, "after": value})
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

# The patch contract shared by every AI surface that emits bet patches
# (chat, Granola transcript extraction). Mirrors src/lib/systemPrompt.ts.
PATCH_REFERENCE = """Examples of valid patches:
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
   - `customKpis` — array of user-defined KPIs `{ id, name, definition, kill, proceed, prioritise, value }`. Update a value with `customKpis[<index>].value` (find the index in the bet JSON).
   - `initiatives` — array of workstreams `{ id, name, notes, subs: [{ id, name, done, due }], artifactIds }`. Find array indexes in the bet JSON. Full CRUD:
     - Add initiative: `{ "initiatives.add": { "id": "init-<short-slug>", "name": "...", "notes": "", "subs": [], "artifactIds": [] } }` (generate a short unique id).
     - Add sub-initiative: `{ "initiatives[0].subs.add": { "id": "sub-<short-slug>", "name": "...", "done": false, "due": "2026-07-01" or null } }`
     - Edit: `{ "initiatives[0].name": "..." }`, `{ "initiatives[0].notes": "..." }`, `{ "initiatives[0].subs[1].done": true }`, `{ "initiatives[0].subs[1].due": "2026-07-15" }`
     - Delete: `{ "initiatives.remove": "<id or exact name>" }` or `{ "initiatives[0].subs.remove": "<id or exact name>" }` (also works on `risks` / `market.competitors` / `customKpis`).

   KPI value formats: percentages as decimals (0.18 for 18%), LTV/CAC as multiples (2.3), payback as integer months, speed-to-MVP as integer weeks. Enum KPIs use the exact strings from the threshold table (e.g. "Well-defined", "Approaching breakeven", "Fully approved")."""

OUTPUT_CONTRACT = """# Your job

You are an in-app assistant inside Alchemy, the New Horizons portfolio dashboard. The user is a senior operator (Strategy / COO Office). You help them update bets and answer framework questions.

Return a JSON object with two keys:

1. **patch** — either `null` (no update — user is asking a question or chatting), or a flat object whose keys are dot-paths into the bet and values are the new values.

""" + PATCH_REFERENCE + """

2. **reply** — one to two short sentences. Direct, professional tone. Acknowledge what was updated, or answer the question. Do NOT repeat the patch back as text. Do NOT pad with hedging.

Special key — generated documents: if the user asks to change, fix, or regenerate the bet's generated PRD or memo (e.g. "in the PRD, make the success metrics stricter"), return a patch containing ONLY:
`{"docUpdate": {"kind": "prd" or "memo", "instructions": "<the requested change, restated precisely>"}}`
The server applies it to the document and replaces the old PDF. Do not combine docUpdate with bet-field updates in the same patch.

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
    api_key = env("GEMINI_API_KEY")
    model = env("GEMINI_MODEL", "gemini-2.5-flash")
    if not api_key:
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

    url = f"{GEMINI_BASE}/{model}:generateContent?key={api_key}"
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
    if not env("GEMINI_API_KEY"):
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
        patch = parsed.get("patch")
        reply = parsed.get("reply", "")
        if isinstance(patch, dict) and "docUpdate" in patch:
            du = patch.pop("docUpdate") or {}
            if not patch:
                patch = None
            extra, doc_updated = _apply_doc_update(bet, du)
            reply = f"{reply} {extra}".strip() if reply else extra
            return {"patch": patch, "reply": reply, "docUpdated": doc_updated}
        return {"patch": patch, "reply": reply}
    except Exception as e:  # noqa
        return {"patch": None, "reply": f"AI request failed: {e}"}

def _apply_doc_update(bet, du):
    """Regenerate a bet's PRD/memo per the chat instruction; the old PDF is replaced."""
    kind = (du.get("kind") or "").strip().lower()
    if kind not in ("memo", "prd"):
        return ("I couldn't tell whether that referred to the PRD or the memo — please specify.", False)
    label = "PRD" if kind == "prd" else "memo"
    try:
        full_bet = get_bet(bet.get("id")) or bet
        existing = artifacts_col.find_one({"betId": full_bet.get("id"), "gen.kind": kind})
        previous = (existing or {}).get("gen", {}).get("content")
        content = _generate_doc_content(full_bet, kind,
                                        instructions=du.get("instructions"), previous=previous)
        if existing:
            artifacts_col.delete_one({"id": existing["id"]})
        _store_doc_pdf(full_bet, kind, content)
        verb = "Updated" if existing else "Generated"
        return (f"{verb} the {label} — find the new PDF in the Artifacts tab"
                + (" (the previous version was replaced)." if existing else "."), True)
    except Exception as e:  # noqa
        return (f"{label.capitalize()} update failed: {e}", False)

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
    # KPI values are returned separately as suggestions for user approval,
    # never auto-applied to the bet.
    suggested = {}
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
            suggested[k] = v
    return patch, suggested

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

# We ARE Astra Tech — these brands must never be returned as competitors.
# Belt-and-braces: instructed in the prompt AND filtered out of the result.
OWN_BRANDS = ("astra tech", "astratech", "botim", "payby", "quantix")

IDENTITY_BRIEF = (
    "IMPORTANT — who we are: this bet belongs to Astra Tech (UAE), whose products include "
    "Botim, PayBy, and Quantix. These are US — never list Astra Tech, Botim, PayBy, or Quantix "
    "as competitors. Likewise, any company the bet description mentions as a partner, "
    "distribution channel, insurer/bank partner, or supplier is a PARTNER, not a competitor — "
    "exclude them too. Competitors are external companies fighting for the same customers."
)

def is_own_brand(name):
    n = str(name).lower()
    return any(b in n for b in OWN_BRANDS)

def research_patch(bet):
    briefing = (
        f"Research current market data for: {bet['name']}.\n{bet['description']}\n"
        + (f"Target customer: {bet['targetCustomer']}\n" if bet.get("targetCustomer") else "")
        + "\n" + IDENTITY_BRIEF + "\n"
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
    competitors = [c for c in (data.get("competitors") or []) if not is_own_brand(c.get("name", ""))]
    return {
        "market.tam": data["tam"], "market.sam": data["sam"], "market.som": data["som"],
        "market.sources": data["sources"], "market.competitors": competitors,
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
    patch, suggested = enrich_patch(bet)
    updated = patch_bet_handler(bet_id, {"patch": patch, "source": "ai", "note": "Initial AI enrichment"})
    return {"bet": updated, "suggestedKpis": suggested}

# ---------------------------------------------------------------- granola (granolaExtract.ts)
GRANOLA_RESPONSE_SCHEMA = {
    "type": "object",
    "required": ["meetingTitle", "proposals"],
    "properties": {
        "meetingTitle": {"type": "string"},
        "proposals": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["kind", "betId", "betName", "summary", "patchJson", "newBet", "quote", "speaker"],
                "properties": {
                    "kind": {"type": "string", "enum": ["edit", "new_bet"]},
                    "betId": {"type": "string", "nullable": True},
                    "betName": {"type": "string"},
                    "summary": {"type": "string"},
                    "patchJson": {"type": "string", "nullable": True},
                    "newBet": {
                        "type": "object",
                        "nullable": True,
                        "required": ["name", "description", "stage", "decision"],
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "stage": {"type": "string", "enum": ["Evaluation", "Pilot", "Scale"]},
                            "decision": {"type": "string", "enum": ["Prioritise", "Proceed", "Kill", "Killed"]},
                        },
                    },
                    "quote": {"type": "string"},
                    "speaker": {"type": "string", "nullable": True},
                },
            },
        },
    },
}

def _slim_bet(bet):
    return {
        "id": bet.get("id"),
        "name": bet.get("name"),
        "description": bet.get("description"),
        "stage": bet.get("stage"),
        "decision": bet.get("decision"),
        "kpis": bet.get("kpis") or {},
        "customKpis": [{"name": c.get("name"), "value": c.get("value")} for c in (bet.get("customKpis") or [])],
        "risks": [r.get("name") for r in (bet.get("risks") or [])],
        "initiatives": [
            {"id": i.get("id"), "name": i.get("name"),
             "subs": [{"id": s.get("id"), "name": s.get("name"), "done": s.get("done")} for s in (i.get("subs") or [])]}
            for i in (bet.get("initiatives") or [])
        ],
    }

def _norm_text(s):
    return re.sub(r"\s+", " ", str(s)).strip().lower()

def granola_extract_handler(body):
    transcript = (body.get("transcript") or "").strip()
    if len(transcript) < 40:
        raise HttpError(400, "transcript is required (paste the meeting transcript)")
    meeting_title = (body.get("meetingTitle") or "").strip()

    bets = list_bets()
    primer = FRAMEWORK_PRIMER.format(
        evaluation=render_kpi_table("Evaluation"),
        pilot=render_kpi_table("Pilot"),
        scale=render_kpi_table("Scale"),
    )
    job = (
        "# Your job\n\n"
        "You are the meeting-sync assistant inside Alchemy, Astra Tech's New Horizons portfolio dashboard. "
        "Below is the transcript of an R&D squad meeting. Extract every concrete, actionable update to the "
        "portfolio that was stated or clearly decided in the meeting, as a list of proposals. Each proposal "
        "is later reviewed and approved by a human — propose, don't decide.\n\n"
        "Proposal kinds:\n"
        '1. **edit** — a change to an existing bet (set `kind` to "edit", `betId`/`betName` to the bet from '
        "the portfolio below, `newBet` to null). Put the change in `patchJson`: a JSON-ENCODED STRING of a "
        "patch object following this contract:\n\n" + PATCH_REFERENCE + "\n\n"
        '   Stage/decision moves are plain patches too: { "stage": "Pilot", "decision": "Proceed" }.\n'
        '2. **new_bet** — a genuinely new product idea/initiative discussed as worth tracking (set `kind` to '
        '"new_bet", `betId` and `patchJson` to null, fill `newBet` with name, a 1-2 sentence description from '
        "the discussion, and the stage/decision it should start at — usually Evaluation/Proceed).\n\n"
        "For EVERY proposal also provide:\n"
        '- `summary` — one plain-English sentence describing the change (e.g. "Update LTV/CAC to 2.3× on BNPL for SMEs").\n'
        "- `quote` — the supporting evidence: the transcript line that MOST DIRECTLY states this specific change, "
        "copied CHARACTER-FOR-CHARACTER (do not paraphrase, fix typos, or merge separate lines). Keep it under ~40 words.\n"
        "- `speaker` — who said it, if the transcript identifies speakers; otherwise null.\n\n"
        "Rules:\n"
        "- Only propose changes explicitly supported by the transcript. No inferring KPI values that weren't "
        'stated. Vague sentiment ("retention looks rough") is NOT a KPI update — skip it or, if a decision was made, capture that.\n'
        "- One proposal per logical change. A KPI update and a decision change discussed together are two "
        "proposals (separate quotes if separate statements).\n"
        "- Match bets by name/context against the portfolio below; use the exact `id`. If a mentioned "
        "initiative matches no existing bet and is substantive, make it a new_bet proposal.\n"
        "- If the meeting contains nothing actionable, return an empty proposals array."
    )
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    prompt = "\n\n---\n\n".join([
        primer,
        job,
        "# Current portfolio (slim JSON)\n\n```json\n" + json.dumps([_slim_bet(b) for b in bets], indent=2) + "\n```",
        "# Meeting" + (f": {meeting_title}" if meeting_title else "") + "\n\nTranscript:\n\n" + transcript,
        f"Today's date is {today}.",
    ])

    raw = gemini_generate([{"role": "user", "parts": [{"text": prompt}]}],
                          response_mime_type="application/json",
                          response_schema=GRANOLA_RESPONSE_SCHEMA, temperature=0.1)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HttpError(502, f"Gemini returned non-JSON output: {raw[:200]}")

    bet_ids = {b.get("id") for b in bets}
    norm_transcript = _norm_text(transcript)
    proposals = []
    for p in data.get("proposals") or []:
        kind = p.get("kind")
        patch = None
        if kind == "edit":
            # Drop edits the UI couldn't apply: unknown bet or unparseable patch.
            if not p.get("betId") or p["betId"] not in bet_ids or not p.get("patchJson"):
                continue
            try:
                patch = json.loads(p["patchJson"])
            except (json.JSONDecodeError, TypeError):
                continue
            if not isinstance(patch, dict) or not patch:
                continue
        elif kind == "new_bet":
            nb = p.get("newBet")
            if not isinstance(nb, dict) or not nb.get("name"):
                continue
        else:
            continue
        quote = p.get("quote") or ""
        proposals.append({
            "id": "gp-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=10)),
            "kind": kind,
            "betId": p.get("betId") if kind == "edit" else None,
            "betName": p.get("betName") or "",
            "summary": p.get("summary") or "",
            "patch": patch,
            "newBet": p.get("newBet") if kind == "new_bet" else None,
            "evidence": {"quote": quote, "speaker": p.get("speaker")},
            "quoteVerified": _norm_text(quote) in norm_transcript,
        })

    return {"meetingTitle": data.get("meetingTitle") or meeting_title or "Meeting", "proposals": proposals}

# ---------------------------------------------------------------- score (score.ts)
def _num_band(v, kill, prio, higher_better=True):
    """Mirror kpiSchema.ts numeric evaluators: strict < / > at the kill edge."""
    v = float(v)
    if higher_better:
        return "Kill" if v < kill else ("Prioritise" if v >= prio else "Proceed")
    return "Kill" if v > kill else ("Prioritise" if v <= prio else "Proceed")

KPI_EVAL = {
    "Evaluation": {
        "demandSignal": lambda v: _num_band(v, 0.05, 0.15),
        "problemSeverity": lambda v: {"Low": "Kill", "Medium": "Proceed", "High": "Prioritise"}.get(str(v), "Proceed"),
        "marketClarity": lambda v: {"Unclear": "Kill", "Partial": "Proceed", "Well-defined": "Prioritise"}.get(str(v), "Proceed"),
        "speedToMvp": lambda v: _num_band(v, 26, 6, higher_better=False),
    },
    "Pilot": {
        "activationRate": lambda v: _num_band(v, 0.2, 0.4),
        "conversionRate": lambda v: _num_band(v, 0.05, 0.15),
        "retentionD30": lambda v: _num_band(v, 0.2, 0.4),
        "ltvCac": lambda v: _num_band(v, 1.0, 2.0),
        "riskSignals": lambda v: {"High": "Kill", "Moderate": "Proceed", "Low": "Prioritise"}.get(str(v), "Proceed"),
        "operationalLoad": lambda v: {"High": "Kill", "Medium": "Proceed", "Low": "Prioritise"}.get(str(v), "Proceed"),
    },
    "Scale": {
        "ltvCac": lambda v: _num_band(v, 1.5, 2.5),
        "contributionMargin": lambda v: {"Negative": "Kill", "Approaching breakeven": "Proceed", "Positive + improving": "Prioritise"}.get(str(v), "Proceed"),
        "paybackMonths": lambda v: _num_band(v, 18, 9, higher_better=False),
        "riskScalability": lambda v: {"Unstable": "Kill", "Stabilising": "Proceed", "Predictable": "Prioritise"}.get(str(v), "Proceed"),
        "regulatoryReadiness": lambda v: {"Blocked": "Kill", "Partial": "Proceed", "Fully approved": "Prioritise"}.get(str(v), "Proceed"),
        "operationalScalability": lambda v: {"Breaks": "Kill", "Needs optimisation": "Proceed", "Scales cleanly": "Prioritise"}.get(str(v), "Proceed"),
        "strategicFit": lambda v: {"Weak": "Kill", "Adjacent": "Proceed", "Strong": "Prioritise"}.get(str(v), "Proceed"),
    },
}

def format_kpi(fmt, v):
    try:
        if fmt == "pct":
            return f"{round(float(v) * 100)}%"
        if fmt == "x":
            return f"{float(v):.1f}x"
        if fmt == "months":
            return f"{v} months"
        if fmt == "weeks":
            return f"{v} weeks"
    except (TypeError, ValueError):
        pass
    return str(v)

def score_bet(bet):
    stage = bet.get("stage", "Evaluation")
    # Pre-evaluate each KPI with the same logic as the UI dots so the model
    # never re-derives band boundaries (it gets edges like "exactly 5%" wrong).
    kpis = bet.get("kpis") or {}
    hidden = set(bet.get("hiddenKpis") or [])
    lines = []
    for k, d in KPI_SCHEMA.get(stage, {}).items():
        if k in hidden:
            continue
        v = kpis.get(k)
        if v is None or v == "":
            verdict = "NOT ENTERED"
        else:
            band = KPI_EVAL.get(stage, {}).get(k, lambda _v: "Proceed")(v)
            verdict = f"{format_kpi(d['format'], v)} -> {band.upper()}"
        lines.append(f"  - {k} ({d['label']}): {verdict}")
    for c in bet.get("customKpis") or []:
        v = c.get("value")
        val = "NOT ENTERED" if v in (None, "") else str(v)
        lines.append(
            f"  - {c.get('name')} (custom, judge yourself): value {val}. "
            f"Bands: kill {c.get('kill')} | proceed {c.get('proceed')} | prioritise {c.get('prioritise')}"
        )
    kpi_list = "\n".join(lines)
    # Strip prior scoring outputs (aiSummary/scoreRationale/score/rice) and raw kpis: they
    # are what we're regenerating — leaving them in makes the model parrot stale verdicts.
    bet_slim = {k: v for k, v in bet.items()
                if k not in ("history", "kpis", "customKpis", "aiSummary", "scoreRationale", "score", "rice")}
    prompt = (
        "You are the investment-committee scorer inside Alchemy, Astra Tech's New Horizons "
        f"portfolio dashboard (UAE / MENA fintech). Rate this bet at its CURRENT stage ({stage}) "
        "on the four RICE dimensions, each an integer 1-10 with a one-line justification:\n\n"
        "- reach: how much of the addressable market/customer base this could plausibly touch "
        "(ground it in TAM/SAM/SOM, target customer, and distribution).\n"
        "- impact: depth of value per customer plus strategic upside for Astra Tech if it works "
        "(monetisation, moat, portfolio fit).\n"
        "- confidence: strength of the EVIDENCE that reach and impact are real. The KPI verdicts below "
        "have been PRE-EVALUATED by the app into KILL / PROCEED / PRIORITISE — they are final; never "
        "re-judge a value as borderline. Mostly PRIORITISE => high confidence (8-10); mostly PROCEED => "
        "mid (5-7); each KILL verdict is strong negative evidence that should pull confidence down "
        "1-3 points — but ONE kill KPI among healthy ones is a flag to investigate, NOT a veto on the "
        "whole bet. KPIs NOT ENTERED are neutral (the bet may just be early); many missing KPIs cap "
        "confidence around 6. High-severity risks with weak mitigation also lower confidence; credible "
        "mitigations largely neutralise a risk.\n"
        "- effort: cost and complexity to deliver from here (build time, operational load, regulatory "
        "path). 1 = trivial, 10 = multi-year heavy build. Use speed-to-MVP / operational / regulatory "
        "KPIs where present.\n\n"
        f"Stage-{stage} KPI verdicts (final):\n{kpi_list}\n\n"
        f"The bet (full JSON):\n{json.dumps(bet_slim, indent=2)}\n\n"
        "The app computes the 0-100 score from your ratings as "
        "100 x (reach x impact x confidence x (11 - effort) / 10000)^0.25 — roughly: all 5s ~ 52, "
        "strong across the board >= 75, weak across the board <= 40.\n\n"
        "Return JSON only with these fields:\n"
        "- reach, impact, confidence, effort: integers 1-10.\n"
        "- reachWhy, impactWhy, confidenceWhy, effortWhy: one short sentence each naming the specific "
        "KPIs, risks, or market facts behind the rating.\n"
        "- aiSummary: a rewrite of the bet's aiSummary CONSISTENT with your ratings. 3-4 short "
        "sentences (50-70 words) synthesising the bet, then a final new line with EXACTLY "
        '"Recommendation: X" where X is Kill, Proceed, or Prioritise — aligned with the computed '
        "score band (below ~40 leans Kill, ~40-75 Proceed, above ~75 Prioritise)."
    )
    raw = gemini_generate(
        [{"role": "user", "parts": [{"text": prompt}]}],
        response_mime_type="application/json",
        response_schema={
            "type": "object",
            "required": ["reach", "reachWhy", "impact", "impactWhy",
                         "confidence", "confidenceWhy", "effort", "effortWhy", "aiSummary"],
            "properties": {
                "reach": {"type": "integer"},
                "reachWhy": {"type": "string"},
                "impact": {"type": "integer"},
                "impactWhy": {"type": "string"},
                "confidence": {"type": "integer"},
                "confidenceWhy": {"type": "string"},
                "effort": {"type": "integer"},
                "effortWhy": {"type": "string"},
                "aiSummary": {"type": "string"},
            },
        },
    )
    data = json.loads(raw)

    def _dim(key):
        return max(1, min(10, int(round(float(data[key])))))

    rice = {"reach": _dim("reach"), "impact": _dim("impact"),
            "confidence": _dim("confidence"), "effort": _dim("effort")}
    # Geometric blend, effort inverted — mirrors riceToScore in server/score.ts.
    product = rice["reach"] * rice["impact"] * rice["confidence"] * (11 - rice["effort"]) / 10000
    score = int(round(100 * product ** 0.25))
    rationale = "\n".join([
        f"- Reach {rice['reach']}/10 — {data.get('reachWhy', '')}",
        f"- Impact {rice['impact']}/10 — {data.get('impactWhy', '')}",
        f"- Confidence {rice['confidence']}/10 — {data.get('confidenceWhy', '')}",
        f"- Effort {rice['effort']}/10 (lower is better) — {data.get('effortWhy', '')}",
    ])
    return score, rationale, str(data.get("aiSummary", "")), rice

def kpi_def_handler(body):
    name = (body.get("name") or "").strip()
    bet = body.get("bet") or {}
    if not name:
        raise HttpError(400, "name is required")
    prompt = (
        f'Define the KPI "{name}" as ONE ultra-short fragment, 8 words max — a table caption, '
        'not a sentence. Good examples: "Time to first usable version." / "Customer value vs '
        'acquisition cost." / "% of users completing core action." No "this measures", no "why it '
        f"matters\", no preamble, no markdown. Context (do not mention it): {bet.get('name', '')} at "
        f"{bet.get('stage', 'Evaluation')} stage."
    )
    text = gemini_generate([{"role": "user", "parts": [{"text": prompt}]}]).strip()
    if not text:
        raise HttpError(502, "Gemini returned an empty definition.")
    return {"definition": text}

def run_score_handler(bet_id):
    bet = get_bet(bet_id)
    if not bet:
        raise HttpError(404, f"bet {bet_id} not found")
    score, rationale, ai_summary, rice = score_bet(bet)
    return patch_bet_handler(bet_id, {
        "patch": {"score": score, "scoreRationale": rationale, "aiSummary": ai_summary, "rice": rice},
        "source": "ai",
        "note": "Score refresh",
    })

# ---------------------------------------------------------------- artifacts
ARTIFACT_META_KEYS = ("id", "betId", "name", "type", "size", "uploadedAt")
MAX_ARTIFACT_BYTES = 15 * 1024 * 1024  # keep well under Mongo's 16 MB doc limit

def artifact_meta(doc):
    meta = {k: doc.get(k) for k in ARTIFACT_META_KEYS}
    meta["canConvert"] = bool(doc.get("gen"))
    return meta

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

# ---------------------------------------------------------------- doc generation (Memo / PRD)
import docgen

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

def _store_generated_artifact(bet_id, name, mime, raw, gen=None):
    doc = {
        "id": f"{int(time.time() * 1000):x}{random.randint(0, 0xFFFF):04x}",
        "betId": bet_id,
        "name": name,
        "type": mime,
        "size": len(raw),
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
        "data": Binary(raw),
    }
    if gen:
        # structured content the doc was rendered from — enables docx conversion
        # and AI-driven revisions without re-deriving from scratch
        doc["gen"] = gen
    artifacts_col.insert_one(doc)
    return artifact_meta(doc)

def _generate_doc_content(bet, kind, instructions=None, previous=None):
    bet_sans_history = {k: v for k, v in bet.items() if k != "history"}
    kpi_lines = render_kpi_table(bet.get("stage", "Evaluation"))
    bet_json = json.dumps(bet_sans_history, ensure_ascii=False, indent=2)
    schema = docgen.PRD_SCHEMA if kind == "prd" else docgen.MEMO_SCHEMA
    if previous and instructions:
        prompt = docgen.revise_prompt(kind, json.dumps(previous, ensure_ascii=False, indent=2),
                                      instructions, bet_json, kpi_lines)
    else:
        prompt = (docgen.prd_prompt if kind == "prd" else docgen.memo_prompt)(bet_json, kpi_lines)
        if instructions:
            prompt += f"\n\nAdditional instructions from the user: {instructions}"
    raw = gemini_generate([{"role": "user", "parts": [{"text": prompt}]}],
                          response_mime_type="application/json", response_schema=schema)
    return json.loads(raw)

def _store_doc_pdf(bet, kind, content):
    kpi_defs = KPI_SCHEMA.get(bet.get("stage", "Evaluation"), {})
    pdf_bytes = docgen.build_pdf(kind, content, bet, kpi_defs)
    label = "PRD" if kind == "prd" else "Executive Memo"
    name = f"{bet.get('name', 'Bet')} - {label}.pdf"
    return _store_generated_artifact(bet["id"], name, "application/pdf", pdf_bytes,
                                     gen={"kind": kind, "content": content})

def generate_doc_handler(bet_id, body):
    kind = (body.get("kind") or "").strip().lower()
    if kind not in ("memo", "prd"):
        raise HttpError(400, "kind must be 'memo' or 'prd'")
    bet = get_bet(bet_id)
    if not bet:
        raise HttpError(404, f"bet {bet_id} not found")
    content = _generate_doc_content(bet, kind)
    return {"artifacts": [_store_doc_pdf(bet, kind, content)]}

def convert_docx_handler(artifact_id):
    doc = artifacts_col.find_one({"id": artifact_id})
    if not doc:
        raise HttpError(404, f"artifact {artifact_id} not found")
    gen = doc.get("gen")
    if not gen:
        raise HttpError(400, "only AI-generated documents can be converted to docx")
    bet = get_bet(doc["betId"]) or {"id": doc["betId"], "name": "Bet"}
    kpi_defs = KPI_SCHEMA.get(bet.get("stage", "Evaluation"), {})
    docx_bytes = docgen.build_docx(gen["kind"], gen["content"], bet, kpi_defs)
    name = doc["name"]
    name = name[:-4] + ".docx" if name.lower().endswith(".pdf") else name + ".docx"
    return _store_generated_artifact(doc["betId"], name, DOCX_MIME, docx_bytes)

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
    ("POST", re.compile(r"^/api/score/([^/]+)$"), lambda p, b: run_score_handler(p[0])),
    ("POST", re.compile(r"^/api/kpi-def$"), lambda p, b: kpi_def_handler(b)),
    ("POST", re.compile(r"^/api/granola/extract$"), lambda p, b: granola_extract_handler(b)),
    ("POST", re.compile(r"^/api/bets/([^/]+)/generate-doc$"), lambda p, b: generate_doc_handler(p[0], b)),
    ("POST", re.compile(r"^/api/artifacts/([^/]+)/docx$"), lambda p, b: convert_docx_handler(p[0])),
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
        # headers are latin-1; ASCII fallback + RFC 5987 filename* for the real UTF-8 name
        name = doc["name"].replace('"', "")
        ascii_name = name.encode("ascii", "replace").decode("ascii").replace("?", "_")
        utf8_name = urllib.request.quote(name)
        self.send_response(200)
        self.send_header("Content-Type", doc.get("type") or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header(
            "Content-Disposition",
            f"inline; filename=\"{ascii_name}\"; filename*=UTF-8''{utf8_name}",
        )
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


# ---------------------------------------------------------------- frontend rebuild (esbuild)
SRC = os.path.join(ROOT, "src")


def _esbuild_bin():
    machine = platform.machine().lower()
    arch = "arm64" if machine in ("arm64", "aarch64") else "x64" if machine in ("amd64", "x86_64") else None
    if not arch:
        return None
    system = platform.system().lower()
    if system == "windows":
        plat, name = "win32", "esbuild.exe"
    elif system == "darwin":
        plat, name = "darwin", "esbuild"
    elif system == "linux":
        plat, name = "linux", "esbuild"
    else:
        return None
    path = os.path.join(ROOT, "node_modules", "@esbuild", f"{plat}-{arch}", name)
    return path if os.path.isfile(path) else None


def _dist_bundle_path():
    index_path = os.path.join(DIST, "index.html")
    if os.path.isfile(index_path):
        with open(index_path, encoding="utf-8") as fh:
            m = re.search(r'src="/assets/([^"]+\.js)"', fh.read())
        if m:
            return os.path.join(DIST, "assets", m.group(1))
    return os.path.join(DIST, "assets", "index-app.js")


def _latest_src_mtime():
    latest = 0.0
    for dirpath, _, files in os.walk(SRC):
        for name in files:
            if name.endswith((".ts", ".tsx")):
                latest = max(latest, os.path.getmtime(os.path.join(dirpath, name)))
    return latest


def maybe_rebuild_frontend():
    """Rebuild dist/ with esbuild when src/ is newer than the bundled JS."""
    if env("SKIP_FRONTEND_REBUILD", "").lower() in ("1", "true", "yes"):
        return
    bundle = _dist_bundle_path()
    src_mtime = _latest_src_mtime()
    if src_mtime == 0:
        return
    if os.path.isfile(bundle) and src_mtime <= os.path.getmtime(bundle):
        return
    esbuild = _esbuild_bin()
    if not esbuild:
        print("[alchemy] dist/ is stale — esbuild binary not found; run npm run build")
        return
    os.makedirs(os.path.dirname(bundle), exist_ok=True)
    print("[alchemy] rebuilding frontend (src newer than dist)...")
    cmd = [
        esbuild,
        os.path.join(SRC, "main.tsx"),
        "--bundle",
        "--format=esm",
        "--jsx=automatic",
        "--minify",
        '--define:process.env.NODE_ENV="production"',
        "--alias:@=./src",
        "--loader:.svg=dataurl",
        f"--outfile={bundle}",
    ]
    try:
        subprocess.run(cmd, cwd=ROOT, check=True, capture_output=True, text=True)
        print(f"[alchemy] frontend rebuilt -> {os.path.relpath(bundle, ROOT)}")
    except subprocess.CalledProcessError as e:
        print(f"[alchemy] frontend rebuild failed: {e.stderr or e.stdout or e}")
    except OSError as e:
        print(f"[alchemy] frontend rebuild failed: {e}")


if __name__ == "__main__":
    maybe_rebuild_frontend()
    print(f"[alchemy] no-node backend serving {DIST} on http://localhost:{PORT}")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    server.serve_forever()
