export function ScorePill({ score }) {
  return (
    <div className="text-right shrink-0">
      <div className="text-[9px] uppercase tracking-wider2 text-muted leading-none">Score</div>
      <div className="text-2xl font-bold text-accent leading-none mt-1.5">{score}</div>
    </div>
  )
}
