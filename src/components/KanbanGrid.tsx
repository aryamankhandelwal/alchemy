import { Fragment, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core'

import { DECISIONS, STAGES } from '@/lib/stages'
import type { Bet, Decision, Stage } from '@/types/bet'

import { BetCard } from './BetCard'
import { KanbanCell } from './KanbanCell'

interface KanbanGridProps {
  bets: Bet[]
  onBetMoved: (id: string, stage: Stage, decision: Decision) => void
  onBetClick: (id: string) => void
  onBetDelete?: (id: string) => void
}

export function KanbanGrid({ bets, onBetMoved, onBetClick, onBetDelete }: KanbanGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const activeBet = activeId ? bets.find((b) => b.id === activeId) ?? null : null

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const target = over.data.current as { stage: Stage; decision: Decision } | undefined
    if (!target) return
    const bet = bets.find((b) => b.id === active.id)
    if (!bet) return
    if (bet.stage === target.stage && bet.decision === target.decision) return
    onBetMoved(String(active.id), target.stage, target.decision)
  }

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id))

  return (
    <div className="px-8 py-6">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-[44px_1fr_1fr_1fr] border rounded-lg overflow-hidden bg-background">
          <div className="bg-popover/40 border-b" />
          {STAGES.map((stage) => (
            <div key={stage} className="px-5 py-3 bg-popover/40 border-b border-l">
              <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground">{stage}</div>
            </div>
          ))}

          {DECISIONS.map((decision, rIdx) => {
            const isLastRow = rIdx === DECISIONS.length - 1
            return (
              <Fragment key={decision}>
                <div
                  className={`flex items-center justify-center bg-popover/30 border-r ${
                    !isLastRow ? 'border-b' : ''
                  }`}
                >
                  <div
                    className="text-[10px] uppercase tracking-wider2 text-muted-foreground"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    {decision}
                  </div>
                </div>
                {STAGES.map((stage, cIdx) => {
                  const cellBets = bets.filter((b) => b.stage === stage && b.decision === decision)
                  return (
                    <KanbanCell
                      key={`${stage}:${decision}`}
                      stage={stage}
                      decision={decision}
                      isLastCol={cIdx === STAGES.length - 1}
                      isLastRow={isLastRow}
                    >
                      {cellBets.map((b) => (
                        <BetCard
                          key={b.id}
                          bet={b}
                          onClick={onBetClick}
                          onDelete={onBetDelete}
                        />
                      ))}
                    </KanbanCell>
                  )
                })}
              </Fragment>
            )
          })}
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 220,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
          }}
        >
          {activeBet ? <BetCard bet={activeBet} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
