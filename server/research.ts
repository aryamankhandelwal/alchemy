// Market-research agent. Two-step Gemini pipeline:
//   1. Google Search grounding — Gemini calls the web, returns prose + citations.
//   2. Structured output — re-asks Gemini to emit Market JSON against a schema.
// Grounding and responseSchema can't be combined in a single call, so the
// findings are passed back as prior turns. Output is validated with Zod before
// being converted to a flat Patch matching src/lib/applyPatch.ts.

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import type { Bet, Patch } from '../src/types/bet'

const MarketDataSchema = z.object({
  tam: z.string(),
  sam: z.string(),
  som: z.string(),
  sources: z.object({
    tam: z.string(),
    sam: z.string(),
    som: z.string()
  }),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        metrics: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
            source: z.string()
          })
        ),
        edge: z.string(),
        gap: z.string(),
        threat: z.enum(['Low', 'Medium', 'High'])
      })
    )
    .min(1)
})

type MarketData = z.infer<typeof MarketDataSchema>

// JSON-Schema for Gemini's responseSchema. Mirrors MarketDataSchema; Gemini
// will refuse the call if these drift apart in shape.
const RESPONSE_SCHEMA = {
  type: 'object',
  required: ['tam', 'sam', 'som', 'sources', 'competitors'],
  properties: {
    tam: { type: 'string', description: 'Total addressable market, e.g. "$4.2B".' },
    sam: { type: 'string', description: 'Serviceable addressable market.' },
    som: { type: 'string', description: 'Serviceable obtainable market (year-1).' },
    sources: {
      type: 'object',
      required: ['tam', 'sam', 'som'],
      properties: {
        tam: { type: 'string', description: 'Citation for the TAM figure (publication + year).' },
        sam: { type: 'string' },
        som: { type: 'string' }
      }
    },
    competitors: {
      type: 'array',
      description: 'Top 3-5 competitors in the same market.',
      items: {
        type: 'object',
        required: ['name', 'metrics', 'edge', 'gap', 'threat'],
        properties: {
          name: { type: 'string' },
          metrics: {
            type: 'array',
            description: '2-3 current metrics with sources.',
            items: {
              type: 'object',
              required: ['label', 'value', 'source'],
              properties: {
                label: { type: 'string' },
                value: { type: 'string' },
                source: { type: 'string' }
              }
            }
          },
          edge: { type: 'string', description: 'What this competitor has that we lack.' },
          gap: { type: 'string', description: 'Where this competitor falls short relative to us.' },
          threat: { type: 'string', enum: ['Low', 'Medium', 'High'] }
        }
      }
    }
  }
} as const

export async function researchMarket(bet: Bet): Promise<Patch> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set. Add it to .env and restart `npm run dev`.')
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  const ai = new GoogleGenAI({ apiKey })

  const briefing =
    `Research current market data for: ${bet.name}.\n` +
    `${bet.description}\n` +
    (bet.targetCustomer ? `Target customer: ${bet.targetCustomer}\n` : '') +
    `\nFind:\n` +
    `- TAM, SAM, SOM with publication sources (year-1 SOM for our context).\n` +
    `- Top 3-5 competitors with 2-3 current metrics each (revenue, funding, users, profitability) with sources.\n` +
    `- For each: what they have that we lack (edge), what we beat them on (gap), threat level (Low/Medium/High).\n` +
    `\nUAE / MENA fintech context is preferred. Cite sources for every figure.`

  // Step 1 — web-grounded research (Google Search server tool).
  const search = await ai.models.generateContent({
    model,
    contents: briefing,
    config: { tools: [{ googleSearch: {} }] }
  })
  const findings = search.text ?? ''
  if (!findings.trim()) throw new Error('Gemini grounding step returned no text.')

  // Step 2 — structure the findings via JSON response schema.
  const struct = await ai.models.generateContent({
    model,
    contents: [
      { role: 'user', parts: [{ text: briefing }] },
      { role: 'model', parts: [{ text: findings }] },
      {
        role: 'user',
        parts: [
          {
            text: 'Now emit the structured findings as JSON matching the response schema. Do not omit fields.'
          }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      // SDK types don't expose the full JSON-Schema surface; cast at the boundary.
      responseSchema: RESPONSE_SCHEMA as any
    }
  })

  const raw = struct.text ?? ''
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${raw.slice(0, 200)}`)
  }

  const data: MarketData = MarketDataSchema.parse(parsed)

  return {
    'market.tam': data.tam,
    'market.sam': data.sam,
    'market.som': data.som,
    'market.sources': data.sources,
    'market.competitors': data.competitors
  }
}
