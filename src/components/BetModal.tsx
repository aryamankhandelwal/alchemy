import { useState } from 'react'
import { Loader2, RefreshCw, X } from 'lucide-react'

import { ChatPanel } from '@/components/ChatPanel'
import { DecisionBadge, StageBadge } from '@/components/bet-badges'
import { HistorySection } from '@/components/modal/HistorySection'
import { KPISection } from '@/components/modal/KPISection'
import { MarketSection } from '@/components/modal/MarketSection'
import { ProjectionsSection } from '@/components/modal/ProjectionsSection'
import { RiskSection } from '@/components/modal/RiskSection'
import { SummarySection } from '@/components/modal/SummarySection'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Bet, Patch } from '@/types/bet'

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'market', label: 'Market' },
  { id: 'kpis', label: 'KPIs' },
  { id: 'risk', label: 'Risk Assessment' },
  { id: 'projections', label: 'Projections Simulator' },
  { id: 'history', label: 'History' }
] as const

interface BetModalProps {
  bet: Bet | null
  onClose: () => void
  onPatch: (id: string, patch: Patch) => void | Promise<void>
  onResearch?: (id: string) => Promise<Bet | null>
}

export function BetModal({ bet, onClose, onPatch, onResearch }: BetModalProps) {
  const [researching, setResearching] = useState(false)

  const runResearch = async () => {
    if (!bet || !onResearch || researching) return
    setResearching(true)
    try {
      await onResearch(bet.id)
    } finally {
      setResearching(false)
    }
  }

  return (
    <Dialog
      open={!!bet}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {bet && (
        <DialogContent
          hideCloseButton
          className="max-w-[1200px] w-[95vw] h-[88vh] p-0 gap-0 overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_400px] sm:rounded-xl"
        >
          <DialogTitle className="sr-only">{bet.name}</DialogTitle>
          <DialogDescription className="sr-only">{bet.description}</DialogDescription>

          <Tabs defaultValue="summary" className="relative flex flex-col min-h-0">
            <div className="bg-card px-8 pt-8 pb-0 border-b">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <StageBadge stage={bet.stage} />
                    <DecisionBadge decision={bet.decision} />
                  </div>
                  <h2 className="text-xl text-foreground font-bold leading-tight">{bet.name}</h2>
                </div>
                <div className="flex items-center gap-1 -mt-1 -mr-1">
                  {onResearch && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={runResearch}
                      disabled={researching}
                      className="text-[11px] uppercase tracking-wider2 border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                      {researching ? (
                        <Loader2 className="!size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="!size-3.5" />
                      )}
                      <span>{researching ? 'Researching…' : 'Refresh market data'}</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X />
                  </Button>
                </div>
              </div>
              <TabsList className="h-auto bg-transparent p-0 flex gap-1 -mb-px overflow-x-auto rounded-none justify-start">
                {TABS.map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="px-3 py-2.5 text-[11px] uppercase tracking-wider2 whitespace-nowrap rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
              <TabsContent value="summary" className="mt-0">
                <SummarySection bet={bet} />
              </TabsContent>
              <TabsContent value="market" className="mt-0">
                <MarketSection bet={bet} />
              </TabsContent>
              <TabsContent value="kpis" className="mt-0">
                <KPISection bet={bet} />
              </TabsContent>
              <TabsContent value="risk" className="mt-0">
                <RiskSection bet={bet} />
              </TabsContent>
              <TabsContent value="projections" className="mt-0">
                <ProjectionsSection bet={bet} />
              </TabsContent>
              <TabsContent value="history" className="mt-0">
                <HistorySection bet={bet} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="hidden md:block min-h-0">
            <ChatPanel bet={bet} onPatch={onPatch} />
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
