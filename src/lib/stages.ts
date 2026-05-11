import type { Stage, Decision } from '@/types/bet'

export const STAGES: readonly Stage[] = ['Evaluation', 'Pilot', 'Scale'] as const

export const DECISIONS: readonly Decision[] = [
  'Prioritise',
  'Proceed',
  'Kill',
  'Killed'
] as const

type BadgeTone = 'success' | 'warning' | 'destructive' | 'accent' | 'muted' | 'dim'

export const DECISION_TONE: Record<Decision, BadgeTone> = {
  Prioritise: 'success',
  Proceed: 'warning',
  Kill: 'destructive',
  Killed: 'dim'
}

export const STAGE_TONE: Record<Stage, BadgeTone> = {
  Evaluation: 'muted',
  Pilot: 'accent',
  Scale: 'success'
}
