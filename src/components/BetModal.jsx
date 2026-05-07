import { useEffect } from 'react'
import { X } from 'lucide-react'
import { CollapsibleSection } from './modal/CollapsibleSection.jsx'
import { OverviewSection } from './modal/OverviewSection.jsx'
import { AISummarySection } from './modal/AISummarySection.jsx'
import { MarketSection } from './modal/MarketSection.jsx'
import { RiskSection } from './modal/RiskSection.jsx'
import { KPISection } from './modal/KPISection.jsx'
import { ChatPanel } from './ChatPanel.jsx'
import { StageBadge, DecisionBadge } from './ui/Badge.jsx'

export function BetModal({ bet, onClose, onPatch }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[1200px] h-[88vh] bg-surface border border-line rounded-modal overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_400px] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left panel — bet detail */}
        <div className="relative overflow-y-auto min-h-0">
          <div className="sticky top-0 z-10 bg-surface px-8 pt-8 pb-4 border-b border-line">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <StageBadge stage={bet.stage} />
                  <DecisionBadge decision={bet.decision} />
                </div>
                <h2 className="text-xl text-fg font-bold leading-tight">{bet.name}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-muted hover:text-fg transition-colors p-1.5 -mt-1 -mr-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="px-8 pb-8">
            <CollapsibleSection title="Overview" defaultOpen>
              <OverviewSection bet={bet} />
            </CollapsibleSection>
            <CollapsibleSection title="AI Summary" defaultOpen>
              <AISummarySection bet={bet} />
            </CollapsibleSection>
            <CollapsibleSection title="KPI Tracker" defaultOpen>
              <KPISection bet={bet} />
            </CollapsibleSection>
            <CollapsibleSection title="Market Analysis">
              <MarketSection bet={bet} />
            </CollapsibleSection>
            <CollapsibleSection title="Risk Assessment">
              <RiskSection bet={bet} />
            </CollapsibleSection>
          </div>
        </div>

        {/* Right panel — AI chat */}
        <div className="hidden md:block min-h-0">
          <ChatPanel bet={bet} onPatch={onPatch} />
        </div>
      </div>
    </div>
  )
}
