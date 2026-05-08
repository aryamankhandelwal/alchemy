// Helpers for producing human-readable history entries from a patch or
// drag-and-drop move. Each entry is { timestamp, source, changes[] }.

function getPath(obj, segments) {
  let cur = obj
  for (const s of segments) {
    if (cur == null) return undefined
    cur = cur[s]
  }
  return cur
}

function parsePath(path) {
  const out = []
  const re = /([^.[\]]+)|\[(\d+)\]/g
  let m
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) out.push(m[1])
    else out.push(Number(m[2]))
  }
  return out
}

// Turn a patch object into an array of change records, looking up
// the previous values from the bet that was patched.
export function diffPatch(prevBet, patch) {
  if (!patch || typeof patch !== 'object') return []
  const changes = []
  for (const [rawKey, value] of Object.entries(patch)) {
    if (rawKey.endsWith('.add')) {
      const arrKey = rawKey.slice(0, -'.add'.length)
      changes.push({ path: arrKey, op: 'add', after: value })
      continue
    }
    const segments = parsePath(rawKey)
    const before = getPath(prevBet, segments)
    if (JSON.stringify(before) === JSON.stringify(value)) continue
    changes.push({ path: rawKey, op: 'set', before, after: value })
  }
  return changes
}

export function makeHistoryEntry(source, changes, note) {
  if (!changes || changes.length === 0) return null
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    source,
    note,
    changes
  }
}

export function appendHistory(bet, entry) {
  if (!entry) return bet
  return { ...bet, history: [entry, ...(bet.history || [])] }
}

const FIELD_LABELS = {
  stage: 'Stage',
  decision: 'Decision',
  score: 'Score',
  description: 'Description',
  nullHypothesis: 'Null hypothesis',
  targetCustomer: 'Target customer',
  aiSummary: 'AI summary',
  'market.tam': 'Market · TAM',
  'market.sam': 'Market · SAM',
  'market.som': 'Market · SOM',
  risks: 'Risks',
  'risks.add': 'Risks (added)'
}

export function describeChange(change) {
  const { path, op, before, after } = change
  if (op === 'add') {
    if (path === 'risks') return { label: 'Risk added', detail: after?.name || '' }
    if (path === 'market.competitors') return { label: 'Competitor added', detail: after?.name || '' }
    return { label: `${FIELD_LABELS[path] || path} added`, detail: typeof after === 'string' ? after : JSON.stringify(after) }
  }
  if (path.startsWith('kpis.')) {
    return { label: `KPI · ${path.slice(5)}`, detail: `${formatVal(before)} → ${formatVal(after)}` }
  }
  if (path.startsWith('market.competitors[')) {
    return { label: `Competitor · ${path}`, detail: `${formatVal(before)} → ${formatVal(after)}` }
  }
  if (path.startsWith('risks[')) {
    return { label: `Risk · ${path}`, detail: `${formatVal(before)} → ${formatVal(after)}` }
  }
  return {
    label: FIELD_LABELS[path] || path,
    detail: `${formatVal(before)} → ${formatVal(after)}`
  }
}

function formatVal(v) {
  if (v == null) return '—'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}
