import { KPIDot } from '@/components/bet-badges'
import { cn } from '@/lib/utils'
import { evaluateKpi, formatKpiValue, getKpiDefs } from '@/lib/kpiSchema'
import type { Bet, KpiStatus } from '@/types/bet'

const STATUS_TONE: Record<KpiStatus, string> = {
  Prioritise: 'text-success',
  Proceed: 'text-warning',
  Kill: 'text-destructive'
}

export function KPISection({ bet }: { bet: Bet }) {
  const defs = getKpiDefs(bet.stage)
  const keys = Object.keys(defs)

  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground mb-3">
        {bet.stage} stage KPIs · {keys.length} metrics
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1fr_1.8fr_1fr] gap-3 text-[10px] uppercase tracking-wider2 text-muted-foreground bg-popover/50 px-4 py-2.5 border-b">
          <div>KPI</div>
          <div>Value</div>
          <div>Threshold</div>
          <div>Status</div>
        </div>
        {keys.map((k, i) => {
          const def = defs[k]
          const value = bet.kpis?.[k]
          const status = evaluateKpi(bet.stage, k, value)
          const formatted = formatKpiValue(bet.stage, k, value)
          return (
            <div
              key={k}
              className={cn(
                'grid grid-cols-[1.6fr_1fr_1.8fr_1fr] gap-3 items-center px-4 py-3 text-xs',
                i < keys.length - 1 && 'border-b'
              )}
            >
              <div>
                <div className="text-foreground">{def.label}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">{def.rationale}</div>
              </div>
              <div className="text-primary font-medium">{formatted}</div>
              <div className="text-muted-foreground text-[11px]">{def.thresholds}</div>
              <div className="flex items-center gap-2">
                {status && <KPIDot status={status} />}
                <span className={status ? STATUS_TONE[status] : 'text-muted-foreground/60'}>
                  {status || '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
