import { CalendarRange, Sparkles } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DecisionBadge, StageBadge, scoreTone } from '@/components/bet-badges'
import { STAGES } from '@/lib/stages'
import { cn } from '@/lib/utils'
import type { Bet, HistorySource, Patch, Stage } from '@/types/bet'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  )
}

interface SummarySectionProps {
  bet: Bet
  onPatch: (id: string, patch: Patch, source?: HistorySource, note?: string) => void | Promise<void>
}

export function SummarySection({ bet, onPatch }: SummarySectionProps) {
  const setPhaseDate = (stage: Stage, field: 'start' | 'end', value: string) => {
    const current = bet.timeline?.[stage]?.[field] ?? null
    const next = value || null
    if (next === current) return
    onPatch(bet.id, { [`timeline.${stage}.${field}`]: next }, 'system', 'Timeline edited')
  }

  return (
    <div className="space-y-6">
      <Field label="Description">{bet.description}</Field>

      <div className="grid grid-cols-3 gap-5">
        <Field label="Stage">
          <StageBadge stage={bet.stage} />
        </Field>
        <Field label="Decision">
          <DecisionBadge decision={bet.decision} />
        </Field>
        <Field label="Score">
          {bet.score == null ? (
            <span className="text-2xl text-muted-foreground/60 font-bold leading-none">—</span>
          ) : (
            <>
              <span className={cn('text-2xl font-bold leading-none', scoreTone(bet.score))}>
                {bet.score}
              </span>
              <span className="text-muted-foreground text-sm ml-1">/ 100</span>
            </>
          )}
        </Field>
      </div>

      <Field label="Null hypothesis">{bet.nullHypothesis}</Field>
      <Field label="Target customer">{bet.targetCustomer}</Field>

      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-primary mb-3">
          <Sparkles className="size-3" />
          <span>AI summary</span>
        </div>
        <Card className="bg-popover/50 p-4 text-sm text-foreground leading-relaxed shadow-none">
          {bet.aiSummary}
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-muted-foreground mb-3">
          <CalendarRange className="size-3" />
          <span>Estimated timeline</span>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {STAGES.map((s) => {
            const phase = bet.timeline?.[s]
            const isCurrent = s === bet.stage
            return (
              <Card
                key={s}
                className={cn(
                  'p-4 shadow-none',
                  isCurrent ? 'border-primary/40 bg-primary/5' : 'bg-popover/50'
                )}
              >
                <div
                  className={cn(
                    'text-[10px] uppercase tracking-wider2 mb-1.5',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {s}
                </div>
                <div className="space-y-1.5">
                  <Input
                    type="date"
                    aria-label={`${s} start`}
                    value={phase?.start ?? ''}
                    onChange={(e) => setPhaseDate(s, 'start', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="date"
                    aria-label={`${s} end`}
                    value={phase?.end ?? ''}
                    onChange={(e) => setPhaseDate(s, 'end', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
