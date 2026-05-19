// /api/chat handler. Mounted by vite.config.ts as a dev-server middleware.
// Uses Gemini (same provider as /api/research and /api/enrich) to produce a
// structured patch + reply. Patch is an open-ended dot-path map, so we ask for
// JSON output and validate with Zod rather than a rigid response schema.

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import { buildSystemPrompt } from '../src/lib/systemPrompt'
import type { Bet } from '../src/types/bet'

const PatchResponse = z.object({
  patch: z.record(z.any()).nullable(),
  reply: z.string()
})

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  bet: Bet
}

export interface ChatResponse {
  patch: Record<string, unknown> | null
  reply: string
}

export async function chatHandler({ messages, bet }: ChatRequest): Promise<ChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      patch: null,
      reply:
        'No GEMINI_API_KEY configured. Add it to .env and restart `npm run dev` to enable AI updates.'
    }
  }

  if (!Array.isArray(messages) || !bet) {
    return { patch: null, reply: 'Bad request — missing messages or bet.' }
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const ai = new GoogleGenAI({ apiKey })

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  try {
    const res = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction:
          buildSystemPrompt(bet) +
          '\n\nReturn ONLY a JSON object of shape: {"patch": <dot-path map or null>, "reply": <string>}. ' +
          'No prose, no markdown fences.',
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 1000
      }
    })

    const raw = res.text ?? ''
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { patch: null, reply: `AI returned non-JSON: ${raw.slice(0, 200)}` }
    }
    return PatchResponse.parse(parsed)
  } catch (err) {
    const e = err as Error
    const safe = { name: e?.name, message: e?.message, stack: e?.stack?.split('\n').slice(0, 3).join(' | ') }
    console.error('[chatHandler] Gemini call failed:', JSON.stringify(safe))
    return {
      patch: null,
      reply: `AI request failed: ${e?.message ?? 'unknown error'}.`
    }
  }
}
