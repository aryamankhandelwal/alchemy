// Seed data inserted by server/seed.ts the first time the bets collection is
// empty. Only one bet — SME Insurance — to keep the iteration loop tight while
// we build out the research agent. Other bets from the New Horizons memo can
// be added back later.

import type { Bet } from '@/types/bet'

export const SEED_BETS: Bet[] = [
  {
    id: 'sme-insurance',
    name: 'SME Insurance',
    description:
      'Embedded insurance product targeting SME owners via the Astra app. Commission-based model via insurer partnerships.',
    stage: 'Pilot',
    decision: 'Prioritise',
    score: 74,
    nullHypothesis:
      'SME owners using the Astra app will not attach insurance products at conversion rates that justify the integration and licensing cost.',
    targetCustomer:
      'SME owners (1–50 employees) already on the Astra app for banking or lending; UAE-based, primarily trading and services sectors.',
    aiSummary:
      'SME Insurance is in Pilot with strong demand validation — 38% activation and 12% conversion. LTV/CAC of 1.8x sits just below the >2.0x prioritise threshold for Pilot, driven by current acquisition mix. Top watch items: insurance licensing complexity (mitigated via partner broker) and operational dependency on partner claims flow. Recommendation: continue pilot, push CAC down via embedded distribution before the Scale gate.',
    market: {
      tam: '$4.2B',
      sam: '$800M',
      som: '$45M',
      sources: {
        tam: 'World Bank UAE SME report, 2024',
        sam: 'Astra-addressable SME segmentation, internal',
        som: 'Year-1 attainable, internal model'
      },
      competitors: [
        {
          name: 'Bayzat',
          metrics: [
            { label: 'Revenue', value: '~$25M ARR', source: 'TechCrunch, 2024' },
            { label: 'SME customers', value: '5,000+', source: 'Bayzat investor deck, 2024' },
            { label: 'Profitability', value: 'Loss-making (Series C)', source: 'Wamda, 2024' }
          ],
          edge:
            'Owns the SME HR/payroll surface — has the employee data and trust at the policy-attach moment that we lack.',
          gap:
            'No consumer banking app; cannot ride Astra-style onboarding or lending flows to reach owners at the moment of need.',
          threat: 'Medium'
        },
        {
          name: 'Sukoon',
          metrics: [
            { label: 'Gross written premium', value: 'AED 4.0B (FY23)', source: 'Sukoon FY23 results' },
            { label: 'Net profit', value: 'AED 282M (FY23)', source: 'Sukoon FY23 results' },
            { label: 'Digital new policies', value: '<10%', source: 'S&P MENA insurance review, 2024' }
          ],
          edge:
            'Capital, underwriting depth, and CBUAE/IA standing we will always need to partner with, not replace.',
          gap:
            'Slow digital onboarding and no embedded distribution — they need partners like Astra to reach SMEs in-app, not vice versa.',
          threat: 'Low'
        },
        {
          name: 'Yallacompare',
          metrics: [
            { label: 'Funding', value: '$8M Series B', source: 'Crunchbase' },
            { label: 'Monthly visits', value: '~1.2M', source: 'SimilarWeb, Q1 2025' },
            { label: 'Insurer partners', value: '30+', source: 'Yallacompare site' }
          ],
          edge: 'Brand recall on consumer insurance search — captures top-of-funnel intent we do not.',
          gap:
            'Aggregator only — no transactional surface or post-sale relationship; loses every customer they refer.',
          threat: 'Low'
        }
      ]
    },
    risks: [
      {
        name: 'Insurance licensing',
        category: 'Regulatory',
        severity: 'Medium',
        mitigation: 'Partner with licensed insurer under broker agreement; CBUAE/IA file pre-cleared.'
      },
      {
        name: 'Claims flow dependency',
        category: 'Operational',
        severity: 'Medium',
        mitigation: 'Insurer SLA + monitored claims dashboard; weekly ops review.'
      }
    ],
    kpis: {
      activationRate: 0.38,
      conversionRate: 0.12,
      retentionD30: 0.35,
      ltvCac: 1.8,
      riskSignals: 'Moderate',
      operationalLoad: 'Medium'
    }
  }
]
