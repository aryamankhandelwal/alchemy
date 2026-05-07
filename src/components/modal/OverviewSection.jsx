import { StageBadge, DecisionBadge } from '../ui/Badge.jsx'

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider2 text-muted mb-1.5">{label}</div>
      <div className="text-sm text-fg leading-relaxed">{children}</div>
    </div>
  )
}

export function OverviewSection({ bet }) {
  return (
    <div className="space-y-5">
      <Field label="Description">{bet.description}</Field>

      <div className="grid grid-cols-3 gap-5">
        <Field label="Stage"><StageBadge stage={bet.stage} /></Field>
        <Field label="Decision"><DecisionBadge decision={bet.decision} /></Field>
        <Field label="Score">
          <span className="text-2xl text-accent font-bold leading-none">{bet.score}</span>
          <span className="text-muted text-sm ml-1">/ 100</span>
        </Field>
      </div>

      <Field label="Null hypothesis">{bet.nullHypothesis}</Field>
      <Field label="Target customer">{bet.targetCustomer}</Field>
    </div>
  )
}
