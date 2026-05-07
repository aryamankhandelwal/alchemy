const TONE = {
  Prioritise: 'bg-ok',
  Proceed: 'bg-warn',
  Kill: 'bg-bad'
}

export function KPIDot({ status, size = 8 }) {
  const cls = TONE[status] ?? 'bg-dim'
  return <span className={`inline-block rounded-full ${cls}`} style={{ width: size, height: size }} />
}
