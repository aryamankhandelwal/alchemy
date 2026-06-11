// AI definition for a user-added custom KPI: one or two plain-language
// sentences on what the metric measures and why it matters for this bet.

import { GoogleGenAI } from '@google/genai'

import type { Bet } from '../src/types/bet'
import { envVar } from './env'

export async function kpiDefinition(name: string, bet: Pick<Bet, 'name' | 'description' | 'stage'>): Promise<string> {
  const apiKey = envVar('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.')
  const model = envVar('GEMINI_MODEL') || 'gemini-2.5-flash'
  const ai = new GoogleGenAI({ apiKey })

  const prompt =
    `Define the KPI "${name}" as ONE ultra-short fragment, 8 words max — a table caption, ` +
    `not a sentence. Good examples: "Time to first usable version." / "Customer value vs ` +
    `acquisition cost." / "% of users completing core action." No "this measures", no "why it ` +
    `matters", no preamble, no markdown. Context (do not mention it): ${bet.name} at ` +
    `${bet.stage} stage.`

  const result = await ai.models.generateContent({ model, contents: prompt })
  const text = (result.text ?? '').trim()
  if (!text) throw new Error('Gemini returned an empty definition.')
  return text
}
