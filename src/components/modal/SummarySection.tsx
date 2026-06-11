import { useState } from 'react'
import { Brain, CalendarRange, Loader2, RefreshCw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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
  onScore?: (id: string) => Promise<Bet | null>
}

export function SummarySection({ bet, onPatch, onScore }: SummarySectionProps) {
  const [scoring, setScoring] = useState(false)
  const [rationaleOpen, setRationaleOpen] = useState(false)

  const runScore = async () => {
    if (!onScore || scoring) return
    setScoring(true)
    try {
      await onScore(bet.id)
    } finally {
      setScoring(false)
    }
  }

  const setPhaseDate = (stage: Stage, field: 'start' | 'end', value: string) => {
    const current = bet.timeline?.[stage]?.[field] ?? null
    const next = value || null
    if (next === current) return
    const patch: Record<string, unknown> = { [`timeline.${stage}.${field}`]: next }
    // a phase boundary is one date: end of phase N === start of phase N+1
    const NEXT_STAGE: Partial<Record<Stage, Stage>> = { Evaluation: 'Pilot', Pilot: 'Scale' }
    const PREV_STAGE: Partial<Record<Stage, Stage>> = { Pilot: 'Evaluation', Scale: 'Pilot' }
    if (next) {
      if (field === 'end' && NEXT_STAGE[stage]) patch[`timeline.${NEXT_STAGE[stage]}.start`] = next
      if (field === 'start' && PREV_STAGE[stage]) patch[`timeline.${PREV_STAGE[stage]}.end`] = next
    }
    onPatch(bet.id, patch, 'system', 'Timeline edited')
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
          <span className="flex items-center gap-1.5">
            {bet.score == null ? (
              <span className="text-2xl text-muted-foreground/60 font-bold leading-none">—</span>
            ) : (
              <button
                type="button"
                onClick={() => setRationaleOpen(true)}
                title="See how the AI arrived at this score"
                className="group flex items-baseline"
              >
                <span
                  className={cn(
                    'text-2xl font-bold leading-none underline-offset-4 group-hover:underline',
                    scoreTone(bet.score)
                  )}
                >
                  {bet.score}
                </span>
                <span className="text-muted-foreground text-sm ml-1">/ 100</span>
              </button>
            )}
            {onScore && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={runScore}
                disabled={scoring}
                aria-label="Refresh score"
                title="AI re-scores the bet from its current summary, market, KPIs, and risks"
                className="text-muted-foreground hover:text-primary shrink-0"
              >
                {scoring ? (
                  <Loader2 className="!size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="!size-3.5" />
                )}
              </Button>
            )}
          </span>
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

      <Dialog open={rationaleOpen} onOpenChange={setRationaleOpen}>
        <DialogContent className="max-w-[480px] p-0 gap-0 overflow-hidden sm:rounded-xl">
          <DialogHeader className="px-7 pt-7 pb-4 border-b text-left space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-primary">
              <Brain className="size-3" />
              <span>Score reasoning</span>
            </div>
            <DialogTitle className="text-lg text-foreground font-bold">
              {bet.score == null ? '—' : (
                <>
                  <span className={cn(scoreTone(bet.score))}>{bet.score}</span>
                  <span className="text-muted-foreground text-sm font-normal ml-1">/ 100</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              How the AI weighed {bet.name} at its current stage ({bet.stage}).
            </DialogDescription>
          </DialogHeader>
          <div className="px-7 py-6 max-h-[60vh] overflow-y-auto space-y-5">
            {bet.rice && (
              <div className="grid grid-cols-4 gap-3">
                {(
                  [
                    ['Reach', bet.rice.reach, false],
                    ['Impact', bet.rice.impact, false],
                    ['Confidence', bet.rice.confidence, false],
                    ['Effort', bet.rice.effort, true]
                  ] as const
                ).map(([label, value, inverted]) => (
                  <Card key={label} className="bg-popover/50 p-3 text-center shadow-none">
                    <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground mb-1">
                      {label}
                    </div>
                    <div className="text-lg font-bold leading-none text-foreground">
                      {value}
                      <span className="text-muted-foreground text-xs font-normal">/10</span>
                    </div>
                    {inverted && (
                      <div className="text-[9px] text-muted-foreground/70 mt-1">lower is better</div>
                    )}
                  </Card>
                ))}
              </div>
            )}
            {bet.scoreRationale ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {bet.scoreRationale}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                No reasoning stored for this score yet — it predates score explanations. Hit the
                refresh icon next to the score to re-score the bet; the AI's working will appear
                here.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
