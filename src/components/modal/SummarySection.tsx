import { Sparkles } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { DecisionBadge, StageBadge, scoreTone } from '@/components/bet-badges'
import { cn } from '@/lib/utils'
import type { Bet } from '@/types/bet'

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

export function SummarySection({ bet }: { bet: Bet }) {
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
    </div>
  )
}
