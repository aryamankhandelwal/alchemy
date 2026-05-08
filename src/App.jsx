import { useState, useCallback } from 'react'
import { SEED_BETS } from './data/bets.js'
import { applyPatch } from './lib/applyPatch.js'
import { createBet } from './lib/createBet.js'
import { diffPatch, makeHistoryEntry, appendHistory } from './lib/history.js'
import { Header } from './components/Header.jsx'
import { SummaryBar } from './components/SummaryBar.jsx'
import { KanbanGrid } from './components/KanbanGrid.jsx'
import { BetModal } from './components/BetModal.jsx'
import { AddBetModal } from './components/AddBetModal.jsx'
import { Toast } from './components/Toast.jsx'

export default function App() {
  const [bets, setBets] = useState(SEED_BETS)
  const [openBetId, setOpenBetId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const openBet = openBetId ? bets.find(b => b.id === openBetId) : null

  const handleBetMoved = useCallback((id, stage, decision) => {
    setBets(prev => {
      const moved = prev.find(b => b.id === id)
      if (moved) setToast(`${moved.name} moved to ${stage} · ${decision}`)
      return prev.map(b => {
        if (b.id !== id) return b
        const changes = []
        if (b.stage !== stage) changes.push({ path: 'stage', op: 'set', before: b.stage, after: stage })
        if (b.decision !== decision) changes.push({ path: 'decision', op: 'set', before: b.decision, after: decision })
        const entry = makeHistoryEntry('drag', changes, 'Moved on board')
        return appendHistory({ ...b, stage, decision }, entry)
      })
    })
  }, [])

  const handlePatch = useCallback((id, patch) => {
    setBets(prev => prev.map(b => {
      if (b.id !== id) return b
      const changes = diffPatch(b, patch)
      const next = applyPatch(b, patch)
      const entry = makeHistoryEntry('ai', changes, 'AI update')
      return appendHistory(next, entry)
    }))
  }, [])

  const handleCreate = useCallback((formData) => {
    const bet = createBet(formData)
    setBets(prev => [...prev, bet])
    setAddOpen(false)
    setToast(`${bet.name} added to ${bet.stage} · ${bet.decision}`)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      <Header onAddBet={() => setAddOpen(true)} />
      <SummaryBar bets={bets} />
      <main className="flex-1">
        <KanbanGrid
          bets={bets}
          onBetMoved={handleBetMoved}
          onBetClick={setOpenBetId}
        />
      </main>
      {openBet && (
        <BetModal
          bet={openBet}
          onClose={() => setOpenBetId(null)}
          onPatch={handlePatch}
        />
      )}
      <AddBetModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
      />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
