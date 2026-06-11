export type Stage = 'Evaluation' | 'Pilot' | 'Scale'
export type Decision = 'Prioritise' | 'Proceed' | 'Kill' | 'Killed'
export type KpiStatus = 'Prioritise' | 'Proceed' | 'Kill'

export type ThreatLevel = 'Low' | 'Medium' | 'High'
export type Severity = 'Low' | 'Medium' | 'High'
export type RiskCategory = 'Regulatory' | 'Operational' | 'Credit' | 'Market'
export type HistorySource = 'ai' | 'drag' | 'system' | 'granola'

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
  op: 'set' | 'add' | 'remove'
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

/** ISO date (YYYY-MM-DD) or null when not set. */
export interface PhaseDates {
  start: string | null
  end: string | null
}

export type Timeline = Record<Stage, PhaseDates>

/** Checklist item inside an initiative. */
export interface SubInitiative {
  id: string
  name: string
  done: boolean
  /** ISO date (YYYY-MM-DD) or null. */
  due: string | null
}

/** A workstream on the bet: checklist of sub-initiatives + notes + tagged artifacts. */
export interface Initiative {
  id: string
  name: string
  notes: string
  subs: SubInitiative[]
  /** ids of artifacts (uploads) tagged to this initiative */
  artifactIds: string[]
}

/** User-defined KPI added from the KPIs tab; lives on the bet, not the stage schema. */
export interface CustomKpi {
  id: string
  name: string
  /** AI-pulled one-liner explaining the metric. */
  definition: string
  kill: string
  proceed: string
  prioritise: string
  value: KpiValue | null
}

/** RICE breakdown behind the AI score; each dimension 1-10 (effort: lower is better). */
export interface RiceScore {
  reach: number
  impact: number
  confidence: number
  effort: number
}

export interface Bet {
  id: string
  name: string
  description: string
  stage: Stage
  decision: Decision
  score: number | null
  /** AI's bullet-point working from the last score refresh. */
  scoreRationale?: string
  /** RICE dimension ratings behind `score`, set on each score refresh. */
  rice?: RiceScore
  nullHypothesis: string
  targetCustomer: string
  aiSummary: string
  market: Market
  risks: Risk[]
  kpis: Record<string, KpiValue | null>
  /** Bet-specific KPIs added by users (rendered after the stage schema rows). */
  customKpis?: CustomKpi[]
  /** Workstreams shown in the Initiatives tab. */
  initiatives?: Initiative[]
  /** Stage-schema KPI keys the user has removed from this bet's table. */
  hiddenKpis?: string[]
  timeline?: Timeline
  /** ISO timestamp set at creation — anchors the bet's lifecycle on the Gantt view. */
  createdAt?: string
  history?: HistoryEntry[]
}

export type Patch = Record<string, unknown> | null

/** Uploaded document attached to a bet; binary lives server-side, this is metadata. */
export interface Artifact {
  id: string
  betId: string
  name: string
  type: string
  size: number
  uploadedAt: string
  /** True for AI-generated docs (PDF with stored content) — convertible to .docx. */
  canConvert?: boolean
}
