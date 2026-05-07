// Applies a JSON patch (flat dot-paths -> new values) to a bet immutably.
// Supports:
//   "decision"                       -> set top-level field
//   "kpis.ltvCac"                    -> nested set
//   "market.competitors[0].threat"   -> array index nested set
//   "risks.add"                      -> push value onto risks array
//   "risks[1].severity"              -> set field on existing risk
// Unknown keys are ignored gracefully.

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function parsePath(path) {
  // Splits "market.competitors[0].threat" -> ["market","competitors",0,"threat"]
  const out = []
  const re = /([^.[\]]+)|\[(\d+)\]/g
  let m
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) out.push(m[1])
    else out.push(Number(m[2]))
  }
  return out
}

function setPath(obj, segments, value) {
  let cur = obj
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

export function applyPatch(bet, patch) {
  if (!patch || typeof patch !== 'object') return bet
  const next = deepClone(bet)

  for (const [rawKey, value] of Object.entries(patch)) {
    if (rawKey.endsWith('.add')) {
      // push to array
      const arrPath = rawKey.slice(0, -'.add'.length)
      const segments = parsePath(arrPath)
      let cur = next
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
    setPath(next, segments, value)
  }

  return next
}
