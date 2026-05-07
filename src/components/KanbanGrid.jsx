import { Fragment, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { STAGES, DECISIONS, STAGE_DESCRIPTION, DECISION_DESCRIPTION } from '../lib/stages.js'
import { KanbanCell } from './KanbanCell.jsx'
import { BetCard } from './BetCard.jsx'

export function KanbanGrid({ bets, onBetMoved, onBetClick }) {
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeBet = activeId ? bets.find(b => b.id === activeId) : null

  const handleDragEnd = (event) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const target = over.data.current
    if (!target) return
    const bet = bets.find(b => b.id === active.id)
    if (!bet) return
    if (bet.stage === target.stage && bet.decision === target.decision) return
    onBetMoved(active.id, target.stage, target.decision)
  }

  return (
    <div className="px-8 py-6">
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-[160px_1fr_1fr_1fr] border border-line rounded-card overflow-hidden bg-bg">
          {/* Header row */}
          <div className="bg-elevated/40 border-b border-divider" />
          {STAGES.map((stage, i) => (
            <div
              key={stage}
              className={`px-5 py-4 bg-elevated/40 border-b border-divider ${i > 0 ? 'border-l border-divider' : 'border-l border-divider'}`}
            >
              <div className="text-[10px] uppercase tracking-wider2 text-muted">{stage}</div>
              <div className="text-[10px] text-dim mt-1 leading-snug">{STAGE_DESCRIPTION[stage]}</div>
            </div>
          ))}

          {/* Decision rows */}
          {DECISIONS.map((decision, rIdx) => {
            const isLastRow = rIdx === DECISIONS.length - 1
            return (
              <Fragment key={decision}>
                <div className={`px-4 py-4 bg-elevated/20 border-r border-divider ${!isLastRow ? 'border-b border-divider' : ''}`}>
                  <div className="text-[10px] uppercase tracking-wider2 text-muted">{decision}</div>
                  <div className="text-[10px] text-dim mt-1 leading-snug">{DECISION_DESCRIPTION[decision]}</div>
                </div>
                {STAGES.map((stage, cIdx) => {
                  const cellBets = bets.filter(b => b.stage === stage && b.decision === decision)
                  return (
                    <KanbanCell
                      key={`${stage}:${decision}`}
                      stage={stage}
                      decision={decision}
                      isLastCol={cIdx === STAGES.length - 1}
                      isLastRow={isLastRow}
                    >
                      {cellBets.map(b => (
                        <BetCard key={b.id} bet={b} onClick={onBetClick} />
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
