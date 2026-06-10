/** '2026-06-10' → '10 Jun 2026'; null/invalid → '—' */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Date range label, e.g. '10 Jun 2026 → 24 Aug 2026'; both missing → null */
export function formatRange(
  start: string | null | undefined,
  end: string | null | undefined
): string | null {
  if (!start && !end) return null
  return `${formatDate(start)} → ${formatDate(end)}`
}
