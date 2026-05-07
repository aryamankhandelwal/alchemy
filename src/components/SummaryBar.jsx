function Stat({ label, value, accent = false }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider2 text-muted">{label}</div>
      <div className={`text-2xl mt-1.5 leading-none ${accent ? 'text-accent' : 'text-fg'}`}>{value}</div>
    </div>
  )
}

export function SummaryBar({ bets }) {
  const total = bets.length
  const prioritised = bets.filter(b => b.decision === 'Prioritise').length
  const inPilot = bets.filter(b => b.stage === 'Pilot').length
  const killed = bets.filter(b => b.decision === 'Kill' || b.decision === 'Killed').length

  return (
    <div className="grid grid-cols-4 gap-8 px-8 py-5 border-b border-line">
      <Stat label="Total bets" value={total} accent />
      <Stat label="Prioritised" value={prioritised} />
      <Stat label="In Pilot" value={inPilot} />
      <Stat label="Killed" value={killed} />
    </div>
  )
}
