// On-demand bet scoring, RICE-style. The model rates four dimensions —
// Reach, Impact, Confidence, Effort — each 1-10 with a one-line justification
// (KPI verdicts and risks feed Confidence as evidence, not as hard caps).
// The 0-100 score is then computed HERE, deterministically, with a geometric
// blend so no single dimension (or single KPI) can dominate the result.

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import { getKpiDefs } from '../src/lib/kpiSchema'
import type { Bet, RiceScore } from '../src/types/bet'
import { envVar } from './env'

const dim = z.number().min(1).max(10)
const ScoreSchema = z.object({
  reach: dim,
  reachWhy: z.string(),
  impact: dim,
  impactWhy: z.string(),
  confidence: dim,
  confidenceWhy: z.string(),
  effort: dim,
  effortWhy: z.string(),
  aiSummary: z.string()
})

export interface ScoreResult {
  score: number
  rationale: string
  aiSummary: string
  rice: RiceScore
}

/**
 * Geometric blend of the four normalized dimensions (effort inverted).
 * All 5s with effort 5 ≈ 52; a single weak dimension drags the score but
 * cannot floor it the way the old "any KILL caps below 40" rule did.
 */
export function riceToScore({ reach, impact, confidence, effort }: RiceScore): number {
  const product = (reach * impact * confidence * (11 - effort)) / 10_000
  return Math.round(100 * Math.pow(product, 0.25))
}

export function riceRationale(rice: RiceScore, whys: Record<keyof RiceScore, string>): string {
  return [
    `- Reach ${rice.reach}/10 — ${whys.reach}`,
    `- Impact ${rice.impact}/10 — ${whys.impact}`,
    `- Confidence ${rice.confidence}/10 — ${whys.confidence}`,
    `- Effort ${rice.effort}/10 (lower is better) — ${whys.effort}`
  ].join('\n')
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

  // Strip prior scoring outputs (aiSummary/scoreRationale/score/rice) and raw kpis: they
  // are what we're regenerating — leaving them in makes the model parrot stale verdicts.
  const {
    history: _history,
    kpis: _kpis,
    customKpis: _customKpis,
    aiSummary: _aiSummary,
    scoreRationale: _scoreRationale,
    score: _score,
    rice: _rice,
    ...betSansHistory
  } = bet

  const prompt =
    `You are the investment-committee scorer inside Alchemy, Astra Tech's New Horizons ` +
    `portfolio dashboard (UAE / MENA fintech). Rate this bet at its CURRENT stage (${bet.stage}) ` +
    `on the four RICE dimensions, each an integer 1-10 with a one-line justification:\n\n` +
    `- reach: how much of the addressable market/customer base this could plausibly touch ` +
    `(ground it in TAM/SAM/SOM, target customer, and distribution).\n` +
    `- impact: depth of value per customer plus strategic upside for Astra Tech if it works ` +
    `(monetisation, moat, portfolio fit).\n` +
    `- confidence: strength of the EVIDENCE that reach and impact are real. The KPI verdicts below ` +
    `have been PRE-EVALUATED by the app into KILL / PROCEED / PRIORITISE — they are final; never ` +
    `re-judge a value as borderline. Mostly PRIORITISE ⇒ high confidence (8-10); mostly PROCEED ⇒ ` +
    `mid (5-7); each KILL verdict is strong negative evidence that should pull confidence down ` +
    `1-3 points — but ONE kill KPI among healthy ones is a flag to investigate, NOT a veto on the ` +
    `whole bet. KPIs NOT ENTERED are neutral (the bet may just be early); many missing KPIs cap ` +
    `confidence around 6. High-severity risks with weak mitigation also lower confidence; credible ` +
    `mitigations largely neutralise a risk.\n` +
    `- effort: cost and complexity to deliver from here (build time, operational load, regulatory ` +
    `path). 1 = trivial, 10 = multi-year heavy build. Use speed-to-MVP / operational / regulatory ` +
    `KPIs where present.\n\n` +
    `Stage-${bet.stage} KPI verdicts (final):\n${kpiList}\n\n` +
    `The bet (full JSON):\n${JSON.stringify(betSansHistory, null, 2)}\n\n` +
    `The app computes the 0-100 score from your ratings as ` +
    `100 × (reach × impact × confidence × (11 − effort) / 10000)^0.25 — roughly: all 5s ≈ 52, ` +
    `strong across the board ≥ 75, weak across the board ≤ 40.\n\n` +
    `Return JSON only with these fields:\n` +
    `- reach, impact, confidence, effort: integers 1-10.\n` +
    `- reachWhy, impactWhy, confidenceWhy, effortWhy: one short sentence each naming the specific ` +
    `KPIs, risks, or market facts behind the rating.\n` +
    `- aiSummary: a rewrite of the bet's aiSummary CONSISTENT with your ratings. 3-4 short ` +
    `sentences (50-70 words) synthesising the bet, then a final new line with EXACTLY ` +
    `"Recommendation: X" where X is Kill, Proceed, or Prioritise — aligned with the computed ` +
    `score band (below ~40 leans Kill, ~40-75 Proceed, above ~75 Prioritise).`

  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        required: [
          'reach', 'reachWhy', 'impact', 'impactWhy',
          'confidence', 'confidenceWhy', 'effort', 'effortWhy', 'aiSummary'
        ],
        properties: {
          reach: { type: 'integer' },
          reachWhy: { type: 'string' },
          impact: { type: 'integer' },
          impactWhy: { type: 'string' },
          confidence: { type: 'integer' },
          confidenceWhy: { type: 'string' },
          effort: { type: 'integer' },
          effortWhy: { type: 'string' },
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

  const rice: RiceScore = {
    reach: Math.round(data.reach),
    impact: Math.round(data.impact),
    confidence: Math.round(data.confidence),
    effort: Math.round(data.effort)
  }
  return {
    score: riceToScore(rice),
    rationale: riceRationale(rice, {
      reach: data.reachWhy,
      impact: data.impactWhy,
      confidence: data.confidenceWhy,
      effort: data.effortWhy
    }),
    aiSummary: data.aiSummary,
    rice
  }
}
