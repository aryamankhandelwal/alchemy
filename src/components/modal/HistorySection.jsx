import { Clock, Sparkles, Move } from 'lucide-react'
import { describeChange } from '../../lib/history.js'

const SOURCE_META = {
  ai: { label: 'AI update', Icon: Sparkles, tone: 'text-accent' },
  drag: { label: 'Board move', Icon: Move, tone: 'text-warn' },
  system: { label: 'System', Icon: Clock, tone: 'text-muted' }
}

function formatTimestamp(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function HistorySection({ bet }) {
  const history = bet.history || []
  if (history.length === 0) {
    return (
      <div className="text-sm text-dim border border-dashed border-line rounded-card p-6 text-center">
        No changes yet. Edits made via the AI chat or by dragging this bet across the board will appear here.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const meta = SOURCE_META[entry.source] || SOURCE_META.system
        const Icon = meta.Icon
        return (
          <div key={entry.id} className="border border-line rounded-card bg-elevated/40 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className={`flex items-center gap-2 text-[10px] uppercase tracking-wider2 ${meta.tone}`}>
                <Icon size={11} />
                <span>{entry.note || meta.label}</span>
              </div>
              <div className="text-[10px] text-dim">{formatTimestamp(entry.timestamp)}</div>
            </div>
            <div className="space-y-2">
              {entry.changes.map((c, i) => {
                const { label, detail } = describeChange(c)
                return (
                  <div key={i} className="text-xs">
                    <div className="text-muted">{label}</div>
                    <div className="text-fg font-medium leading-snug break-words">{detail}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
