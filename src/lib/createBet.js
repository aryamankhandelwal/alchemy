// Pure factory for new bets created via the Add Bet form.
// AI co-pilot is expected to flesh out the rest after creation.

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'bet'
}

export function createBet({ name, description, stage, decision }) {
  const id = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`
  return {
    id,
    name: name.trim(),
    description: description.trim(),
    stage,
    decision,
    score: null,
    nullHypothesis: '',
    targetCustomer: '',
    aiSummary: '',
    market: {
      tam: '—',
      sam: '—',
      som: '—',
      sources: {},
      competitors: []
    },
    risks: [],
    kpis: {}
  }
}
