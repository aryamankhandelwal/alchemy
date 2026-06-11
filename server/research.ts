// Market-research agent. Two-step Gemini pipeline:
//   1. Google Search grounding — Gemini calls the web, returns prose + citations.
//   2. Structured output — re-asks Gemini to emit Market JSON against a schema.
// Grounding and responseSchema can't be combined in a single call, so the
// findings are passed back as prior turns. Output is validated with Zod before
// being converted to a flat Patch matching src/lib/applyPatch.ts.

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import type { Bet, Patch } from '../src/types/bet'
import { envVar } from './env'

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

// We ARE Astra Tech — these brands must never be returned as competitors.
// Belt-and-braces: instructed in the prompt AND filtered out of the result.
const OWN_BRANDS = ['astra tech', 'astratech', 'botim', 'payby', 'quantix']

export const IDENTITY_BRIEF =
  `IMPORTANT — who we are: this bet belongs to Astra Tech (UAE), whose products include ` +
  `Botim, PayBy, and Quantix. These are US — never list Astra Tech, Botim, PayBy, or Quantix ` +
  `as competitors. Likewise, any company the bet description mentions as a partner, ` +
  `distribution channel, insurer/bank partner, or supplier is a PARTNER, not a competitor — ` +
  `exclude them too. Competitors are external companies fighting for the same customers.`

function isOwnBrand(name: string): boolean {
  const n = name.toLowerCase()
  return OWN_BRANDS.some((b) => n.includes(b))
}

// JSON-Schema for Gemini's responseSchema. Mirrors MarketDataSchema; Gemini
// will refuse the call if these drift apart in shape.
const RESPONSE_SCHEMA = {
  type: 'object',
  required: ['tam', 'sam', 'som', 'sources', 'competitors'],
  properties: {
    tam: {
      type: 'string',
      description:
        'TAM as a revenue pool in USD. ONLY a currency amount, e.g. "$4.2B" or "$850M". No prose, no units other than $, no parentheses, no source.'
    },
    sam: {
      type: 'string',
      description:
        'SAM as a revenue pool in USD. ONLY a currency amount, e.g. "$1.2B" or "$320M". No prose.'
    },
    som: {
      type: 'string',
      description:
        'Year-1 SOM as a revenue pool in USD. ONLY a currency amount, e.g. "$45M". No prose.'
    },
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
  const apiKey = envVar('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set. Add it to .env.')
  const model = envVar('GEMINI_MODEL') || 'gemini-2.5-flash'

  const ai = new GoogleGenAI({ apiKey })

  const briefing =
    `Research current market data for: ${bet.name}.\n` +
    `${bet.description}\n` +
    (bet.targetCustomer ? `Target customer: ${bet.targetCustomer}\n` : '') +
    `\n${IDENTITY_BRIEF}\n` +
    `\nFind:\n` +
    `- TAM, SAM, SOM expressed as REVENUE POOLS in USD (annual addressable revenue, not user counts ` +
    `or transaction volume). Each value must be a bare currency string like "$4.2B" or "$850M" — ` +
    `no prose, no qualifiers, no parentheses. Put any descriptive caption ONLY in the corresponding ` +
    `sources field. Year-1 attainable for SOM.\n` +
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
  data.competitors = data.competitors.filter((c) => !isOwnBrand(c.name))

  return {
    'market.tam': data.tam,
    'market.sam': data.sam,
    'market.som': data.som,
    'market.sources': data.sources,
    'market.competitors': data.competitors
  }
}
