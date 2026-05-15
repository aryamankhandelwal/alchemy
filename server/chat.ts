// /api/chat handler. Mounted by vite.config.ts as a dev-server middleware.
// Uses Vercel AI SDK + OpenRouter to produce a structured patch + reply.

import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'

import { buildSystemPrompt } from '../src/lib/systemPrompt'
import type { Bet } from '../src/types/bet'

const PatchResponse = z.object({
  patch: z
    .record(z.any())
    .nullable()
    .describe('Flat dot-path -> new value map, or null if no update.'),
  reply: z.string().describe('1-2 sentence confirmation or answer.')
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
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return {
      patch: null,
      reply:
        'No OPENROUTER_API_KEY configured. Add it to .env and restart `npm run dev` to enable AI updates.'
    }
  }

  if (!Array.isArray(messages) || !bet) {
    return { patch: null, reply: 'Bad request — missing messages or bet.' }
  }

  const openrouter = createOpenRouter({ apiKey })
  const modelId = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4.5'

  try {
    const { object } = await generateObject({
      model: openrouter(modelId),
      schema: PatchResponse,
      schemaName: 'BetPatch',
      schemaDescription: 'A patch to apply to the current bet, plus a short user-facing reply.',
      system: buildSystemPrompt(bet),
      messages,
      maxTokens: 1000,
      temperature: 0.2
    })
    return object
  } catch (err) {
    const e = err as Error
    // Some AI SDK error objects have getters that throw when util.inspect walks them,
    // which crashes console.error. Stringify a flat shape instead.
    const safe = { name: e?.name, message: e?.message, stack: e?.stack?.split('\n').slice(0, 3).join(' | ') }
    console.error('[chatHandler] generateObject failed:', JSON.stringify(safe))
    return {
      patch: null,
      reply: `AI request failed: ${e?.message ?? 'unknown error'}.`
    }
  }
}
