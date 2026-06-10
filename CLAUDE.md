# Alchemy

A Kanban-style portfolio dashboard for managing **new bets** — experimental product initiatives progressing through Astra Tech's stage-gated **New Horizons** evaluation system.

The app makes the New Horizons framework tangible: drag a bet across a 2D grid (stage × decision) to update its status, click in to inspect KPIs against per-stage thresholds from the executive memo, and use a natural-language AI co-pilot ("LTV/CAC is now 2.3x", "mark this as Prioritise") to update fields in place.

All bet data is hard-coded from the New Horizons memo. No persistence — refreshing resets to seed state. The app is a credible v0 demo of the operating model, not a production system.

---

## Keeping this doc current

**When you make a structural change to the codebase, update this file in the same PR.** Specifically, update CLAUDE.md whenever you:

- Add, remove, or rename a top-level file under `src/` or `server/`
- Add or remove a shadcn primitive in `src/components/ui/`
- Change the tech stack (deps, build tool, framework version)
- Change the theme tokens, path aliases, or tsconfig structure
- Change the AI patch contract (shape of `patch` / `reply` from `/api/chat`)
- Change the KPI schema (add/remove a KPI, change a threshold)
- Move something into or out of the "Out of scope" list

Sections most prone to drift: **Tech stack**, **File structure**, **KPI framework reference**. Verify these match reality before closing a task. If the change is purely a bug fix or a leaf-component tweak, no update needed.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Build tool | Vite 5 (React 18 + TypeScript) |
| UI primitives | [shadcn/ui](https://ui.shadcn.com) (new-york style) on Radix |
| Styling | Tailwind CSS 3 + `tailwindcss-animate`, HSL CSS-variable theme |
| Utilities | `class-variance-authority`, `clsx`, `tailwind-merge`, `cn()` helper |
| Icons | `lucide-react` |
| Drag & drop | `@dnd-kit/core` |
| Toasts | `sonner` (mounted at `App.tsx` root, called via `toast.success(...)`) |
| Font | Helvetica / Helvetica Neue (system) |
| LLM | Google Gemini via `@google/genai` (same provider for `/api/chat`, `/api/enrich`, and `/api/research`) |
| Schema | Zod for the AI's structured output |
| State | React `useState` in `App.tsx` (single `bets` array, no global store) |

Path alias: `@/*` → `src/*` (configured in `tsconfig.json` and `vite.config.ts`).

---

## Run

```bash
npm install
cp .env.example .env       # then fill in GEMINI_API_KEY (and MONGODB_URI)
npm run dev                # → http://localhost:5173
npm run build              # tsc -b && vite build
npm run typecheck          # tsc -b --noEmit
```

The AI chat works **only** if `GEMINI_API_KEY` is set. Without a key, the chat replies with a setup hint but the rest of the app (drag-and-drop, modals, KPI tracking, adding bets) works fully.

To switch models, set `GEMINI_MODEL` in `.env` to any Gemini slug (`gemini-2.5-flash`, `gemini-2.5-pro`, etc.). No code changes needed.

### If `npm run dev` won't start (agent sessions): use pyserver

On this machine, **Microsoft Defender for Endpoint blocks `node.exe` when spawned from an agent (Claude Code) process tree** — `npm`/`node`/`vite` fail with "Permission denied" / "Access is denied", including via `cmd`, batch files, or copies of node.exe. `npm run dev` works fine from a normal user terminal; it's only the agent session that's blocked. Don't burn time retrying node — fall back in this order:

1. `npm run dev` — try once; if node is blocked, move on.
2. `py server/pyserver.py` — **the standard agent fallback.** A no-node Python drop-in on the same port (:5173) that serves the prebuilt `dist/` SPA, reproduces every `/api/*` route (chat / enrich / research / bets CRUD via Gemini REST + MongoDB Atlas), and retries Gemini 429/500/503 with backoff. Run it in the background, then verify with `curl http://localhost:5173/api/bets`.
3. Ask the user to run `npm run dev` in their own terminal (not via `!` — that runs inside the blocked session).

**Rebuilding the frontend without node:** vite/tsc can't run, but the standalone esbuild binary is not blocked:

```bash
node_modules/@esbuild/win32-x64/esbuild.exe src/main.tsx --bundle --format=esm \
  --jsx=automatic --minify --define:process.env.NODE_ENV='"production"' \
  --alias:@=./src --loader:.svg=dataurl --outfile=dist/assets/index-<name>.js
```

Then point the `<script>` in `dist/index.html` at the new file and delete the emitted `.css` (it's un-processed Tailwind — keep the original built CSS). Caveat: esbuild doesn't run Tailwind, so any **new** utility class must be hand-appended to the existing `dist/assets/index-*.css` (e.g. `.hover\:text-destructive:hover{color:hsl(var(--destructive))}`). Source files stay correct, so the next real `npm run build` (run by the user) supersedes all of this.

---

## File structure

```
Alchemy/
├── CLAUDE.md                       this file
├── README.md
├── package.json
├── tsconfig.json                   single TS config (src + server + vite.config)
├── vite.config.ts                  registers /api/chat middleware + @ alias
├── tailwind.config.ts              shadcn HSL token theme + tailwindcss-animate
├── postcss.config.js
├── components.json                 shadcn CLI config (new-york, tsx, @ aliases)
├── index.html
├── .env.example
├── server/
│   ├── chat.ts                     /api/chat handler (Vercel AI SDK)
│   ├── score.ts                    /api/score/:id — AI re-scores a bet from its full state
│   └── pyserver.py                 no-node fallback server (see "Run" section)
└── src/
    ├── main.tsx                    bootstrap; force-adds `dark` class on <html>
    ├── App.tsx                     top-level state: bets, openBetId, addOpen
    ├── index.css                   Tailwind layers + :root / .dark token blocks
    ├── types/
    │   └── bet.ts                  Bet, Stage, Decision, KpiStatus, Patch, …
    ├── data/
    │   └── bets.ts                 hard-coded 6 bets from the memo
    ├── lib/
    │   ├── utils.ts                cn() — clsx + tailwind-merge
    │   ├── kpiSchema.ts            per-stage KPI defs + thresholds + evaluator
    │   ├── stages.ts               STAGES, DECISIONS, badge-variant tone maps
    │   ├── systemPrompt.ts         builds AI system prompt from memo + bet
    │   ├── applyPatch.ts           merges AI's JSON patch into a bet (immutable)
    │   ├── createBet.ts            factory for bets added via AddBetModal
    │   └── history.ts              diff a patch into Change[] + describe entries
    └── components/
        ├── Header.tsx              ⬡ Alchemy wordmark + Board/Timeline view toggle + "Add bet" button
        ├── SummaryBar.tsx          totals strip (total / prioritised / pilot / killed)
        ├── KanbanGrid.tsx          3-col × 4-row grid + DndContext + DragOverlay
        ├── TimelineView.tsx        Gantt view: per-bet stage bars on a 12-month axis with year nav (default 2026)
        ├── KanbanCell.tsx          one droppable cell
        ├── BetCard.tsx             draggable Card with badges + KPI dots + score
        ├── BetModal.tsx            Dialog + Tabs shell (Summary / Market / KPIs / Risk / Artifacts / Projections / History)
        ├── AddBetModal.tsx         Dialog form for new bets
        ├── ChatPanel.tsx           AI chat (right side of BetModal)
        ├── bet-badges.tsx          StageBadge, DecisionBadge, KPIDot, ScorePill, scoreTone
        ├── modal/                  tab content for BetModal
        │   ├── SummarySection.tsx
        │   ├── MarketSection.tsx
        │   ├── RiskSection.tsx
        │   ├── KPISection.tsx
        │   ├── ArtifactsSection.tsx  upload/list/open bet documents (Mongo `artifacts` collection, /api/bets/:id/artifacts)
        │   ├── ProjectionsSection.tsx
        │   └── HistorySection.tsx
        └── ui/                     shadcn primitives — DO NOT mix domain code here
            ├── badge.tsx
            ├── button.tsx
            ├── card.tsx
            ├── dialog.tsx
            ├── input.tsx
            ├── label.tsx
            ├── scroll-area.tsx
            ├── select.tsx
            ├── separator.tsx
            ├── slider.tsx
            ├── sonner.tsx
            ├── tabs.tsx
            ├── textarea.tsx
            └── tooltip.tsx
```

---

## Theme & styling conventions

- The app is **dark-only** in production. `main.tsx` adds `class="dark"` to `<html>` on boot; the `.dark` block in `index.css` defines all HSL CSS variables. The light `:root` block is a fallback only.
- **Use shadcn semantic tokens** (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `bg-popover`, `text-primary`, `text-muted-foreground`, `bg-destructive`, etc.) — not the original raw palette (`bg-bg`, `text-fg`, `text-accent`). The brand palette is preserved by mapping the originals onto HSL vars in `index.css`.
- Custom status tokens added on top of shadcn: `--success` (green), `--warning` (amber). Use `text-success` / `bg-warning` etc.
- Use `cn(...)` from `@/lib/utils` to combine class names (handles Tailwind conflicts via `tailwind-merge`).
- Component variants live in CVA blocks at the top of each primitive (`buttonVariants`, `badgeVariants`). Domain components (e.g. `StageBadge`) wrap the primitive with a fixed variant.

### Adding a new shadcn primitive

```bash
# (Requires the shadcn CLI; alternatively, copy from the docs and adjust the import paths to @/lib/utils.)
npx shadcn@latest add <component>
```

shadcn's CLI uses `components.json` to know the aliases, style, and TS preference. Generated files land in `src/components/ui/`. Don't put domain-specific components in `ui/` — that folder is reserved for shadcn primitives so future `shadcn diff` / upgrades stay clean.

---

## AI chat & the JSON patch system

The chat is the primary way to update a bet. Round-trip:

1. User types in `ChatPanel.tsx` — Enter sends, Shift+Enter newlines.
2. The frontend POSTs `{ messages, bet }` to `/api/chat`.
3. The server (`server/chat.ts`) calls Gemini (`@google/genai`) with `responseMimeType: 'application/json'` and validates the result with Zod:
   ```ts
   {
     patch: Record<string, unknown> | null,   // dot-paths → new values
     reply: string                             // 1–2 sentence confirmation
   }
   ```
   The patch shape is open-ended (any dot-path), so we instruct via system prompt rather than a rigid response schema.
4. The system prompt (`src/lib/systemPrompt.ts`) is assembled from:
   - The New Horizons framework primer (stages, decision logic).
   - The full per-stage KPI thresholds, programmatically rendered from `kpiSchema.ts` so they never drift from the source of truth.
   - The current bet, JSON-stringified.
   - Output contract + few-shot examples.
5. The frontend applies `patch` immutably via `applyPatch.ts` and re-renders. The KPI tracker, score, badges, card position, and history log all update in real time.

### Patch format (examples)

```ts
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

Every patch is diffed against the previous bet by `history.ts` and appended to `bet.history` as a `HistoryEntry`. Board drags are recorded the same way under source `'drag'`.

### Extending the AI

- **Different model**: change `GEMINI_MODEL` env var. No code changes.
- **Different provider**: swap `@google/genai` for another SDK (`@anthropic-ai/sdk`, `openai`, Vercel AI SDK, etc.) in `server/chat.ts` — the shape returned by `chatHandler` is what matters, the provider is an implementation detail. Same applies to `server/enrich.ts` and `server/research.ts`.
- **Richer patches**: extend the Zod schema in `server/chat.ts` and the applier in `src/lib/applyPatch.ts`. Add types in `src/types/bet.ts` if new fields appear.

---

## KPI framework reference

KPIs are defined per stage in `src/lib/kpiSchema.ts`. Each KPI has a label, format, threshold ranges, and an `evaluate(value)` function returning `'Kill' | 'Proceed' | 'Prioritise'`.

### Evaluation (validate market demand exists)
| KPI | Kill | Proceed | Prioritise |
| --- | --- | --- | --- |
| Demand Signal | <5% | 5-15% | >15% |
| Problem Severity | Low | Medium | High |
| Market Clarity | Unclear | Partial | Well-defined |
| Speed to MVP | >26 wk | 6-26 wk | ≤6 wk |

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

The card-level health dots show the first three KPIs of the bet's current stage, color-coded green / amber / red via `KPIDot` in `bet-badges.tsx`.

---

## Extending the system

### Add a new bet (programmatically)

Append to `src/data/bets.ts` (the `Bet` type from `@/types/bet` is enforced by the compiler):

```ts
{
  id: 'kebab-case-id',
  name: 'Display Name',
  description: 'One-liner.',
  stage: 'Evaluation',          // or 'Pilot' / 'Scale'
  decision: 'Proceed',          // or 'Prioritise' / 'Kill' / 'Killed'
  score: 50,                    // or null
  nullHypothesis: '…',
  targetCustomer: '…',
  aiSummary: '…',
  market: { tam, sam, som, sources, competitors: [] },
  risks: [{ name, category, severity, mitigation }],
  kpis: { /* keys from KPI_SCHEMA[stage] */ }
}
```

The card lands in the grid cell matching its `stage` × `decision`.

### Add a bet via the UI

Click **Add bet** in the header → `AddBetModal` (Dialog with Input / Textarea / Select). `createBet()` in `src/lib/createBet.ts` produces the skeleton; the AI co-pilot is expected to flesh out market sizing, risks, and KPIs after creation.

### Modify the KPI schema

`src/lib/kpiSchema.ts` is the single source of truth — adding or changing a KPI updates:
- The KPI tracker rows in the modal
- The card health dots
- The thresholds the AI references in its system prompt

To add a KPI:

```ts
Pilot: {
  // …existing
  newMetric: {
    label: 'New Metric',
    rationale: 'Why this matters.',
    format: 'pct',                                              // or 'x' / 'months' / 'weeks' / 'enum'
    formatValue: pct,
    evaluate: (v) => Number(v) < 0.1 ? 'Kill' : Number(v) < 0.3 ? 'Proceed' : 'Prioritise',
    thresholds: '<10% kill · 10-30% proceed · >30% prioritise'  // shown in tooltip and AI prompt
  }
}
```

Then add the corresponding `kpis.newMetric` value on each Pilot bet in `bets.ts`.

---

## Out of scope (v0)

- Persistence — state is in memory; refreshing the page resets to seeded data.
- Authentication / multi-user / real-time sync.
- Score evolution over time / charts.
- Light mode (theme tokens exist but the app forces `.dark` on boot).
- Tests.
