import type { KpiStatus, KpiValue, Stage } from '@/types/bet'

export interface KpiDefinition {
  label: string
  rationale: string
  format: 'pct' | 'x' | 'months' | 'weeks' | 'enum'
  enumOrder?: string[]
  formatValue: (value: KpiValue) => string
  thresholds: string
  evaluate: (value: KpiValue) => KpiStatus
}

const pct = (v: KpiValue) => `${Math.round(Number(v) * 100)}%`
const x = (v: KpiValue) => `${Number(v).toFixed(1)}x`
const months = (v: KpiValue) => `${v} months`
const weeks = (v: KpiValue) => `${v} weeks`

const enumEval =
  (map: Record<string, KpiStatus>) =>
  (v: KpiValue): KpiStatus =>
    map[String(v)] ?? 'Proceed'

export const KPI_SCHEMA: Record<Stage, Record<string, KpiDefinition>> = {
  Evaluation: {
    demandSignal: {
      label: 'Demand Signal',
      rationale: 'Early user intent.',
      format: 'pct',
      formatValue: pct,
      thresholds: '<5% kill · 5–15% proceed · >15% prioritise',
      evaluate: (v) => (Number(v) < 0.05 ? 'Kill' : Number(v) < 0.15 ? 'Proceed' : 'Prioritise')
    },
    problemSeverity: {
      label: 'Problem Severity',
      rationale: 'Urgency of the problem.',
      format: 'enum',
      enumOrder: ['Low', 'Medium', 'High'],
      formatValue: (v) => String(v),
      thresholds: 'Low kill · Medium proceed · High prioritise',
      evaluate: enumEval({ Low: 'Kill', Medium: 'Proceed', High: 'Prioritise' })
    },
    marketClarity: {
      label: 'Market Clarity',
      rationale: 'Definition of target segment.',
      format: 'enum',
      enumOrder: ['Unclear', 'Partial', 'Well-defined'],
      formatValue: (v) => String(v),
      thresholds: 'Unclear kill · Partial proceed · Well-defined prioritise',
      evaluate: enumEval({ Unclear: 'Kill', Partial: 'Proceed', 'Well-defined': 'Prioritise' })
    },
    speedToMvp: {
      label: 'Speed to MVP',
      rationale: 'Time to first usable version.',
      format: 'weeks',
      formatValue: weeks,
      thresholds: '>26 wk kill · 6–26 wk proceed · ≤6 wk prioritise',
      evaluate: (v) => (Number(v) > 26 ? 'Kill' : Number(v) > 6 ? 'Proceed' : 'Prioritise')
    }
  },

  Pilot: {
    activationRate: {
      label: 'Activation Rate',
      rationale: '% of users completing core action.',
      format: 'pct',
      formatValue: pct,
      thresholds: '<20% kill · 20–40% proceed · >40% prioritise',
      evaluate: (v) => (Number(v) < 0.2 ? 'Kill' : Number(v) < 0.4 ? 'Proceed' : 'Prioritise')
    },
    conversionRate: {
      label: 'Conversion Rate',
      rationale: 'Users turning active / paying.',
      format: 'pct',
      formatValue: pct,
      thresholds: '<5% kill · 5–15% proceed · >15% prioritise',
      evaluate: (v) => (Number(v) < 0.05 ? 'Kill' : Number(v) < 0.15 ? 'Proceed' : 'Prioritise')
    },
    retentionD30: {
      label: 'Retention (D30)',
      rationale: 'Repeat usage behaviour.',
      format: 'pct',
      formatValue: pct,
      thresholds: '<20% kill · 20–40% proceed · >40% prioritise',
      evaluate: (v) => (Number(v) < 0.2 ? 'Kill' : Number(v) < 0.4 ? 'Proceed' : 'Prioritise')
    },
    ltvCac: {
      label: 'LTV / CAC',
      rationale: 'Unit economics signal.',
      format: 'x',
      formatValue: x,
      thresholds: '<1.0× kill · 1.0–2.0× proceed · >2.0× prioritise',
      evaluate: (v) => (Number(v) < 1.0 ? 'Kill' : Number(v) < 2.0 ? 'Proceed' : 'Prioritise')
    },
    riskSignals: {
      label: 'Risk Signals',
      rationale: 'Fraud / compliance / loss behaviour.',
      format: 'enum',
      enumOrder: ['High', 'Moderate', 'Low'],
      formatValue: (v) => String(v),
      thresholds: 'High kill · Moderate proceed · Low prioritise',
      evaluate: enumEval({ High: 'Kill', Moderate: 'Proceed', Low: 'Prioritise' })
    },
    operationalLoad: {
      label: 'Operational Load',
      rationale: 'Scalability of service.',
      format: 'enum',
      enumOrder: ['High', 'Medium', 'Low'],
      formatValue: (v) => String(v),
      thresholds: 'High kill · Medium proceed · Low prioritise',
      evaluate: enumEval({ High: 'Kill', Medium: 'Proceed', Low: 'Prioritise' })
    }
  },

  Scale: {
    ltvCac: {
      label: 'LTV / CAC',
      rationale: 'Long-term unit economics.',
      format: 'x',
      formatValue: x,
      thresholds: '<1.5× kill · 1.5–2.5× proceed · >2.5× prioritise',
      evaluate: (v) => (Number(v) < 1.5 ? 'Kill' : Number(v) < 2.5 ? 'Proceed' : 'Prioritise')
    },
    contributionMargin: {
      label: 'Contribution Margin',
      rationale: 'Profitability per unit.',
      format: 'enum',
      enumOrder: ['Negative', 'Approaching breakeven', 'Positive + improving'],
      formatValue: (v) => String(v),
      thresholds:
        'Negative kill · Approaching breakeven proceed · Positive + improving prioritise',
      evaluate: enumEval({
        Negative: 'Kill',
        'Approaching breakeven': 'Proceed',
        'Positive + improving': 'Prioritise'
      })
    },
    paybackMonths: {
      label: 'Payback Period',
      rationale: 'Capital recovery speed.',
      format: 'months',
      formatValue: months,
      thresholds: '>18 mo kill · 9–18 mo proceed · <9 mo prioritise',
      evaluate: (v) => (Number(v) > 18 ? 'Kill' : Number(v) > 9 ? 'Proceed' : 'Prioritise')
    },
    riskScalability: {
      label: 'Risk Scalability',
      rationale: 'Loss consistency.',
      format: 'enum',
      enumOrder: ['Unstable', 'Stabilising', 'Predictable'],
      formatValue: (v) => String(v),
      thresholds: 'Unstable kill · Stabilising proceed · Predictable prioritise',
      evaluate: enumEval({ Unstable: 'Kill', Stabilising: 'Proceed', Predictable: 'Prioritise' })
    },
    regulatoryReadiness: {
      label: 'Regulatory Readiness',
      rationale: 'Compliance approval status.',
      format: 'enum',
      enumOrder: ['Blocked', 'Partial', 'Fully approved'],
      formatValue: (v) => String(v),
      thresholds: 'Blocked kill · Partial proceed · Fully approved prioritise',
      evaluate: enumEval({ Blocked: 'Kill', Partial: 'Proceed', 'Fully approved': 'Prioritise' })
    },
    operationalScalability: {
      label: 'Operational Scalability',
      rationale: 'System load handling.',
      format: 'enum',
      enumOrder: ['Breaks', 'Needs optimisation', 'Scales cleanly'],
      formatValue: (v) => String(v),
      thresholds: 'Breaks kill · Needs optimisation proceed · Scales cleanly prioritise',
      evaluate: enumEval({
        Breaks: 'Kill',
        'Needs optimisation': 'Proceed',
        'Scales cleanly': 'Prioritise'
      })
    },
    strategicFit: {
      label: 'Strategic Fit',
      rationale: 'Alignment with core products.',
      format: 'enum',
      enumOrder: ['Weak', 'Adjacent', 'Strong'],
      formatValue: (v) => String(v),
      thresholds: 'Weak kill · Adjacent proceed · Strong prioritise',
      evaluate: enumEval({ Weak: 'Kill', Adjacent: 'Proceed', Strong: 'Prioritise' })
    }
  }
}

export function getKpiDefs(stage: Stage): Record<string, KpiDefinition> {
  return KPI_SCHEMA[stage] ?? {}
}

export function evaluateKpi(stage: Stage, key: string, value: KpiValue | undefined): KpiStatus | null {
  const def = KPI_SCHEMA[stage]?.[key]
  if (!def || value === undefined || value === null) return null
  return def.evaluate(value)
}

export function formatKpiValue(stage: Stage, key: string, value: KpiValue | undefined): string {
  const def = KPI_SCHEMA[stage]?.[key]
  if (!def || value === undefined || value === null) return '—'
  return def.formatValue(value)
}
