import { useDraggable } from '@dnd-kit/core'
import { StageBadge, DecisionBadge } from './ui/Badge.jsx'
import { KPIDot } from './ui/KPIDot.jsx'
import { ScorePill } from './ui/ScorePill.jsx'
import { getKpiDefs, evaluateKpi } from '../lib/kpiSchema.js'

export function BetCard({ bet, onClick, isDragOverlay = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: bet.id,
    data: { betId: bet.id }
  })

  const defs = getKpiDefs(bet.stage)
  const kpiKeys = Object.keys(defs).slice(0, 3)
  const dots = kpiKeys.map(k => evaluateKpi(bet.stage, k, bet.kpis?.[k]))

  const dimmed = !isDragOverlay && isDragging ? 'opacity-30' : ''
  const overlayCls = isDragOverlay ? 'shadow-2xl ring-1 ring-accent/40 rotate-1' : ''

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={() => { if (!isDragging && !isDragOverlay) onClick?.(bet.id) }}
      className={`group relative bg-surface border border-line rounded-card p-5 select-none shadow-card
                  ${isDragOverlay ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}
                  hover:border-accent/40 hover:-translate-y-1 hover:shadow-card-hover
                  transition-[transform,box-shadow,border-color] duration-150
                  ${dimmed} ${overlayCls}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-sm text-fg leading-snug pr-1 group-hover:text-accent transition-colors">
          {bet.name}
        </h3>
        <ScorePill score={bet.score} />
      </div>
      <p className="text-[11px] text-muted leading-relaxed mb-4 line-clamp-2 min-h-[2.6em]">
        {bet.description}
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StageBadge stage={bet.stage} />
          <DecisionBadge decision={bet.decision} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {dots.map((status, i) => <KPIDot key={i} status={status} />)}
        </div>
      </div>
    </div>
  )
}
