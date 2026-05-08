import { Sparkles } from 'lucide-react'
import { StageBadge, DecisionBadge } from '../ui/Badge.jsx'
import { scoreTone } from '../ui/ScorePill.jsx'

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider2 text-muted mb-1.5">{label}</div>
      <div className="text-sm text-fg leading-relaxed">{children}</div>
    </div>
  )
}

export function SummarySection({ bet }) {
  return (
    <div className="space-y-6">
      <Field label="Description">{bet.description}</Field>

      <div className="grid grid-cols-3 gap-5">
        <Field label="Stage"><StageBadge stage={bet.stage} /></Field>
        <Field label="Decision"><DecisionBadge decision={bet.decision} /></Field>
        <Field label="Score">
          {bet.score == null ? (
            <span className="text-2xl text-dim font-bold leading-none">—</span>
          ) : (
            <>
              <span className={`text-2xl font-bold leading-none ${scoreTone(bet.score)}`}>{bet.score}</span>
              <span className="text-muted text-sm ml-1">/ 100</span>
            </>
          )}
        </Field>
      </div>

      <Field label="Null hypothesis">{bet.nullHypothesis}</Field>
      <Field label="Target customer">{bet.targetCustomer}</Field>

      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-accent mb-3">
          <Sparkles size={11} />
          <span>AI summary</span>
        </div>
        <p className="text-sm text-fg leading-relaxed bg-elevated/50 border border-line rounded-card p-4">
          {bet.aiSummary}
        </p>
      </div>
    </div>
  )
}
