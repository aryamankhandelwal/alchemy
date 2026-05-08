import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { SummarySection } from './modal/SummarySection.jsx'
import { MarketSection } from './modal/MarketSection.jsx'
import { RiskSection } from './modal/RiskSection.jsx'
import { KPISection } from './modal/KPISection.jsx'
import { ProjectionsSection } from './modal/ProjectionsSection.jsx'
import { HistorySection } from './modal/HistorySection.jsx'
import { ChatPanel } from './ChatPanel.jsx'
import { StageBadge, DecisionBadge } from './ui/Badge.jsx'

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'market', label: 'Market' },
  { id: 'kpis', label: 'KPIs' },
  { id: 'risk', label: 'Risk Assessment' },
  { id: 'projections', label: 'Projections Simulator' },
  { id: 'history', label: 'History' }
]

export function BetModal({ bet, onClose, onPatch }) {
  const [activeTab, setActiveTab] = useState('summary')

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
        <div className="relative flex flex-col min-h-0">
          <div className="bg-surface px-8 pt-8 pb-0 border-b border-line">
            <div className="flex items-start justify-between gap-4 mb-5">
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
            <div className="flex gap-1 -mb-px overflow-x-auto">
              {TABS.map((t) => {
                const active = activeTab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-2.5 text-[11px] uppercase tracking-wider2 whitespace-nowrap border-b-2 transition-colors
                                ${active
                                  ? 'border-accent text-fg'
                                  : 'border-transparent text-muted hover:text-fg'}`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
            {activeTab === 'summary' && <SummarySection bet={bet} />}
            {activeTab === 'market' && <MarketSection bet={bet} />}
            {activeTab === 'kpis' && <KPISection bet={bet} />}
            {activeTab === 'risk' && <RiskSection bet={bet} />}
            {activeTab === 'projections' && <ProjectionsSection bet={bet} />}
            {activeTab === 'history' && <HistorySection bet={bet} />}
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
