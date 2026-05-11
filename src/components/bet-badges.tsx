import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DECISION_TONE, STAGE_TONE } from '@/lib/stages'
import type { Decision, KpiStatus, Stage } from '@/types/bet'

export function StageBadge({ stage }: { stage: Stage }) {
  return <Badge variant={STAGE_TONE[stage] ?? 'muted'}>{stage}</Badge>
}

export function DecisionBadge({ decision }: { decision: Decision }) {
  return <Badge variant={DECISION_TONE[decision] ?? 'muted'}>{decision}</Badge>
}

const DOT_TONE: Record<KpiStatus, string> = {
  Prioritise: 'bg-success',
  Proceed: 'bg-warning',
  Kill: 'bg-destructive'
}

export function KPIDot({ status, size = 8 }: { status: KpiStatus | null; size?: number }) {
  const cls = status ? DOT_TONE[status] : 'bg-muted-foreground/40'
  return (
    <span
      className={cn('inline-block rounded-full', cls)}
      style={{ width: size, height: size }}
    />
  )
}

export function scoreTone(score: number | null | undefined): string {
  if (score == null) return 'text-muted-foreground/60'
  if (score >= 65) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-destructive'
}

export function ScorePill({ score }: { score: number | null }) {
  const hasScore = score != null
  return (
    <div className="text-right shrink-0">
      <div className="text-[9px] uppercase tracking-wider2 text-muted-foreground leading-none">
        Score
      </div>
      <div className={cn('text-2xl font-bold leading-none mt-1.5', scoreTone(score))}>
        {hasScore ? score : '—'}
      </div>
    </div>
  )
}
