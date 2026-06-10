import { useMemo, useState } from 'react'
import { CalendarOff, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { DecisionBadge, ScorePill } from '@/components/bet-badges'
import { formatRange } from '@/lib/dates'
import { DECISIONS, STAGES } from '@/lib/stages'
import { cn } from '@/lib/utils'
import type { Bet, Decision, Stage } from '@/types/bet'

interface TimelineViewProps {
  bets: Bet[]
  onBetClick: (id: string) => void
}

/** The default year shown when the view opens. */
const DEFAULT_YEAR = 2026
const MS_PER_DAY = 86_400_000

const STAGE_BAR: Record<Stage, string> = {
  Evaluation: 'bg-muted-foreground/60',
  Pilot: 'bg-primary',
  Scale: 'bg-success'
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i)

/** Vertical lane label in the left gutter, same treatment as the board's row labels. */
function DecisionGutter({ decision }: { decision: Decision }) {
  return (
    <div className="w-[44px] shrink-0 flex items-center justify-center bg-popover/30 border-r">
      <div
        className="text-[10px] uppercase tracking-wider2 text-muted-foreground"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {decision}
      </div>
    </div>
  )
}

interface PhaseBar {
  stage: Stage
  start: Date
  end: Date
  endIsEstimated: boolean
}

function parseISO(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * A phase with a start but no end runs until the next dated phase begins,
 * or until today — whichever is later than its start.
 */
function getPhaseBars(bet: Bet, today: Date): PhaseBar[] {
  const bars: PhaseBar[] = []
  STAGES.forEach((stage, i) => {
    const start = parseISO(bet.timeline?.[stage]?.start)
    if (!start) return
    let end = parseISO(bet.timeline?.[stage]?.end)
    let endIsEstimated = false
    if (!end) {
      const nextStart = STAGES.slice(i + 1)
        .map((s) => parseISO(bet.timeline?.[s]?.start))
        .find((d): d is Date => d !== null)
      end = nextStart ?? (today > start ? today : start)
      endIsEstimated = true
    }
    if (end < start) end = start
    bars.push({ stage, start, end, endIsEstimated })
  })
  return bars
}

export function TimelineView({ bets, onBetClick }: TimelineViewProps) {
  const [year, setYear] = useState(DEFAULT_YEAR)

  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const { groups, undated } = useMemo(() => {
    const dated = bets
      .map((bet) => ({ bet, bars: getPhaseBars(bet, today) }))
      .filter((r) => r.bars.length > 0)
    dated.sort((a, b) => a.bars[0].start.getTime() - b.bars[0].start.getTime())
    const undated = bets.filter((b) => !dated.some((r) => r.bet.id === b.id))
    // Same y-axis lanes as the board: one group per decision, empty ones skipped.
    const groups = DECISIONS.map((decision) => ({
      decision,
      rows: dated.filter((r) => r.bet.decision === decision)
    })).filter((g) => g.rows.length > 0)
    return { groups, undated }
  }, [bets, today])

  const hasRows = groups.length > 0

  // Visible window: the selected calendar year.
  const windowStart = new Date(year, 0, 1)
  const windowEnd = new Date(year, 11, 31)
  const totalDays = (windowEnd.getTime() - windowStart.getTime()) / MS_PER_DAY
  const pct = (d: Date) =>
    Math.min(100, Math.max(0, ((d.getTime() - windowStart.getTime()) / MS_PER_DAY / totalDays) * 100))
  const todayPct = pct(today)
  const showToday = today >= windowStart && today <= windowEnd

  return (
    <div className="px-8 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        {/* Year navigation */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous year"
            onClick={() => setYear((y) => y - 1)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="!size-4" />
          </Button>
          <span className="text-sm font-bold text-foreground tabular-nums w-12 text-center">
            {year}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next year"
            onClick={() => setYear((y) => y + 1)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="!size-4" />
          </Button>
          {year !== DEFAULT_YEAR && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setYear(DEFAULT_YEAR)}
              className="text-xs uppercase tracking-wider2 text-muted-foreground hover:text-foreground"
            >
              Today
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs uppercase tracking-wider2 text-muted-foreground">
          {STAGES.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={cn('inline-block size-2.5 rounded-sm', STAGE_BAR[s])} />
              {s}
            </span>
          ))}
          {showToday && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-px h-3 bg-destructive" />
              Today
            </span>
          )}
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="min-w-[900px]">
          {/* Month header */}
          <div className="flex border-b bg-popover/30">
            <div className="w-[44px] shrink-0 border-r" />
            <div className="w-56 shrink-0 px-5 py-3 text-xs uppercase tracking-wider2 text-muted-foreground border-r">
              Bet
            </div>
            <div className="relative flex flex-1">
              {MONTHS.map((m) => (
                <div
                  key={m}
                  className={cn(
                    'flex-1 px-2 py-3 text-xs text-muted-foreground border-r last:border-r-0 whitespace-nowrap',
                    m === 0 && 'text-foreground font-bold'
                  )}
                >
                  {new Date(year, m, 1).toLocaleDateString('en-GB', { month: 'short' })}
                  {m === 0 && ` ${year}`}
                </div>
              ))}
            </div>
          </div>

          {/* Rows, grouped by decision like the board's columns */}
          <TooltipProvider delayDuration={150}>
            {groups.map(({ decision, rows }) => (
              <div key={decision} className="flex border-b last:border-b-0">
                <DecisionGutter decision={decision} />
                <div className="flex-1 min-w-0">
                {rows.map(({ bet, bars }) => {
              const visible = bars.filter((b) => b.end >= windowStart && b.start <= windowEnd)
              const allBefore = visible.length === 0 && bars.every((b) => b.end < windowStart)
              return (
                <div
                  key={bet.id}
                  className="flex border-b last:border-b-0 group cursor-pointer hover:bg-popover/40 transition-colors"
                  onClick={() => onBetClick(bet.id)}
                >
                  <div className="w-56 shrink-0 px-5 py-4 border-r space-y-1.5">
                    <div className="text-xs font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {bet.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ScorePill score={bet.score} />
                    </div>
                  </div>
                  <div className="relative flex-1 min-h-[64px]">
                    {/* Month gridlines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {MONTHS.map((m) => (
                        <div key={m} className="flex-1 border-r last:border-r-0 border-border/40" />
                      ))}
                    </div>
                    {showToday && (
                      <div
                        className="absolute inset-y-0 w-px bg-destructive/70 pointer-events-none"
                        style={{ left: `${todayPct}%` }}
                      />
                    )}
                    {visible.length === 0 && (
                      <div className="absolute inset-0 flex items-center px-4 text-[11px] text-muted-foreground/60">
                        {allBefore ? '← Activity in earlier years' : 'Activity in later years →'}
                      </div>
                    )}
                    {visible.map((bar) => {
                      const clippedLeft = bar.start < windowStart
                      const clippedRight = bar.end > windowEnd
                      const left = pct(bar.start)
                      const width = Math.max(pct(bar.end) - left, 0.75)
                      return (
                        <Tooltip key={bar.stage}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-1/2 -translate-y-1/2 h-5 rounded-sm transition-opacity',
                                STAGE_BAR[bar.stage],
                                bet.decision === 'Killed' && 'opacity-40 saturate-0',
                                clippedLeft && 'rounded-l-none',
                                clippedRight && 'rounded-r-none',
                                !clippedRight &&
                                  bar.endIsEstimated &&
                                  'rounded-r-none [mask-image:linear-gradient(to_right,black_85%,transparent)]'
                              )}
                              style={{ left: `${left}%`, width: `${width}%` }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <span className="font-bold">{bar.stage}</span>
                            {' · '}
                            {formatRange(
                              bet.timeline?.[bar.stage]?.start,
                              bet.timeline?.[bar.stage]?.end
                            )}
                            {bar.endIsEstimated && ' (end TBD)'}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                    </div>
                  )
                })}
                </div>
              </div>
            ))}
          </TooltipProvider>

          {!hasRows && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No bets have timeline dates yet. Add dates when creating a bet, or via the AI co-pilot.
            </div>
          )}
        </div>
      </Card>

      {undated.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider2 text-muted-foreground">
            <CalendarOff className="size-3" />
            No timeline set
          </div>
          <div className="flex flex-wrap gap-2">
            {undated.map((bet) => (
              <button
                key={bet.id}
                type="button"
                onClick={() => onBetClick(bet.id)}
                className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                {bet.name}
                <DecisionBadge decision={bet.decision} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
