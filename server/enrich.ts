// Quick enrichment for a freshly-created bet. Calls Gemini with a JSON
// response schema, returns a flat Patch with aiSummary, nullHypothesis,
// targetCustomer, risks, and stage-appropriate KPI defaults. Uses the same
// provider/key as /api/research because the free OpenRouter tier is too
// flaky on complex nested schemas.

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import { getKpiDefs } from '../src/lib/kpiSchema'
import type { Bet, Patch } from '../src/types/bet'

const EnrichmentSchema = z.object({
  description: z.string(),
  nullHypothesis: z.string(),
  targetCustomer: z.string(),
  kpis: z.record(z.union([z.string(), z.number()])),
  risks: z
    .array(
      z.object({
        name: z.string(),
        category: z.enum(['Regulatory', 'Operational', 'Credit', 'Market']),
        severity: z.enum(['Low', 'Medium', 'High']),
        mitigation: z.string()
      })
    )
    .min(3)
    .max(5),
  aiSummary: z.string()
})

function buildResponseSchema(kpiKeys: string[]) {
  return {
    type: 'object',
    required: ['description', 'nullHypothesis', 'targetCustomer', 'kpis', 'risks', 'aiSummary'],
    properties: {
      description: {
        type: 'string',
        description:
          '2-3 short sentences, max 50 words total. A factual one-liner of what the product is, who it serves, and how it makes money. No analysis or opinion.'
      },
      nullHypothesis: { type: 'string', description: 'One falsifiable assumption — "this fails if …".' },
      targetCustomer: { type: 'string', description: 'Specific segment/persona, not a generic label.' },
      kpis: {
        type: 'object',
        description: `KPI defaults keyed by ID. Required keys: ${kpiKeys.join(', ')}.`,
        required: kpiKeys,
        properties: Object.fromEntries(
          kpiKeys.map((k) => [k, { type: ['number', 'string'] as any }])
        )
      },
      risks: {
        type: 'array',
        description: '3-5 plausible risks varied across categories.',
        items: {
          type: 'object',
          required: ['name', 'category', 'severity', 'mitigation'],
          properties: {
            name: { type: 'string' },
            category: { type: 'string', enum: ['Regulatory', 'Operational', 'Credit', 'Market'] },
            severity: { type: 'string', enum: ['Low', 'Medium', 'High'] },
            mitigation: { type: 'string' }
          }
        }
      },
      aiSummary: {
        type: 'string',
        description:
          'Synthesis of the bet. 3-4 short sentences (50-70 words), then a final line containing exactly: "Recommendation: <Kill|Proceed|Prioritise>". Reads the description, KPIs, and risks above and explains the call.'
      }
    }
  }
}

export async function enrichBet(bet: Bet): Promise<Patch> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.')
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  const ai = new GoogleGenAI({ apiKey })

  const defs = getKpiDefs(bet.stage)
  const kpiKeys = Object.keys(defs)
  const kpiList = Object.entries(defs)
    .map(([key, d]) => {
      const valueRule =
        d.format === 'enum'
          ? `string, exactly one of: ${d.enumOrder?.join(' | ')}`
          : d.format === 'pct'
          ? 'decimal between 0 and 1 (0.18 means 18%)'
          : d.format === 'x'
          ? 'number with one decimal, e.g. 1.8'
          : d.format === 'months'
          ? 'integer months'
          : 'integer weeks'
      return `  - ${key} — ${d.label}. VALUE: ${valueRule}. Reference bands: ${d.thresholds}`
    })
    .join('\n')

  const prompt =
    `You are an in-app assistant inside Alchemy, Astra Tech's New Horizons portfolio dashboard. ` +
    `Context: UAE / MENA fintech. The user just created a new bet with only a name + description. ` +
    `Fill in the supporting fields so the card is useful at a glance. Be specific, falsifiable, ` +
    `and avoid hedging language ("aims to", "leverages", "seeks to").\n\n` +
    `New bet:\n` +
    `Name: ${bet.name}\n` +
    `Description: ${bet.description}\n` +
    `Stage: ${bet.stage} · Decision: ${bet.decision}\n\n` +
    `Fields (generate IN THIS ORDER — aiSummary depends on the rest):\n` +
    `- description: 2-3 short sentences, MAX 50 words. Factual rewrite of what the user pasted — what the product is, ` +
    `who it serves, how it monetises. No analysis or opinion (that goes in aiSummary). The user's input may be a wall of text; ` +
    `your job is to compress it.\n` +
    `- nullHypothesis: one falsifiable assumption — "this fails if …"\n` +
    `- targetCustomer: specific segment/persona\n` +
    `- risks: 3-5 plausible risks. Vary across categories (Regulatory, Operational, Credit, Market). ` +
    `Each needs name, category, severity, and a concrete mitigation.\n` +
    `- kpis: object keyed by these KPI IDs with reasonable stage-${bet.stage} starting values. ` +
    `For each, the VALUE format is explicit below — follow it exactly. The "reference bands" are ` +
    `for context only; never copy the band text into the value:\n${kpiList}\n` +
    `- aiSummary: a synthesis of everything you just wrote above. 3-4 short sentences (50-70 words total) ` +
    `covering the opportunity, the read on the KPIs you set against the stage-${bet.stage} thresholds, and ` +
    `the dominant risks. Then on a final new line write EXACTLY: "Recommendation: X" where X is one of ` +
    `Kill, Proceed, or Prioritise. Choose based on whether the KPIs you wrote sit mostly in kill / proceed / ` +
    `prioritise bands and whether risks are showstoppers. Decisive — no hedging.\n\n` +
    `Do not omit any field.`

  const struct = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      // SDK types lag the full JSON-Schema surface; cast at the boundary.
      responseSchema: buildResponseSchema(kpiKeys) as any
    }
  })

  const raw = struct.text ?? ''
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${raw.slice(0, 200)}`)
  }

  const data = EnrichmentSchema.parse(parsed)

  const patch: Patch = {
    description: data.description,
    nullHypothesis: data.nullHypothesis,
    targetCustomer: data.targetCustomer,
    risks: data.risks,
    aiSummary: data.aiSummary
  }
  for (const [k, v] of Object.entries(data.kpis)) {
    if (defs[k]) patch[`kpis.${k}`] = v
  }
  return patch
}
