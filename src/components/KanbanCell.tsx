import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import type { Decision, Stage } from '@/types/bet'

interface KanbanCellProps {
  stage: Stage
  decision: Decision
  isLastCol: boolean
  isLastRow: boolean
  children: ReactNode
}

export function KanbanCell({ stage, decision, isLastCol, isLastRow, children }: KanbanCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${stage}:${decision}`,
    data: { stage, decision }
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative min-h-[200px] p-4 transition-colors',
        !isLastCol && 'border-r',
        !isLastRow && 'border-b',
        isOver && 'bg-primary/[0.04]'
      )}
    >
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}
