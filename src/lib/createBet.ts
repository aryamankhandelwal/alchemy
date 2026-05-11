import type { Bet, Decision, Stage } from '@/types/bet'

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
}

export function createBet({ name, description, stage, decision }: CreateBetInput): Bet {
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
    kpis: {}
  }
}
