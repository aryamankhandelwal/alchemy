import { STAGE_TONE, DECISION_TONE } from '../../lib/stages.js'

const TONE_CLASS = {
  ok:     'border-ok/30     text-ok     bg-ok/5',
  warn:   'border-warn/30   text-warn   bg-warn/5',
  bad:    'border-bad/30    text-bad    bg-bad/5',
  accent: 'border-accent/30 text-accent bg-accent/5',
  muted:  'border-line      text-muted  bg-elevated',
  dim:    'border-line      text-dim    bg-bg'
}

export function Badge({ children, tone = 'muted' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider2 border rounded-sm ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  )
}

export function StageBadge({ stage }) {
  return <Badge tone={STAGE_TONE[stage] ?? 'muted'}>{stage}</Badge>
}

export function DecisionBadge({ decision }) {
  return <Badge tone={DECISION_TONE[decision] ?? 'muted'}>{decision}</Badge>
}
