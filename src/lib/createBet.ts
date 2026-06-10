import type { Bet, Decision, Stage, Timeline } from '@/types/bet'

export const EMPTY_TIMELINE: Timeline = {
  Evaluation: { start: null, end: null },
  Pilot: { start: null, end: null },
  Scale: { start: null, end: null }
}

function slugify(s: string): string {
  return (
    String(s)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40) || 'bet'
  )
}

export interface CreateBetInput {
  name: string
  description: string
  stage: Stage
  decision: Decision
  timeline?: Timeline
}

export function createBet({ name, description, stage, decision, timeline }: CreateBetInput): Bet {
  const id = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`
  return {
    id,
    name: name.trim(),
    description: description.trim(),
    stage,
    decision,
    score: null,
    nullHypothesis: '',
    targetCustomer: '',
    aiSummary: '',
    market: {
      tam: '—',
      sam: '—',
      som: '—',
      sources: {},
      competitors: []
    },
    risks: [],
    kpis: {},
    timeline: timeline ?? EMPTY_TIMELINE,
    createdAt: new Date().toISOString()
  }
}
