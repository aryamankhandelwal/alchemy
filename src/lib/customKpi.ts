import type { CustomKpi, KpiStatus } from '@/types/bet'

/** First number in a threshold string, e.g. "<5%" → 5, "1.5-2.5x" → 1.5. */
function firstNumber(s: string): number | null {
  const m = String(s).match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

/**
 * Best-effort status for a user-defined KPI. Numeric thresholds are compared by
 * their first number (direction inferred from kill vs prioritise); non-numeric
 * thresholds fall back to exact text match against the band labels. Returns
 * null when the value is empty or the thresholds can't be interpreted.
 */
export function evaluateCustomKpi(kpi: CustomKpi): KpiStatus | null {
  const { value } = kpi
  if (value === null || value === undefined || value === '') return null

  const v = firstNumber(String(value))
  const killN = firstNumber(kpi.kill)
  const prioN = firstNumber(kpi.prioritise)

  if (v !== null && killN !== null && prioN !== null && killN !== prioN) {
    const higherIsBetter = prioN > killN
    if (higherIsBetter) {
      if (v < killN) return 'Kill'
      if (v >= prioN) return 'Prioritise'
      return 'Proceed'
    }
    if (v > killN) return 'Kill'
    if (v <= prioN) return 'Prioritise'
    return 'Proceed'
  }

  // enum-style thresholds: match the value text against a band label
  const text = String(value).trim().toLowerCase()
  if (text && kpi.kill.trim().toLowerCase() === text) return 'Kill'
  if (text && kpi.proceed.trim().toLowerCase() === text) return 'Proceed'
  if (text && kpi.prioritise.trim().toLowerCase() === text) return 'Prioritise'
  return null
}
