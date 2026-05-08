function ThreatBadge({ level }) {
  const tone = level === 'High' ? 'text-bad border-bad/40 bg-bad/10'
             : level === 'Medium' ? 'text-warn border-warn/40 bg-warn/10'
             : 'text-ok border-ok/40 bg-ok/10'
  return (
    <span className={`text-[10px] uppercase tracking-wider2 px-2 py-0.5 rounded border ${tone}`}>
      {level} threat
    </span>
  )
}

function CompetitorMetric({ label, value, source }) {
  return (
    <div className="border border-line rounded-card bg-elevated/40 p-3">
      <div className="text-[10px] uppercase tracking-wider2 text-muted">{label}</div>
      <div className="text-sm text-fg font-medium leading-tight mt-1">{value}</div>
      {source && <div className="text-[10px] text-dim mt-1.5 leading-snug">Source: {source}</div>}
    </div>
  )
}

function CompetitorCard({ c }) {
  const metrics = c.metrics || []
  // back-compat: support old { strength, weakness } shape if encountered
  const edge = c.edge || c.strength
  const gap = c.gap || c.weakness
  return (
    <div className="border border-line rounded-card bg-elevated/30 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm text-fg font-bold">{c.name}</div>
        <ThreatBadge level={c.threat} />
      </div>

      {metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {metrics.map((m, i) => <CompetitorMetric key={i} {...m} />)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider2 text-ok mb-1.5">Edge vs us</div>
          <div className="text-xs text-muted leading-relaxed">{edge}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider2 text-bad mb-1.5">Gap vs us</div>
          <div className="text-xs text-muted leading-relaxed">{gap}</div>
        </div>
      </div>
    </div>
  )
}

export function MarketSection({ bet }) {
  const m = bet.market || {}
  const competitors = m.competitors || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { k: 'tam', l: 'TAM' },
          { k: 'sam', l: 'SAM' },
          { k: 'som', l: 'SOM' }
        ].map(({ k, l }) => (
          <div key={k} className="border border-line rounded-card p-4 bg-elevated/40">
            <div className="text-[10px] uppercase tracking-wider2 text-muted">{l}</div>
            <div className="text-xl text-fg mt-1.5 font-bold leading-none">{m[k] || '—'}</div>
            <div className="text-[10px] text-dim mt-2 leading-snug">{m.sources?.[k] || ''}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider2 text-muted mb-3">Competitive landscape</div>
        {competitors.length === 0 ? (
          <div className="text-xs text-dim border border-line rounded-card p-4">No competitors logged.</div>
        ) : (
          <div className="space-y-3">
            {competitors.map((c, i) => <CompetitorCard key={i} c={c} />)}
          </div>
        )}
      </div>
    </div>
  )
}
