export const STAGES = ['Evaluation', 'Pilot', 'Scale']

export const DECISIONS = ['Prioritise', 'Proceed', 'Kill', 'Killed']

export const STAGE_DESCRIPTION = {
  Evaluation: 'Validate idea and initial viability.',
  Pilot: 'Test real-world behaviour in a test group.',
  Scale: 'Full rollout candidate.'
}

export const DECISION_DESCRIPTION = {
  Prioritise: 'Strong signals across dimensions — push capacity here.',
  Proceed: 'Mixed or incomplete signals — iterate and refine.',
  Kill: 'Does not meet thresholds — flagged for kill.',
  Killed: 'Archived. Discontinued with documented learnings.'
}

export const DECISION_TONE = {
  Prioritise: 'ok',
  Proceed: 'warn',
  Kill: 'bad',
  Killed: 'dim'
}

export const STAGE_TONE = {
  Evaluation: 'muted',
  Pilot: 'accent',
  Scale: 'ok'
}
