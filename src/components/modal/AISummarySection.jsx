import { Sparkles } from 'lucide-react'

export function AISummarySection({ bet }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-accent mb-3">
        <Sparkles size={11} />
        <span>AI-generated</span>
      </div>
      <p className="text-sm text-fg leading-relaxed bg-elevated/50 border border-line rounded-card p-4">
        {bet.aiSummary}
      </p>
    </div>
  )
}
