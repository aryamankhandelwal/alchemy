export function scoreTone(score) {
  if (score == null) return 'text-dim'
  if (score >= 65) return 'text-ok'
  if (score >= 40) return 'text-warn'
  return 'text-bad'
}

export function ScorePill({ score }) {
  const hasScore = score != null
  return (
    <div className="text-right shrink-0">
      <div className="text-[9px] uppercase tracking-wider2 text-muted leading-none">Score</div>
      <div className={`text-2xl font-bold leading-none mt-1.5 ${scoreTone(score)}`}>
        {hasScore ? score : '—'}
      </div>
    </div>
  )
}
