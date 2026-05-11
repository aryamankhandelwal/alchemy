export type Stage = 'Evaluation' | 'Pilot' | 'Scale'
export type Decision = 'Prioritise' | 'Proceed' | 'Kill' | 'Killed'
export type KpiStatus = 'Prioritise' | 'Proceed' | 'Kill'

export type ThreatLevel = 'Low' | 'Medium' | 'High'
export type Severity = 'Low' | 'Medium' | 'High'
export type RiskCategory = 'Regulatory' | 'Operational' | 'Credit' | 'Market'
export type HistorySource = 'ai' | 'drag' | 'system'

export interface CompetitorMetric {
  label: string
  value: string
  source: string
}

export interface Competitor {
  name: string
  metrics?: CompetitorMetric[]
  edge?: string
  gap?: string
  /** Back-compat with the old competitor shape. */
  strength?: string
  /** Back-compat with the old competitor shape. */
  weakness?: string
  threat: ThreatLevel
}

export interface Market {
  tam: string
  sam: string
  som: string
  sources?: Partial<Record<'tam' | 'sam' | 'som', string>>
  competitors: Competitor[]
}

export interface Risk {
  name: string
  category: RiskCategory
  severity: Severity
  mitigation: string
}

export interface Change {
  path: string
  op: 'set' | 'add'
  before?: unknown
  after: unknown
}

export interface HistoryEntry {
  id: string
  timestamp: string
  source: HistorySource
  note?: string
  changes: Change[]
}

export type KpiValue = number | string

export interface Bet {
  id: string
  name: string
  description: string
  stage: Stage
  decision: Decision
  score: number | null
  nullHypothesis: string
  targetCustomer: string
  aiSummary: string
  market: Market
  risks: Risk[]
  kpis: Record<string, KpiValue>
  history?: HistoryEntry[]
}

export type Patch = Record<string, unknown> | null
