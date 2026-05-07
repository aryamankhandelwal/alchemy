import { useState, useCallback } from 'react'
import { SEED_BETS } from './data/bets.js'
import { applyPatch } from './lib/applyPatch.js'
import { Header } from './components/Header.jsx'
import { SummaryBar } from './components/SummaryBar.jsx'
import { KanbanGrid } from './components/KanbanGrid.jsx'
import { BetModal } from './components/BetModal.jsx'
import { Toast } from './components/Toast.jsx'

export default function App() {
  const [bets, setBets] = useState(SEED_BETS)
  const [openBetId, setOpenBetId] = useState(null)
  const [toast, setToast] = useState(null)

  const openBet = openBetId ? bets.find(b => b.id === openBetId) : null

  const handleBetMoved = useCallback((id, stage, decision) => {
    setBets(prev => {
      const moved = prev.find(b => b.id === id)
      if (moved) setToast(`${moved.name} moved to ${stage} · ${decision}`)
      return prev.map(b => (b.id === id ? { ...b, stage, decision } : b))
    })
  }, [])

  const handlePatch = useCallback((id, patch) => {
    setBets(prev => prev.map(b => (b.id === id ? applyPatch(b, patch) : b)))
  }, [])

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      <Header />
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
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
