import type { Bet, Change, HistoryEntry, HistorySource, Patch } from '@/types/bet'

type Segment = string | number

function getPath(obj: unknown, segments: Segment[]): unknown {
  let cur: any = obj
  for (const s of segments) {
    if (cur == null) return undefined
    cur = cur[s]
  }
  return cur
}

function parsePath(path: string): Segment[] {
  const out: Segment[] = []
  const re = /([^.[\]]+)|\[(\d+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) out.push(m[1])
    else out.push(Number(m[2]))
  }
  return out
}

export function diffPatch(prevBet: Bet, patch: Patch): Change[] {
  if (!patch || typeof patch !== 'object') return []
  const changes: Change[] = []
  for (const [rawKey, value] of Object.entries(patch)) {
    if (rawKey.endsWith('.add')) {
      const arrKey = rawKey.slice(0, -'.add'.length)
      changes.push({ path: arrKey, op: 'add', after: value })
      continue
    }
    if (rawKey.endsWith('.remove')) {
      const arrKey = rawKey.slice(0, -'.remove'.length)
      const arr = getPath(prevBet, parsePath(arrKey))
      const removed = Array.isArray(arr)
        ? arr.find(
            (item: any, i: number) =>
              i === value || item?.id === value || item?.name === value
          )
        : undefined
      changes.push({ path: arrKey, op: 'remove', before: removed, after: value })
      continue
    }
    const segments = parsePath(rawKey)
    const before = getPath(prevBet, segments)
    if (JSON.stringify(before) === JSON.stringify(value)) continue
    changes.push({ path: rawKey, op: 'set', before, after: value })
  }
  return changes
}

export function makeHistoryEntry(
  source: HistorySource,
  changes: Change[] | null | undefined,
  note?: string
): HistoryEntry | null {
  if (!changes || changes.length === 0) return null
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    source,
    note,
    changes
  }
}

export function appendHistory(bet: Bet, entry: HistoryEntry | null): Bet {
  if (!entry) return bet
  return { ...bet, history: [entry, ...(bet.history ?? [])] }
}

const FIELD_LABELS: Record<string, string> = {
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

function formatVal(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

export function describeChange(change: Change): { label: string; detail: string } {
  const { path, op, before, after } = change
  if (op === 'add') {
    const namedAfter = (after as { name?: string }) ?? {}
    if (path === 'risks') return { label: 'Risk added', detail: namedAfter.name || '' }
    if (path === 'market.competitors')
      return { label: 'Competitor added', detail: namedAfter.name || '' }
    return {
      label: `${FIELD_LABELS[path] || path} added`,
      detail: typeof after === 'string' ? after : JSON.stringify(after)
    }
  }
  if (op === 'remove') {
    const namedBefore = (before as { name?: string }) ?? {}
    return {
      label: `${FIELD_LABELS[path] || path} removed`,
      detail: namedBefore.name || formatVal(after)
    }
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
