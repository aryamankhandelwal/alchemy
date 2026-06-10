import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/apiClient'
import type { CreateBetInput } from '@/lib/createBet'
import type { Bet, Decision, Patch, Stage } from '@/types/bet'

import { AddBetModal } from '@/components/AddBetModal'
import { BetModal } from '@/components/BetModal'
import { Header } from '@/components/Header'
import { KanbanGrid } from '@/components/KanbanGrid'
import { SummaryBar } from '@/components/SummaryBar'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  const [bets, setBets] = useState<Bet[] | null>(null)
  const [openBetId, setOpenBetId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api
      .listBets()
      .then(setBets)
      .catch((e: Error) => {
        toast.error(`Failed to load bets: ${e.message}`)
        setBets([])
      })
  }, [])

  const openBet = bets && openBetId ? bets.find((b) => b.id === openBetId) ?? null : null

  const replaceBet = useCallback((updated: Bet) => {
    setBets((prev) => (prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : prev))
  }, [])

  const handleBetMoved = useCallback(
    async (id: string, stage: Stage, decision: Decision) => {
      const current = bets?.find((b) => b.id === id)
      if (!current) return
      if (current.stage === stage && current.decision === decision) return
      try {
        const updated = await api.patchBet(id, {
          patch: { stage, decision },
          source: 'drag',
          note: 'Moved on board'
        })
        replaceBet(updated)
        toast.success(`${updated.name} moved to ${stage} · ${decision}`)
      } catch (e) {
        toast.error(`Move failed: ${(e as Error).message}`)
      }
    },
    [bets, replaceBet]
  )

  const handlePatch = useCallback(
    async (id: string, patch: Patch) => {
      try {
        const updated = await api.patchBet(id, { patch, source: 'ai', note: 'AI update' })
        replaceBet(updated)
      } catch (e) {
        toast.error(`Update failed: ${(e as Error).message}`)
      }
    },
    [replaceBet]
  )

  const handleResearch = useCallback(
    async (id: string) => {
      try {
        const updated = await api.research(id)
        replaceBet(updated)
        toast.success(`${updated.name}: market data refreshed`)
        return updated
      } catch (e) {
        toast.error(`Research failed: ${(e as Error).message}`)
        return null
      }
    },
    [replaceBet]
  )

  const handleCreate = useCallback(async (formData: CreateBetInput) => {
    setCreating(true)
    try {
      const skeleton = await api.createBet(formData)
      setBets((prev) => (prev ? [...prev, skeleton] : [skeleton]))

      // Synchronous text enrichment so the card has substance before the modal closes.
      let enriched: Bet | null = null
      try {
        enriched = await api.enrich(skeleton.id)
        setBets((prev) => (prev ? prev.map((b) => (b.id === enriched!.id ? enriched! : b)) : prev))
      } catch (e) {
        toast.error(`Enrichment failed: ${(e as Error).message}`)
      }

      setAddOpen(false)
      toast.success(`${skeleton.name} added to ${skeleton.stage} · ${skeleton.decision}`)

      // Background market research — long-running, no need to block the modal.
      api
        .research(skeleton.id)
        .then((updated) => {
          setBets((prev) => (prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : prev))
          toast.success(`${updated.name}: market data populated`)
        })
        .catch((e: Error) => toast.error(`Market research failed: ${e.message}`))
    } catch (e) {
      toast.error(`Add bet failed: ${(e as Error).message}`)
    } finally {
      setCreating(false)
    }
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      const bet = bets?.find((b) => b.id === id)
      if (!bet) return
      if (!window.confirm(`Delete "${bet.name}"? This cannot be undone.`)) return
      const removeFromState = () => {
        setBets((prev) => (prev ? prev.filter((b) => b.id !== id) : prev))
        if (openBetId === id) setOpenBetId(null)
      }
      try {
        await api.deleteBet(id)
        removeFromState()
        toast.success(`${bet.name} deleted`)
      } catch (e) {
        const msg = (e as Error).message
        // If the server says it's already gone, sync local state and move on.
        if (/not found/i.test(msg)) {
          removeFromState()
          toast.success(`${bet.name} removed`)
          return
        }
        toast.error(`Delete failed: ${msg}`)
      }
    },
    [bets, openBetId]
  )

  if (bets === null) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading portfolio…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header onAddBet={() => setAddOpen(true)} />
      <SummaryBar bets={bets} />
      <main className="flex-1">
        <KanbanGrid
          bets={bets}
          onBetMoved={handleBetMoved}
          onBetClick={setOpenBetId}
        />
      </main>
      <BetModal
        bet={openBet}
        onClose={() => setOpenBetId(null)}
        onPatch={handlePatch}
        onResearch={handleResearch}
        onDelete={handleDelete}
      />
      <AddBetModal
        open={addOpen}
        loading={creating}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
      />
      <Toaster />
    </div>
  )
}
