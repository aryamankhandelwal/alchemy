import type { Bet, Patch } from '@/types/bet'

type Segment = string | number
type Mutable = Record<string, any> | any[]

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
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

function setPath(obj: Mutable, segments: Segment[], value: unknown): void {
  let cur: any = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    if (cur[seg] === undefined || cur[seg] === null) {
      const next = segments[i + 1]
      cur[seg] = typeof next === 'number' ? [] : {}
    }
    cur = cur[seg]
  }
  cur[segments[segments.length - 1]] = value
}

export function applyPatch(bet: Bet, patch: Patch): Bet {
  if (!patch || typeof patch !== 'object') return bet
  const next = deepClone(bet) as Bet

  for (const [rawKey, value] of Object.entries(patch)) {
    if (rawKey.endsWith('.add')) {
      const arrPath = rawKey.slice(0, -'.add'.length)
      const segments = parsePath(arrPath)
      let cur: any = next
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        if (cur[seg] === undefined || cur[seg] === null) cur[seg] = []
        cur = cur[seg]
      }
      if (Array.isArray(cur)) cur.push(value)
      continue
    }

    const segments = parsePath(rawKey)
    if (segments.length === 0) continue
    setPath(next as unknown as Mutable, segments, value)
  }

  return next
}
