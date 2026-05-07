function ThreatLabel({ level }) {
  const c = level === 'High' ? 'text-bad' : level === 'Medium' ? 'text-warn' : 'text-ok'
  return <span className={`text-xs ${c}`}>{level}</span>
}

export function MarketSection({ bet }) {
  const m = bet.market || {}
  const competitors = m.competitors || []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { k: 'tam', l: 'TAM' },
          { k: 'sam', l: 'SAM' },
          { k: 'som', l: 'SOM' }
        ].map(({ k, l }) => (
          <div key={k} className="border border-line rounded-card p-4 bg-elevated/40">
            <div className="text-[10px] uppercase tracking-wider2 text-muted">{l}</div>
            <div className="text-xl text-accent mt-1.5 font-bold leading-none">{m[k] || '—'}</div>
            <div className="text-[10px] text-dim mt-2 leading-snug">{m.sources?.[k] || ''}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider2 text-muted mb-3">Competitive landscape</div>
        <div className="border border-line rounded-card overflow-hidden">
          <div className="grid grid-cols-[1.2fr_2fr_2fr_0.8fr] gap-3 text-[10px] uppercase tracking-wider2 text-muted bg-elevated/50 px-4 py-2.5 border-b border-line">
            <div>Competitor</div>
            <div>Strength</div>
            <div>Weakness</div>
            <div>Threat</div>
          </div>
          {competitors.map((c, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1.2fr_2fr_2fr_0.8fr] gap-3 px-4 py-3 text-xs items-center
                          ${i < competitors.length - 1 ? 'border-b border-divider' : ''}`}
            >
              <div className="text-fg">{c.name}</div>
              <div className="text-muted">{c.strength}</div>
              <div className="text-muted">{c.weakness}</div>
              <div><ThreatLabel level={c.threat} /></div>
            </div>
          ))}
          {competitors.length === 0 && (
            <div className="px-4 py-3 text-xs text-dim">No competitors logged.</div>
          )}
        </div>
      </div>
    </div>
  )
}
