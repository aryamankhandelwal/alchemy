import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { SEED_BETS } from '@/data/bets'
import { applyPatch } from '@/lib/applyPatch'
import { createBet } from '@/lib/createBet'
import { appendHistory, diffPatch, makeHistoryEntry } from '@/lib/history'
import type { Bet, Decision, Patch, Stage } from '@/types/bet'

import { AddBetModal } from '@/components/AddBetModal'
import { BetModal } from '@/components/BetModal'
import { Header } from '@/components/Header'
import { KanbanGrid } from '@/components/KanbanGrid'
import { SummaryBar } from '@/components/SummaryBar'
import { Toaster } from '@/components/ui/sonner'
import type { CreateBetInput } from '@/lib/createBet'

export default function App() {
  const [bets, setBets] = useState<Bet[]>(SEED_BETS)
  const [openBetId, setOpenBetId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const openBet = openBetId ? bets.find((b) => b.id === openBetId) ?? null : null

  const handleBetMoved = useCallback((id: string, stage: Stage, decision: Decision) => {
    setBets((prev) => {
      const moved = prev.find((b) => b.id === id)
      if (moved) toast.success(`${moved.name} moved to ${stage} · ${decision}`)
      return prev.map((b) => {
        if (b.id !== id) return b
        const changes = []
        if (b.stage !== stage) changes.push({ path: 'stage', op: 'set' as const, before: b.stage, after: stage })
        if (b.decision !== decision)
          changes.push({ path: 'decision', op: 'set' as const, before: b.decision, after: decision })
        const entry = makeHistoryEntry('drag', changes, 'Moved on board')
        return appendHistory({ ...b, stage, decision }, entry)
      })
    })
  }, [])

  const handlePatch = useCallback((id: string, patch: Patch) => {
    setBets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b
        const changes = diffPatch(b, patch)
        const next = applyPatch(b, patch)
        const entry = makeHistoryEntry('ai', changes, 'AI update')
        return appendHistory(next, entry)
      })
    )
  }, [])

  const handleCreate = useCallback((formData: CreateBetInput) => {
    const bet = createBet(formData)
    setBets((prev) => [...prev, bet])
    setAddOpen(false)
    toast.success(`${bet.name} added to ${bet.stage} · ${bet.decision}`)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header onAddBet={() => setAddOpen(true)} />
      <SummaryBar bets={bets} />
      <main className="flex-1">
        <KanbanGrid bets={bets} onBetMoved={handleBetMoved} onBetClick={setOpenBetId} />
      </main>
      <BetModal bet={openBet} onClose={() => setOpenBetId(null)} onPatch={handlePatch} />
      <AddBetModal open={addOpen} onClose={() => setAddOpen(false)} onCreate={handleCreate} />
      <Toaster />
    </div>
  )
}
