import { getKpiDefs, evaluateKpi, formatKpiValue } from '../../lib/kpiSchema.js'
import { KPIDot } from '../ui/KPIDot.jsx'

const STATUS_TONE = {
  Prioritise: 'text-ok',
  Proceed: 'text-warn',
  Kill: 'text-bad'
}

export function KPISection({ bet }) {
  const defs = getKpiDefs(bet.stage)
  const keys = Object.keys(defs)

  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider2 text-muted mb-3">
        {bet.stage} stage KPIs · {keys.length} metrics
      </div>
      <div className="border border-line rounded-card overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1fr_1.8fr_1fr] gap-3 text-[10px] uppercase tracking-wider2 text-muted bg-elevated/50 px-4 py-2.5 border-b border-line">
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
              className={`grid grid-cols-[1.6fr_1fr_1.8fr_1fr] gap-3 items-center px-4 py-3 text-xs
                          ${i < keys.length - 1 ? 'border-b border-divider' : ''}`}
            >
              <div>
                <div className="text-fg">{def.label}</div>
                <div className="text-[10px] text-dim mt-0.5">{def.rationale}</div>
              </div>
              <div className="text-accent font-medium">{formatted}</div>
              <div className="text-muted text-[11px]">{def.thresholds}</div>
              <div className="flex items-center gap-2">
                {status && <KPIDot status={status} />}
                <span className={status ? STATUS_TONE[status] : 'text-dim'}>{status || '—'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
