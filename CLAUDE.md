# Alchemy

A Kanban-style portfolio dashboard for managing **new bets** — experimental product initiatives progressing through Astra Tech's stage-gated **New Horizons** evaluation system.

The app makes the New Horizons framework tangible: drag a bet across a 2D grid (stage × decision) to update its status, click in to inspect KPIs against per-stage thresholds from the executive memo, and use a natural-language AI co-pilot ("LTV/CAC is now 2.3x", "mark this as Prioritise") to update fields in place.

All bet data is hard-coded from the New Horizons memo. No persistence — refreshing resets to seed state. The app is a credible v0 demo of the operating model, not a production system.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Build tool | Vite (React + JS) |
| UI | React 18, Tailwind CSS 3, Lucide icons |
| Drag & drop | `@dnd-kit/core` |
| Font | Fira Mono (Google Fonts) |
| LLM | Vercel AI SDK (`ai`) + `@openrouter/ai-sdk-provider` |
| Schema | Zod for the AI's structured output |
| State | React `useState` in `App.jsx` (single bets array) |

---

## Run

```bash
npm install
cp .env.example .env       # then fill in OPENROUTER_API_KEY
npm run dev
```

Open http://localhost:5173.

The AI chat works **only** if `OPENROUTER_API_KEY` is set. Without a key, the chat replies with a setup hint but the rest of the app (drag-and-drop, modals, KPI tracking) works fully.

To switch models, set `OPENROUTER_MODEL` in `.env` to any OpenRouter slug (`anthropic/claude-sonnet-4.5`, `openai/gpt-4o`, `google/gemini-2.5-flash`, etc.). No code changes needed.

---

## File structure

```
Alchemy/
├── CLAUDE.md                       this file
├── README.md
├── package.json
├── vite.config.js                  registers /api/chat middleware
├── tailwind.config.js              custom palette + Fira Mono
├── postcss.config.js
├── index.html
├── .env.example
├── server/
│   └── chat.js                     /api/chat handler (Vercel AI SDK)
└── src/
    ├── main.jsx
    ├── App.jsx                     top-level state: bets, openBetId, toast
    ├── index.css                   Tailwind layers + Fira Mono import
    ├── data/
    │   └── bets.js                 hard-coded 6 bets from the memo
    ├── lib/
    │   ├── kpiSchema.js            per-stage KPI defs + thresholds + evaluator
    │   ├── stages.js               STAGES, DECISIONS constants
    │   ├── systemPrompt.js         builds AI system prompt from memo + bet
    │   └── applyPatch.js           merges AI's JSON patch into a bet
    └── components/
        ├── Header.jsx              ⬡ Alchemy wordmark + "New Horizons · Astra Tech"
        ├── SummaryBar.jsx          totals strip
        ├── KanbanGrid.jsx          3-col × 4-row grid + DndContext
        ├── KanbanCell.jsx          one droppable cell
        ├── BetCard.jsx             draggable collapsed card
        ├── BetModal.jsx            two-panel modal shell
        ├── ChatPanel.jsx           AI chat (right side of modal)
        ├── Toast.jsx
        ├── modal/                  left-panel sections
        │   ├── CollapsibleSection.jsx
        │   ├── OverviewSection.jsx
        │   ├── AISummarySection.jsx
        │   ├── MarketSection.jsx
        │   ├── RiskSection.jsx
        │   └── KPISection.jsx
        └── ui/
            ├── Badge.jsx
            ├── KPIDot.jsx
            └── ScorePill.jsx
```

---

## AI chat & the JSON patch system

The chat is the primary way to update a bet. Round-trip:

1. User types in `ChatPanel.jsx` — Enter sends, Shift+Enter newlines.
2. The frontend POSTs `{ messages, bet }` to `/api/chat`.
3. The server (`server/chat.js`) calls `generateObject` from the Vercel AI SDK with a Zod schema:
   ```ts
   {
     patch: Record<string, any> | null,   // dot-paths → new values
     reply: string                         // 1–2 sentence confirmation
   }
   ```
4. The system prompt (`src/lib/systemPrompt.js`) is assembled from:
   - The New Horizons framework primer (stages, decision logic).
   - The full per-stage KPI thresholds, programmatically rendered from `kpiSchema.js` so they never drift from the source of truth.
   - The current bet, JSON-stringified.
   - Output contract + few-shot examples.
5. The frontend applies `patch` immutably via `applyPatch.js` and re-renders. The KPI tracker, score, badges, and card position all update in real time.

### Patch format (examples)

```js
// Update a KPI value
{ "kpis.ltvCac": 2.3 }

// Change decision (also moves the card on the grid)
{ "decision": "Prioritise" }

// Add a risk
{ "risks.add": { "name": "CBUAE EWA guidance",
                 "category": "Regulatory",
                 "severity": "High",
                 "mitigation": "Pause employer rollout pending circular." } }

// Update a competitor's threat level
{ "market.competitors[0].threat": "High" }

// Pure question (no update)
null
```

Dot-paths follow standard JS access: `a.b`, `a[0].b`, plus the special key `<array>.add` to push.

### Extending the AI

- **Different model**: change `OPENROUTER_MODEL` env var. No code changes.
- **Different provider**: swap `@openrouter/ai-sdk-provider` for `@ai-sdk/anthropic`, `@ai-sdk/openai`, etc. — Vercel AI SDK is provider-agnostic. Update `server/chat.js` (4 lines).
- **Richer patches**: extend the schema in `server/chat.js` and the applier in `src/lib/applyPatch.js`.

---

## KPI framework reference

KPIs are defined per stage in `src/lib/kpiSchema.js`. Each KPI has a label, format, threshold ranges, and an `evaluate(value)` function returning `'Kill' | 'Proceed' | 'Prioritise'`.

### Evaluation (validate market demand exists)
| KPI | Kill | Proceed | Prioritise |
| --- | --- | --- | --- |
| Demand Signal | <5% | 5-15% | >15% |
| Problem Severity | Low | Medium | High |
| Market Clarity | Unclear | Partial | Well-defined |
| Speed to MVP | >6 mo | 1-3 mo | <6 wk |

### Pilot (validate behaviour + early economics)
| KPI | Kill | Proceed | Prioritise |
| --- | --- | --- | --- |
| Activation Rate | <20% | 20-40% | >40% |
| Conversion Rate | <5% | 5-15% | >15% |
| Retention (D30) | <20% | 20-40% | >40% |
| LTV / CAC | <1.0× | 1.0-2.0× | >2.0× |
| Risk Signals | High | Moderate | Low |
| Operational Load | High | Medium | Low |

### Scale (confirm scalable, profitable, low-risk)
| KPI | Kill | Proceed | Prioritise |
| --- | --- | --- | --- |
| LTV / CAC | <1.5× | 1.5-2.5× | >2.5× |
| Contribution Margin | Negative | Approaching breakeven | Positive + improving |
| Payback Period | >18 mo | 9-18 mo | <9 mo |
| Risk Scalability | Unstable | Stabilising | Predictable |
| Regulatory Readiness | Blocked | Partial | Fully approved |
| Operational Scalability | Breaks | Needs optimisation | Scales cleanly |
| Strategic Fit | Weak | Adjacent | Strong |

The card-level health dots show the first three KPIs of the bet's current stage, color-coded green / amber / red.

---

## Extending the system

### Add a new bet

Append to `src/data/bets.js`:

```js
{
  id: 'kebab-case-id',
  name: 'Display Name',
  description: 'One-liner.',
  stage: 'Evaluation',          // or 'Pilot' / 'Scale'
  decision: 'Proceed',          // or 'Prioritise' / 'Kill' / 'Killed'
  score: 50,
  nullHypothesis: '…',
  targetCustomer: '…',
  aiSummary: '…',
  market: { tam, sam, som, sources, competitors: [] },
  risks: [{ name, category, severity, mitigation }],
  kpis: { /* keys from KPI_SCHEMA[stage] */ }
}
```

The card lands in the grid cell matching its `stage` × `decision`.

### Modify the KPI schema

`src/lib/kpiSchema.js` is the single source of truth — adding or changing a KPI updates:
- The KPI tracker rows in the modal
- The card health dots
- The thresholds the AI references in its system prompt

To add a KPI:

```js
Pilot: {
  // …existing
  newMetric: {
    label: 'New Metric',
    format: 'pct',                                              // or 'x' / 'months' / 'weeks' / 'enum'
    evaluate: v => v < 0.1 ? 'Kill' : v < 0.3 ? 'Proceed' : 'Prioritise',
    thresholds: '<10% kill · 10-30% proceed · >30% prioritise'  // shown in tooltip and AI prompt
  }
}
```

Then add the corresponding `kpis.newMetric` value on each Pilot bet in `bets.js`.

---

## Out of scope (v0)

- Persistence — state is in memory; refreshing the page resets to seeded data.
- Authentication.
- Adding bets via UI (extend by editing `bets.js`).
- Multi-user / real-time sync.
- Score evolution over time / charts.
- Tests.
