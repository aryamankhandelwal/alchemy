// Granola Sync: extract proposed bet changes from a pasted meeting transcript.
// One Gemini call returns proposals (edits to existing bets via the shared
// patch contract, or new-bet skeletons), each backed by a verbatim quote that
// is verified server-side against the transcript before reaching the UI.

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import { FRAMEWORK_PRIMER, PATCH_REFERENCE } from '../src/lib/systemPrompt'
import type { Bet } from '../src/types/bet'
import type { GranolaExtractResult, GranolaProposal } from '../src/types/granola'
import { envVar } from './env'
import { listBets } from './routes/bets'

const RawProposalSchema = z.object({
  kind: z.enum(['edit', 'new_bet']),
  betId: z.string().nullable(),
  betName: z.string(),
  summary: z.string(),
  /** Patch as a JSON-encoded string — Gemini's responseSchema can't express free-form objects. */
  patchJson: z.string().nullable(),
  newBet: z
    .object({
      name: z.string(),
      description: z.string(),
      stage: z.enum(['Evaluation', 'Pilot', 'Scale']),
      decision: z.enum(['Prioritise', 'Proceed', 'Kill', 'Killed'])
    })
    .nullable(),
  quote: z.string(),
  speaker: z.string().nullable()
})

const ExtractionSchema = z.object({
  meetingTitle: z.string(),
  proposals: z.array(RawProposalSchema)
})

const RESPONSE_SCHEMA = {
  type: 'object',
  required: ['meetingTitle', 'proposals'],
  properties: {
    meetingTitle: {
      type: 'string',
      description: 'The meeting title provided by the user, or a short inferred one.'
    },
    proposals: {
      type: 'array',
      items: {
        type: 'object',
        required: ['kind', 'betId', 'betName', 'summary', 'patchJson', 'newBet', 'quote', 'speaker'],
        properties: {
          kind: { type: 'string', enum: ['edit', 'new_bet'] },
          betId: { type: 'string', nullable: true },
          betName: { type: 'string' },
          summary: { type: 'string' },
          patchJson: { type: 'string', nullable: true },
          newBet: {
            type: 'object',
            nullable: true,
            required: ['name', 'description', 'stage', 'decision'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              stage: { type: 'string', enum: ['Evaluation', 'Pilot', 'Scale'] },
              decision: { type: 'string', enum: ['Prioritise', 'Proceed', 'Kill', 'Killed'] },
            }
          },
          quote: { type: 'string' },
          speaker: { type: 'string', nullable: true }
        }
      }
    }
  }
}

/** Trim each bet to what the extractor needs — full bets would blow the context. */
function slimBet(bet: Bet) {
  return {
    id: bet.id,
    name: bet.name,
    description: bet.description,
    stage: bet.stage,
    decision: bet.decision,
    kpis: bet.kpis,
    customKpis: (bet.customKpis ?? []).map((c) => ({ name: c.name, value: c.value })),
    risks: bet.risks.map((r) => r.name),
    initiatives: (bet.initiatives ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      subs: i.subs.map((s) => ({ id: s.id, name: s.name, done: s.done }))
    }))
  }
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

export function buildExtractionPrompt(transcript: string, meetingTitle: string, bets: Bet[]): string {
  return [
    FRAMEWORK_PRIMER,
    `# Your job

You are the meeting-sync assistant inside Alchemy, Astra Tech's New Horizons portfolio dashboard. Below is the transcript of an R&D squad meeting. Extract every concrete, actionable update to the portfolio that was stated or clearly decided in the meeting, as a list of proposals. Each proposal is later reviewed and approved by a human — propose, don't decide.

Proposal kinds:
1. **edit** — a change to an existing bet (set \`kind\` to "edit", \`betId\`/\`betName\` to the bet from the portfolio below, \`newBet\` to null). Put the change in \`patchJson\`: a JSON-ENCODED STRING of a patch object following this contract:

${PATCH_REFERENCE}

   Stage/decision moves are plain patches too: \`{ "stage": "Pilot", "decision": "Proceed" }\`.
2. **new_bet** — a genuinely new product idea/initiative discussed as worth tracking (set \`kind\` to "new_bet", \`betId\` and \`patchJson\` to null, fill \`newBet\` with name, a 1-2 sentence description from the discussion, and the stage/decision it should start at — usually Evaluation/Proceed).

For EVERY proposal also provide:
- \`summary\` — one plain-English sentence describing the change (e.g. "Update LTV/CAC to 2.3× on BNPL for SMEs").
- \`quote\` — the supporting evidence: the transcript line that MOST DIRECTLY states this specific change, copied CHARACTER-FOR-CHARACTER (do not paraphrase, fix typos, or merge separate lines). Keep it under ~40 words.
- \`speaker\` — who said it, if the transcript identifies speakers; otherwise null.

Rules:
- Only propose changes explicitly supported by the transcript. No inferring KPI values that weren't stated. Vague sentiment ("retention looks rough") is NOT a KPI update — skip it or, if a decision was made, capture that.
- One proposal per logical change. A KPI update and a decision change discussed together are two proposals (separate quotes if separate statements).
- Match bets by name/context against the portfolio below; use the exact \`id\`. If a mentioned initiative matches no existing bet and is substantive, make it a new_bet proposal.
- If the meeting contains nothing actionable, return an empty proposals array.`,
    `# Current portfolio (slim JSON)\n\n\`\`\`json\n${JSON.stringify(bets.map(slimBet), null, 2)}\n\`\`\``,
    `# Meeting${meetingTitle ? `: ${meetingTitle}` : ''}\n\nTranscript:\n\n${transcript}`,
    `Today's date is ${new Date().toISOString().slice(0, 10)}.`
  ].join('\n\n---\n\n')
}

export interface GranolaExtractBody {
  transcript?: string
  meetingTitle?: string
}

export async function granolaExtractHandler(body: GranolaExtractBody): Promise<GranolaExtractResult> {
  const transcript = (body?.transcript ?? '').trim()
  if (transcript.length < 40) {
    throw Object.assign(new Error('transcript is required (paste the meeting transcript)'), { status: 400 })
  }
  const meetingTitle = (body?.meetingTitle ?? '').trim()

  const apiKey = envVar('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.')
  const model = envVar('GEMINI_MODEL') || 'gemini-2.5-flash'
  const ai = new GoogleGenAI({ apiKey })

  const bets = await listBets()
  const prompt = buildExtractionPrompt(transcript, meetingTitle, bets)

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      // SDK types lag the full JSON-Schema surface; cast at the boundary.
      responseSchema: RESPONSE_SCHEMA as any,
      temperature: 0.1
    }
  })

  const raw = res.text ?? ''
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${raw.slice(0, 200)}`)
  }
  const data = ExtractionSchema.parse(parsed)

  const betIds = new Set(bets.map((b) => b.id))
  const normTranscript = normalize(transcript)
  const proposals: GranolaProposal[] = []
  for (const p of data.proposals) {
    let patch: Record<string, unknown> | null = null
    if (p.kind === 'edit') {
      // Drop edits the UI couldn't apply: unknown bet or unparseable patch.
      if (!p.betId || !betIds.has(p.betId) || !p.patchJson) continue
      try {
        const obj = JSON.parse(p.patchJson)
        if (!obj || typeof obj !== 'object' || Array.isArray(obj) || Object.keys(obj).length === 0) continue
        patch = obj
      } catch {
        continue
      }
    } else if (!p.newBet) {
      continue
    }
    proposals.push({
      id: `gp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      kind: p.kind,
      betId: p.kind === 'edit' ? p.betId : null,
      betName: p.betName,
      summary: p.summary,
      patch,
      newBet: p.kind === 'new_bet' ? p.newBet : null,
      evidence: { quote: p.quote, speaker: p.speaker },
      quoteVerified: normTranscript.includes(normalize(p.quote))
    })
  }

  return { meetingTitle: data.meetingTitle || meetingTitle || 'Meeting', proposals }
}
