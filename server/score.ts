// On-demand bet scoring. Sends the full bet (summary, market, KPIs vs the
// stage thresholds, risks, timeline) plus the attached-artifact list to Gemini
// and gets back a 0-100 score with a one-line rationale.

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import { getKpiDefs } from '../src/lib/kpiSchema'
import type { Bet } from '../src/types/bet'

const ScoreSchema = z.object({
  score: z.number().min(0).max(100),
  rationale: z.string()
})

export interface ArtifactMeta {
  name: string
  type?: string
  size?: number
}

export interface ScoreResult {
  score: number
  rationale: string
}

export async function scoreBet(bet: Bet, artifacts: ArtifactMeta[]): Promise<ScoreResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.')
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const ai = new GoogleGenAI({ apiKey })

  const defs = getKpiDefs(bet.stage)
  const kpiList = Object.entries(defs)
    .map(([key, d]) => `  - ${key} (${d.label}): bands ${d.thresholds}`)
    .join('\n')

  const { history: _history, ...betSansHistory } = bet
  const artifactList = artifacts.length
    ? artifacts.map((a) => `  - ${a.name} (${a.type ?? 'unknown'})`).join('\n')
    : '  (none attached)'

  const prompt =
    `You are the investment-committee scorer inside Alchemy, Astra Tech's New Horizons ` +
    `portfolio dashboard (UAE / MENA fintech). Score this bet 0-100 on how strong it looks ` +
    `at its CURRENT stage (${bet.stage}).\n\n` +
    `Weigh, in roughly this order:\n` +
    `1. KPIs vs the stage-${bet.stage} threshold bands below — mostly "prioritise" band ⇒ 75+, ` +
    `mostly "proceed" ⇒ 45-75, any hard "kill" signal caps the score below 40. Missing KPI ` +
    `values count against the score (unproven ≠ good).\n` +
    `2. Risk register: count and severity of unmitigated High risks.\n` +
    `3. Market: TAM/SAM/SOM credibility and competitor pressure.\n` +
    `4. Evidence discipline: artifacts attached, timeline being kept, specific (not generic) ` +
    `hypothesis and target customer.\n\n` +
    `Stage-${bet.stage} KPI thresholds:\n${kpiList}\n\n` +
    `The bet (full JSON):\n${JSON.stringify(betSansHistory, null, 2)}\n\n` +
    `Attached artifacts:\n${artifactList}\n\n` +
    `Return JSON only: {"score": <integer 0-100>, "rationale": "<1-2 sentences explaining the score>"}`

  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        required: ['score', 'rationale'],
        properties: {
          score: { type: 'integer' },
          rationale: { type: 'string' }
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
  return { score: Math.round(data.score), rationale: data.rationale }
}
