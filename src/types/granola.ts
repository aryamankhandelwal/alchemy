import type { Decision, Stage } from './bet'

/** Verbatim transcript snippet backing a proposal. */
export interface EvidenceQuote {
  quote: string
  speaker: string | null
}

/** One AI-extracted change proposal from a meeting transcript. */
export interface GranolaProposal {
  /** Server-generated id — the dismissal key in the review UI. */
  id: string
  kind: 'edit' | 'new_bet'
  /** Existing bet id for edits; null for new-bet proposals. */
  betId: string | null
  /** Existing bet's name, or the proposed name for a new bet. */
  betName: string
  /** Human-readable description of what would change. */
  summary: string
  /** Dot-path patch (same contract as the chat AI) — only for kind 'edit'. */
  patch: Record<string, unknown> | null
  /** Skeleton fields for kind 'new_bet'. */
  newBet: { name: string; description: string; stage: Stage; decision: Decision } | null
  evidence: EvidenceQuote
  /** True when the quote was found verbatim in the transcript (server-side check). */
  quoteVerified: boolean
}

export interface GranolaExtractResult {
  meetingTitle: string
  proposals: GranolaProposal[]
}
