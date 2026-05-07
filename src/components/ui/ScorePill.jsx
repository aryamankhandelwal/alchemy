export function ScorePill({ score }) {
  const hasScore = score != null
  return (
    <div className="text-right shrink-0">
      <div className="text-[9px] uppercase tracking-wider2 text-muted leading-none">Score</div>
      <div className={`text-2xl font-bold leading-none mt-1.5 ${hasScore ? 'text-accent' : 'text-dim'}`}>
        {hasScore ? score : '—'}
      </div>
    </div>
  )
}
