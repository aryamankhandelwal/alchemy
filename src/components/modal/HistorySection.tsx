import { AudioLines, Clock, Move, Sparkles, type LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { describeChange } from '@/lib/history'
import { cn } from '@/lib/utils'
import type { Bet, HistorySource } from '@/types/bet'

interface SourceMeta {
  label: string
  Icon: LucideIcon
  tone: string
}

const SOURCE_META: Record<HistorySource, SourceMeta> = {
  ai: { label: 'AI update', Icon: Sparkles, tone: 'text-primary' },
  drag: { label: 'Board move', Icon: Move, tone: 'text-warning' },
  system: { label: 'System', Icon: Clock, tone: 'text-muted-foreground' },
  granola: { label: 'Granola sync', Icon: AudioLines, tone: 'text-success' }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function HistorySection({ bet }: { bet: Bet }) {
  const history = bet.history ?? []
  if (history.length === 0) {
    return (
      <Card className="text-sm text-muted-foreground/70 border-dashed p-6 text-center shadow-none">
        No changes yet. Edits made via the AI chat or by dragging this bet across the board will appear here.
      </Card>
    )
  }
  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const meta = SOURCE_META[entry.source] ?? SOURCE_META.system
        const Icon = meta.Icon
        return (
          <Card key={entry.id} className="bg-popover/40 p-4 shadow-none">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div
                className={cn(
                  'flex items-center gap-2 text-[10px] uppercase tracking-wider2',
                  meta.tone
                )}
              >
                <Icon className="size-3" />
                <span>{entry.note || meta.label}</span>
              </div>
              <div className="text-[10px] text-muted-foreground/70">
                {formatTimestamp(entry.timestamp)}
              </div>
            </div>
            <div className="space-y-2">
              {entry.changes.map((c, i) => {
                const { label, detail } = describeChange(c)
                return (
                  <div key={i} className="text-xs">
                    <div className="text-muted-foreground">{label}</div>
                    <div className="text-foreground font-medium leading-snug break-words">
                      {detail}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
