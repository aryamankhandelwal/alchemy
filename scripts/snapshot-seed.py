"""Snapshot the live Mongo portfolio into the seed data.

Writes:
  - src/data/bets.ts     (node seeder)  — full bets minus history
  - seed/bets.json       (pyserver seeder) — same content
  - seed/artifacts.json  (both seeders)  — artifact metadata manifest
  - seed/files/<id>__<name>              — artifact binaries

Run: py scripts/snapshot-seed.py
"""
import json
import os
import re
import sys
from datetime import date

import dns.resolver

_r = dns.resolver.Resolver(configure=False)
_r.nameservers = ["1.1.1.1", "8.8.8.8", "1.0.0.1"]
dns.resolver.default_resolver = _r

from pymongo import MongoClient

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED_DIR = os.path.join(ROOT, "seed")
FILES_DIR = os.path.join(SEED_DIR, "files")

env = {}
for line in open(os.path.join(ROOT, ".env"), encoding="utf-8"):
    m = re.match(r"([A-Z_]+)\s*=\s*(.+)$", line.strip())
    if m:
        env[m.group(1)] = m.group(2).strip()

client = MongoClient(env["MONGODB_URI"], serverSelectionTimeoutMS=20000)
db = client[env.get("MONGODB_DB", "alchemy")]

bets = []
for doc in db["bets"].find({}):
    doc.pop("_id", None)
    doc.pop("history", None)  # histories start clean on a fresh seed
    bets.append(doc)

os.makedirs(FILES_DIR, exist_ok=True)

manifest = []
for art in db["artifacts"].find({}):
    data = bytes(art["data"])
    safe = re.sub(r'[<>:"/\\|?*]', "_", art["name"])
    fname = f"{art['id']}__{safe}"
    with open(os.path.join(FILES_DIR, fname), "wb") as fh:
        fh.write(data)
    manifest.append({
        "id": art["id"],
        "betId": art["betId"],
        "name": art["name"],
        "type": art.get("type"),
        "size": art["size"],
        "uploadedAt": art["uploadedAt"],
        "file": fname,
    })

with open(os.path.join(SEED_DIR, "bets.json"), "w", encoding="utf-8") as fh:
    json.dump(bets, fh, indent=2, ensure_ascii=False)

with open(os.path.join(SEED_DIR, "artifacts.json"), "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, indent=2, ensure_ascii=False)

bets_ts = (
    "// Seed data inserted by server/seed.ts the first time the bets collection is\n"
    f"// empty. Snapshot of the live portfolio taken {date.today().isoformat()} via\n"
    "// scripts/snapshot-seed.py — re-run that script to refresh this file plus the\n"
    "// seed/ folder (artifacts manifest + binaries). Histories start clean.\n"
    "\n"
    "import type { Bet } from '@/types/bet'\n"
    "\n"
    f"export const SEED_BETS: Bet[] = {json.dumps(bets, indent=2, ensure_ascii=False)}\n"
)
with open(os.path.join(ROOT, "src", "data", "bets.ts"), "w", encoding="utf-8") as fh:
    fh.write(bets_ts)

print(f"snapshot: {len(bets)} bet(s), {len(manifest)} artifact(s), "
      f"{sum(m['size'] for m in manifest)} artifact bytes")
