const SEVERITY_TONE = { Low: 'text-ok', Medium: 'text-warn', High: 'text-bad' }

export function RiskSection({ bet }) {
  const risks = bet.risks || []
  if (risks.length === 0) {
    return <div className="text-sm text-dim">No risks logged.</div>
  }
  return (
    <div className="space-y-3">
      {risks.map((r, i) => (
        <div key={i} className="border border-line rounded-card p-4 bg-elevated/40">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="text-sm text-fg font-medium">{r.name}</div>
            <span className={`text-[10px] uppercase tracking-wider2 shrink-0 ${SEVERITY_TONE[r.severity] || 'text-muted'}`}>
              {r.severity}
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-wider2 text-muted mb-2">{r.category}</div>
          <div className="text-xs text-muted leading-relaxed">
            <span className="text-dim">Mitigation:</span> {r.mitigation}
          </div>
        </div>
      ))}
    </div>
  )
}
