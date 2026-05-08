import { useMemo, useState } from 'react'

const AED = (n) => {
  if (!isFinite(n)) return '—'
  if (Math.abs(n) >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `AED ${(n / 1_000).toFixed(1)}k`
  return `AED ${Math.round(n).toLocaleString()}`
}

const PCT = (n) => `${(n * 100).toFixed(1)}%`

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider2 text-muted">{label}</span>
        <span className="text-xs text-fg font-medium">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  )
}

function Stat({ label, value, tone = 'text-fg' }) {
  return (
    <div className="border border-line rounded-card bg-elevated/40 p-3">
      <div className="text-[10px] uppercase tracking-wider2 text-muted">{label}</div>
      <div className={`text-base font-bold leading-tight mt-1 ${tone}`}>{value}</div>
    </div>
  )
}

function defaultsFor(bet) {
  const k = bet.kpis || {}
  const conv = typeof k.conversionRate === 'number' ? k.conversionRate : 0.08
  const ltvCac = typeof k.ltvCac === 'number' ? k.ltvCac : null
  const cac = 120
  const arpu = ltvCac ? Math.max(20, (ltvCac * cac) / 12) : 60
  return {
    startUsers: 5000,
    growth: 0.18,
    conv,
    arpu: Math.round(arpu),
    cac,
    margin: 0.55
  }
}

function project({ startUsers, growth, conv, arpu, cac, margin }) {
  const months = []
  let users = startUsers
  let cumRev = 0
  let cumContrib = 0
  let cumCac = 0
  let payback = null
  for (let m = 1; m <= 12; m++) {
    const newUsers = m === 1 ? users : Math.round(users * growth)
    if (m > 1) users = users + newUsers
    const converted = users * conv
    const revenue = converted * arpu
    const acqSpend = newUsers * cac
    const contribution = revenue * margin - acqSpend
    cumRev += revenue
    cumContrib += contribution
    cumCac += acqSpend
    if (payback == null && cumContrib >= 0 && m > 1) payback = m
    months.push({ m, users, revenue, contribution, cumContrib })
  }
  return { months, cumRev, cumContrib, cumCac, endingUsers: users, payback }
}

export function ProjectionsSection({ bet }) {
  const [params, setParams] = useState(() => defaultsFor(bet))
  const set = (k) => (v) => setParams((p) => ({ ...p, [k]: v }))
  const reset = () => setParams(defaultsFor(bet))

  const result = useMemo(() => project(params), [params])
  const maxRev = Math.max(...result.months.map((m) => m.revenue), 1)

  const ltvCac = params.cac > 0
    ? (params.arpu * params.margin * 12) / params.cac
    : 0

  return (
    <div className="space-y-5">
      <div className="text-[11px] text-muted leading-relaxed">
        Adjust assumptions to model 12 months of revenue and contribution. Defaults are seeded from this bet's KPIs where available — changes here are local to the simulator and do not modify the bet.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4 border border-line rounded-card p-4 bg-elevated/30">
          <Slider label="Starting users" value={params.startUsers} min={500} max={50000} step={500}
                  onChange={set('startUsers')} format={(v) => v.toLocaleString()} />
          <Slider label="Monthly growth" value={params.growth} min={0} max={0.6} step={0.01}
                  onChange={set('growth')} format={PCT} />
          <Slider label="Conversion rate" value={params.conv} min={0} max={0.5} step={0.005}
                  onChange={set('conv')} format={PCT} />
          <Slider label="ARPU / month" value={params.arpu} min={5} max={500} step={5}
                  onChange={set('arpu')} format={AED} />
          <Slider label="CAC" value={params.cac} min={10} max={600} step={5}
                  onChange={set('cac')} format={AED} />
          <Slider label="Gross margin" value={params.margin} min={0.1} max={0.9} step={0.01}
                  onChange={set('margin')} format={PCT} />
          <button
            type="button"
            onClick={reset}
            className="text-[10px] uppercase tracking-wider2 text-muted hover:text-accent transition-colors"
          >
            Reset to defaults
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Year-1 revenue" value={AED(result.cumRev)} tone="text-ok" />
            <Stat
              label="Year-1 contribution"
              value={AED(result.cumContrib)}
              tone={result.cumContrib >= 0 ? 'text-ok' : 'text-bad'}
            />
            <Stat label="Ending users" value={result.endingUsers.toLocaleString()} />
            <Stat
              label="Payback"
              value={result.payback ? `${result.payback} mo` : '> 12 mo'}
              tone={result.payback && result.payback <= 9 ? 'text-ok' : result.payback ? 'text-warn' : 'text-bad'}
            />
            <Stat
              label="Implied LTV / CAC"
              value={`${ltvCac.toFixed(2)}×`}
              tone={ltvCac >= 2 ? 'text-ok' : ltvCac >= 1 ? 'text-warn' : 'text-bad'}
            />
            <Stat label="Total CAC spend" value={AED(result.cumCac)} />
          </div>

          <div className="border border-line rounded-card p-4 bg-elevated/30">
            <div className="text-[10px] uppercase tracking-wider2 text-muted mb-3">Monthly revenue</div>
            <div className="flex items-end gap-1 h-24">
              {result.months.map((m) => (
                <div
                  key={m.m}
                  className="flex-1 bg-accent/70 hover:bg-accent transition-colors rounded-sm"
                  style={{ height: `${Math.max(4, (m.revenue / maxRev) * 100)}%` }}
                  title={`M${m.m}: ${AED(m.revenue)}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-dim mt-2">
              <span>M1</span><span>M6</span><span>M12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
