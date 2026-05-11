import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Bet, Severity } from '@/types/bet'

const SEVERITY_TONE: Record<Severity, string> = {
  Low: 'text-success',
  Medium: 'text-warning',
  High: 'text-destructive'
}

export function RiskSection({ bet }: { bet: Bet }) {
  const risks = bet.risks ?? []
  if (risks.length === 0) {
    return <div className="text-sm text-muted-foreground/70">No risks logged.</div>
  }
  return (
    <div className="space-y-3">
      {risks.map((r, i) => (
        <Card key={i} className="p-4 bg-popover/40 shadow-none">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="text-sm text-foreground font-medium">{r.name}</div>
            <span
              className={cn(
                'text-[10px] uppercase tracking-wider2 shrink-0',
                SEVERITY_TONE[r.severity] ?? 'text-muted-foreground'
              )}
            >
              {r.severity}
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground mb-2">
            {r.category}
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-muted-foreground/70">Mitigation:</span> {r.mitigation}
          </div>
        </Card>
      ))}
    </div>
  )
}
