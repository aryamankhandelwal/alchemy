import { useDraggable } from '@dnd-kit/core'
import { Trash2 } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { DecisionBadge, KPIDot, ScorePill, StageBadge } from '@/components/bet-badges'
import { evaluateKpi, getKpiDefs } from '@/lib/kpiSchema'
import { cn } from '@/lib/utils'
import type { Bet } from '@/types/bet'

interface BetCardProps {
  bet: Bet
  onClick?: (id: string) => void
  onDelete?: (id: string) => void
  isDragOverlay?: boolean
}

export function BetCard({ bet, onClick, onDelete, isDragOverlay = false }: BetCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: bet.id,
    data: { betId: bet.id }
  })

  const defs = getKpiDefs(bet.stage)
  const kpiKeys = Object.keys(defs).slice(0, 3)
  const dots = kpiKeys.map((k) => evaluateKpi(bet.stage, k, bet.kpis?.[k]))

  return (
    <Card
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={() => {
        if (!isDragging && !isDragOverlay) onClick?.(bet.id)
      }}
      className={cn(
        'group relative p-5 select-none shadow-md transition-[transform,box-shadow,border-color] duration-150',
        isDragOverlay
          ? 'cursor-grabbing shadow-2xl ring-1 ring-primary/40 rotate-1'
          : 'cursor-grab active:cursor-grabbing hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl',
        !isDragOverlay && isDragging && 'opacity-30'
      )}
    >
      {onDelete && !isDragOverlay && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(bet.id)
          }}
          aria-label={`Delete ${bet.name}`}
          className="absolute top-2 right-2 size-6 rounded-md text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all flex items-center justify-center"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-sm text-foreground leading-snug pr-1 group-hover:text-primary transition-colors">
          {bet.name}
        </h3>
        <ScorePill score={bet.score} />
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 line-clamp-2 min-h-[2.6em]">
        {bet.description}
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StageBadge stage={bet.stage} />
          <DecisionBadge decision={bet.decision} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {dots.map((status, i) => (
            <KPIDot key={i} status={status} />
          ))}
        </div>
      </div>
    </Card>
  )
}
