// On-demand bet scoring. Sends the full bet (summary, market, KPIs vs the
// stage thresholds, risks, timeline) plus the attached-artifact list to Gemini
// and gets back a 0-100 score with a one-line rationale.

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import { getKpiDefs } from '../src/lib/kpiSchema'
import type { Bet } from '../src/types/bet'
import { envVar } from './env'

const ScoreSchema = z.object({
  score: z.number().min(0).max(100),
  rationale: z.string(),
  aiSummary: z.string()
})

export interface ScoreResult {
  score: number
  rationale: string
  aiSummary: string
}

export async function scoreBet(bet: Bet): Promise<ScoreResult> {
  const apiKey = envVar('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.')
  const model = envVar('GEMINI_MODEL') || 'gemini-2.5-flash'
  const ai = new GoogleGenAI({ apiKey })

  const defs = getKpiDefs(bet.stage)
  // Pre-evaluate each KPI with the same logic as the UI dots so the model
  // never re-derives band boundaries (it gets edge cases like "exactly 5%" wrong).
  const hidden = new Set(bet.hiddenKpis ?? [])
  const kpiLines = Object.entries(defs)
    .filter(([key]) => !hidden.has(key))
    .map(([key, d]) => {
      const v = bet.kpis?.[key]
      const verdict =
        v === undefined || v === null || v === ''
          ? 'NOT ENTERED'
          : `${d.formatValue(v)} → ${d.evaluate(v).toUpperCase()}`
      return `  - ${key} (${d.label}): ${verdict}`
    })
  for (const c of bet.customKpis ?? []) {
    const val = c.value === undefined || c.value === null || c.value === '' ? 'NOT ENTERED' : String(c.value)
    kpiLines.push(
      `  - ${c.name} (custom, judge yourself): value ${val}. ` +
        `Bands: kill ${c.kill} | proceed ${c.proceed} | prioritise ${c.prioritise}`
    )
  }
  const kpiList = kpiLines.join('\n')

  // Strip prior scoring outputs (aiSummary/scoreRationale/score) and raw kpis: they are
  // what we're regenerating — leaving them in makes the model parrot stale verdicts.
  const {
    history: _history,
    kpis: _kpis,
    customKpis: _customKpis,
    aiSummary: _aiSummary,
    scoreRationale: _scoreRationale,
    score: _score,
    ...betSansHistory
  } = bet

  const prompt =
    `You are the investment-committee scorer inside Alchemy, Astra Tech's New Horizons ` +
    `portfolio dashboard (UAE / MENA fintech). Score this bet 0-100 on how strong it looks ` +
    `at its CURRENT stage (${bet.stage}).\n\n` +
    `Scoring rules:\n` +
    `1. The entered KPIs are the primary driver. Each KPI below has been PRE-EVALUATED by the ` +
    `app into KILL / PROCEED / PRIORITISE — these verdicts are FINAL and authoritative. Never ` +
    `re-judge a value as borderline, "at the kill threshold", or otherwise different from its ` +
    `stated verdict. Mostly PRIORITISE ⇒ 75+, mostly PROCEED ⇒ 50-75, any KPI marked ` +
    `KILL caps the score below 40.\n` +
    `2. MISSING KPI values are NOT a failure — the bet may simply be early in the phase and the ` +
    `data not yet measurable. Do not cap or heavily penalise for them; at most note them in the ` +
    `rationale and trim a few points if most KPIs are still unmeasured.\n` +
    `3. Risks adjust the score moderately (roughly ±10): drag it down for High-severity risks ` +
    `with weak or no mitigation; a credible mitigation largely neutralises a risk.\n` +
    `4. Market (TAM/SAM/SOM credibility, competitor pressure) is secondary context worth a few ` +
    `points either way — competitive pressure alone must not sink an otherwise on-track bet.\n\n` +
    `Stage-${bet.stage} KPI verdicts (final):\n${kpiList}\n\n` +
    `The bet (full JSON):\n${JSON.stringify(betSansHistory, null, 2)}\n\n` +
    `Return JSON only with these fields:\n` +
    `- score: integer 0-100.\n` +
    `- rationale: your working, as 3-5 short bullet lines (each starting with "- ", separated by \\n). ` +
    `One bullet per factor you weighed: entered-KPI read vs thresholds, missing KPIs (neutral note), ` +
    `risks, market. Name the specific KPIs/risks that moved the score.\n` +
    `- aiSummary: a rewrite of the bet's aiSummary that is CONSISTENT with this score. 3-4 short ` +
    `sentences (50-70 words) synthesising the bet, then a final new line with EXACTLY ` +
    `"Recommendation: X" where X is Kill, Proceed, or Prioritise — aligned with the score ` +
    `(below ~40 leans Kill, ~40-75 Proceed, above ~75 Prioritise). The summary and the score ` +
    `must never contradict each other.`

  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        required: ['score', 'rationale', 'aiSummary'],
        properties: {
          score: { type: 'integer' },
          rationale: { type: 'string' },
          aiSummary: { type: 'string' }
        }
      } as any
    }
  })

  const raw = result.text ?? ''
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${raw.slice(0, 200)}`)
  }
  const data = ScoreSchema.parse(parsed)
  return { score: Math.round(data.score), rationale: data.rationale, aiSummary: data.aiSummary }
}
