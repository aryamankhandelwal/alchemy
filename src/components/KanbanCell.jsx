import { useDroppable } from '@dnd-kit/core'

export function KanbanCell({ stage, decision, isLastCol, isLastRow, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${stage}:${decision}`,
    data: { stage, decision }
  })

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[200px] p-4 transition-colors
                  ${!isLastCol ? 'border-r border-divider' : ''}
                  ${!isLastRow ? 'border-b border-divider' : ''}
                  ${isOver ? 'bg-accent/[0.04]' : ''}`}
    >
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}
