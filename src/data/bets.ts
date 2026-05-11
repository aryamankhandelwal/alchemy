// Hard-coded bet data for the New Horizons demo.
// Sourced from the New Horizons Memo v1 (Astra Tech, 2026).

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
  },

  {
    id: 'ewa',
    name: 'Earned Wage Access',
    description:
      'Allow users to access earned wages before payday via employer payroll integrations.',
    stage: 'Evaluation',
    decision: 'Proceed',
    score: 58,
    nullHypothesis:
      'Salaried users will not adopt earned-wage access at rates that justify the cost of integrating with employer payroll systems.',
    targetCustomer:
      'Mid-income salaried employees (AED 4–15k/month) at SMEs without payroll flexibility; 25–45 age range; UAE-based.',
    aiSummary:
      'EWA shows promising early demand at 9% and a clear problem statement. Regulatory classification of wage advances under UAE labour law and CBUAE rules is the gating constraint. Speed-to-MVP at 8 weeks is within the proceed band. Recommendation: Proceed with employer integration interviews and a regulatory readiness sprint before pilot.',
    market: {
      tam: '$12B',
      sam: '$1.1B',
      som: '$60M',
      sources: {
        tam: 'McKinsey MENA payroll report, 2024',
        sam: 'UAE addressable employed segment, internal',
        som: 'Year-1 attainable, internal model'
      },
      competitors: [
        {
          name: 'NymCard',
          metrics: [
            { label: 'Revenue', value: '~$15M ARR', source: 'MEED, 2024' },
            { label: 'Funding', value: '$66M Series B', source: 'Crunchbase, 2024' },
            { label: 'Fintech clients', value: '60+', source: 'NymCard site' }
          ],
          edge:
            'Owns the issuing rails an EWA challenger would build on — could enable a competitor to ship faster than us.',
          gap:
            'No direct EWA product or employer relationships; the threat is enablement, not direct competition.',
          threat: 'Low'
        },
        {
          name: 'Zenda',
          metrics: [
            { label: 'Funding', value: '$9.4M seed', source: 'Crunchbase, 2022' },
            { label: 'Vertical focus', value: 'K–12 tuition + payroll', source: 'Zenda site' },
            { label: 'Profitability', value: 'Pre-revenue scale', source: 'Wamda, 2024' }
          ],
          edge:
            'Existing employer-payroll integrations in the UAE we would need to build from scratch.',
          gap:
            'Education-first wedge; consumer EWA is not on their roadmap and would require a pivot.',
          threat: 'Low'
        },
        {
          name: 'DapnDap',
          metrics: [
            { label: 'Funding', value: '~$2M pre-seed', source: 'Wamda, 2024' },
            { label: 'Employer base', value: '~30 employers', source: 'DapnDap site' },
            { label: 'Profitability', value: 'Pre-revenue', source: 'Wamda, 2024' }
          ],
          edge:
            'First-mover with regulator-friendly framing of wage advance — sets the regulatory narrative we will follow.',
          gap:
            'Narrow distribution and no consumer app to anchor retention — Astra reach dwarfs theirs at parity adoption.',
          threat: 'Medium'
        }
      ]
    },
    risks: [
      {
        name: 'Wage advance classification',
        category: 'Regulatory',
        severity: 'High',
        mitigation: 'Pre-engage CBUAE; structure as employer-funded advance, not credit.'
      },
      {
        name: 'Advance recovery',
        category: 'Credit',
        severity: 'Medium',
        mitigation: 'Recovery via direct payroll deduction; employer indemnity in MSA.'
      }
    ],
    kpis: {
      demandSignal: 0.09,
      problemSeverity: 'Medium',
      marketClarity: 'Partial',
      speedToMvp: 8
    }
  },

  {
    id: 'ai-financial-advisor',
    name: 'AI Financial Advisor',
    description: 'Personalised AI-driven financial guidance embedded natively in the Astra app.',
    stage: 'Evaluation',
    decision: 'Prioritise',
    score: 81,
    nullHypothesis:
      'Users will not engage with AI-driven financial guidance frequently enough for it to drive product attach or revenue lift.',
    targetCustomer:
      'Mass-affluent app users (income AED 15–50k/month) with at least three financial products; 25–50 age range.',
    aiSummary:
      'AI Financial Advisor has the strongest signal in the portfolio — 22% demand, well-defined ICP, 5-week speed to MVP. Top risk is FCA-equivalent advisory permissions; model hallucination is mitigatable via deterministic guardrails on regulated content. Recommendation: prioritise — fast-track to pilot.',
    market: {
      tam: '$9B',
      sam: '$700M',
      som: '$35M',
      sources: {
        tam: 'BCG MENA digital advisory, 2024',
        sam: 'GCC mass-affluent segment, internal',
        som: 'Year-1 attainable, internal model'
      },
      competitors: [
        {
          name: 'Sarwa',
          metrics: [
            { label: 'Funding', value: '$25M Series B', source: 'TechCrunch, 2022' },
            { label: 'AUM', value: '~$300M', source: 'Sarwa investor brief, 2024' },
            { label: 'Registered users', value: '~150k', source: 'Sarwa Q1 2024 disclosure' }
          ],
          edge:
            'Established robo-advisor brand and DFSA license — the regulated advice perimeter we are wary of entering.',
          gap:
            'Investments-only; no banking, credit, or insurance breadth to advise across the way Astra can.',
          threat: 'Medium'
        },
        {
          name: 'StashAway',
          metrics: [
            { label: 'AUM', value: '~$1.5B regional', source: 'Tech in Asia, 2024' },
            { label: 'Users', value: '~250k', source: 'StashAway Q1 2024' },
            { label: 'Funding', value: '$150M total', source: 'Crunchbase' }
          ],
          edge:
            'Regional reach plus AI-assist features in their paid tier — closer to our pitch than any UAE-only player.',
          gap:
            'Paywalled AI sits outside a banking surface; cannot capture the moment-of-decision the way an embedded Astra advisor can.',
          threat: 'Medium'
        },
        {
          name: 'Informal "advisors"',
          metrics: [
            { label: 'Reach', value: '~40% of mass-affluent', source: 'Astra survey, 2025' },
            { label: 'Channel', value: 'WhatsApp / Telegram groups', source: 'Astra survey, 2025' },
            { label: 'Monetisation', value: 'Tip-based / unregulated', source: 'Astra survey, 2025' }
          ],
          edge:
            'Community trust we cannot manufacture quickly — the default behaviour we are competing against.',
          gap:
            'Unregulated, inconsistent quality, no transactional follow-through — losing share the moment a credible alternative ships.',
          threat: 'Low'
        }
      ]
    },
    risks: [
      {
        name: 'Advisory permissions',
        category: 'Regulatory',
        severity: 'High',
        mitigation: 'Frame as guidance not advice; legal review of all regulated content paths.'
      },
      {
        name: 'Model hallucination',
        category: 'Operational',
        severity: 'Medium',
        mitigation: 'Deterministic guardrails for regulated content; eval suite with regression thresholds.'
      }
    ],
    kpis: {
      demandSignal: 0.22,
      problemSeverity: 'High',
      marketClarity: 'Well-defined',
      speedToMvp: 5
    }
  },

  {
    id: 'cross-border-bundle',
    name: 'Cross-Border Financial Bundle',
    description: 'Bundled remittance, FX, savings and insurance product for the expat segment.',
    stage: 'Pilot',
    decision: 'Proceed',
    score: 61,
    nullHypothesis:
      'Expat users will not consolidate remittance, FX, and savings into a single bundle from Astra at rates that beat unbundled alternatives.',
    targetCustomer:
      'UAE expats (South Asia, Egypt, Philippines corridors) sending >AED 1k/month abroad; 25–45 age range.',
    aiSummary:
      'Cross-Border Bundle is in Pilot with mixed signals — 24% activation and 7% conversion are below prioritise thresholds, and LTV/CAC at 1.3x indicates economics are unclear. FX margin compression and multi-jurisdiction compliance are the main constraints. Recommendation: Proceed with refined pricing and a single-corridor focus before the Scale gate.',
    market: {
      tam: '$6B',
      sam: '$500M',
      som: '$28M',
      sources: {
        tam: 'World Bank remittance prices, 2024',
        sam: 'UAE outbound corridor share, internal',
        som: 'Year-1 attainable, internal model'
      },
      competitors: [
        {
          name: 'Wise',
          metrics: [
            { label: 'Revenue', value: '£1.05B (FY24)', source: 'Wise plc annual report, 2024' },
            { label: 'Active customers', value: '12.8M', source: 'Wise FY24' },
            { label: 'UAE corridor', value: 'Live (retail focus)', source: 'Wise newsroom, 2024' }
          ],
          edge:
            'Best-in-class FX UX and pricing transparency — sets the consumer benchmark we must match before bundling matters.',
          gap:
            'No bundled savings or local banking surface; UK-priced economics assume float models we can beat in-app.',
          threat: 'High'
        },
        {
          name: 'Lulu Money',
          metrics: [
            { label: 'Group revenue', value: '$2.2B (FY23)', source: 'Lulu International FY23' },
            { label: 'Remittance volume', value: '$20B/yr', source: 'Lulu Money, 2024' },
            { label: 'Profitability', value: 'Profitable (group)', source: 'Lulu International FY23' }
          ],
          edge: 'Deepest cash-out corridor relationships across South Asia — irreplaceable for unbanked recipients.',
          gap: 'Weak digital UX and no consumer banking; corridor depth does not translate to bundle propositions.',
          threat: 'Medium'
        },
        {
          name: 'Now Money',
          metrics: [
            { label: 'Funding', value: '$7M total', source: 'Crunchbase' },
            { label: 'Users', value: '~50k blue-collar', source: 'Wamda, 2024' },
            { label: 'Profitability', value: 'Pre-profit', source: 'Wamda, 2024' }
          ],
          edge: 'UAE-first remittance positioning for blue-collar workers — segment-specific trust we do not contest.',
          gap: 'Different segment and minimal product breadth — no overlap with our mass-affluent expat target.',
          threat: 'Low'
        }
      ]
    },
    risks: [
      {
        name: 'Multi-jurisdiction compliance',
        category: 'Regulatory',
        severity: 'High',
        mitigation: 'Phased corridor rollout; per-corridor compliance lead.'
      },
      {
        name: 'FX margin compression',
        category: 'Market',
        severity: 'Medium',
        mitigation: 'Hedge book + dynamic pricing engine; bundle subsidy from savings spread.'
      }
    ],
    kpis: {
      activationRate: 0.24,
      conversionRate: 0.07,
      retentionD30: 0.22,
      ltvCac: 1.3,
      riskSignals: 'Moderate',
      operationalLoad: 'Medium'
    }
  },

  {
    id: 'ai-credit-pre-approval',
    name: 'AI Credit Pre-Approval',
    description: 'ML-driven credit pre-approval engine using behavioural and transactional signals.',
    stage: 'Scale',
    decision: 'Proceed',
    score: 67,
    nullHypothesis:
      'Behavioural and transactional ML signals will not improve credit funnel conversion meaningfully over the existing rules-based flow.',
    targetCustomer: 'Existing Astra app users with thin credit files but rich behavioural data; 22–40 age range.',
    aiSummary:
      'AI Credit Pre-Approval is in Scale with LTV/CAC at 2.1x (proceed band), contribution margin approaching breakeven, and 14-month payback. CBUAE model risk guidance (partial approval) is the main gating item. Recommendation: Proceed — drive payback below 12 months via segment-targeted CAC reduction and finalise model risk documentation.',
    market: {
      tam: '$18B',
      sam: '$2.1B',
      som: '$110M',
      sources: {
        tam: 'GCC consumer credit, regional banking review 2024',
        sam: 'UAE thin-file addressable, internal',
        som: 'Year-1 attainable, internal model'
      },
      competitors: [
        {
          name: 'Credit Saison',
          metrics: [
            { label: 'Revenue', value: '¥320B (FY23)', source: 'Saison annual report, 2024' },
            { label: 'MENA presence', value: 'Saison Capital JVs', source: 'Saison disclosures, 2024' },
            { label: 'Profitability', value: 'Profitable', source: 'Saison FY23' }
          ],
          edge: 'Decades of underwriting models and balance-sheet capital we cannot match on cost of risk.',
          gap: 'Legacy stack and slow iteration; not embedded in any UAE consumer app surface.',
          threat: 'Low'
        },
        {
          name: 'Tabby / Tamara',
          metrics: [
            { label: 'Funding', value: '$200M Series D (Tabby)', source: 'TechCrunch, 2024' },
            { label: 'Users', value: '~15M (Tabby) / ~10M (Tamara)', source: 'TechCrunch & Crunchbase, 2024' },
            { label: 'Profitability', value: 'Approaching breakeven', source: 'TechCrunch, 2024' }
          ],
          edge: 'POS distribution and instant-approval flows that reach our prospective borrowers before we do.',
          gap: 'Short-tenor BNPL only; cannot serve the longer-horizon credit needs Astra targets.',
          threat: 'Medium'
        },
        {
          name: 'Local banks (ENBD, FAB, ADCB)',
          metrics: [
            { label: 'Retail credit book', value: 'AED 470B combined', source: 'CBUAE Q4 2024' },
            { label: 'Approval time', value: '3–7 days typical', source: 'Astra customer interviews, 2025' },
            { label: 'Profitability', value: 'Highly profitable', source: 'CBUAE 2024' }
          ],
          edge: 'Trust, capital, and CBUAE relationships — the incumbents customers default to for size and tenor.',
          gap:
            'Rules-based scoring and slow approvals; no behavioural-signal capture means they lose the thin-file segment we win.',
          threat: 'Medium'
        }
      ]
    },
    risks: [
      {
        name: 'Model drift',
        category: 'Credit',
        severity: 'Medium',
        mitigation: 'Monthly drift monitoring; auto-shadow deploy of challenger model.'
      },
      {
        name: 'CBUAE model risk guidelines',
        category: 'Regulatory',
        severity: 'Medium',
        mitigation: 'Partial approval secured; model risk documentation in flight.'
      }
    ],
    kpis: {
      ltvCac: 2.1,
      contributionMargin: 'Approaching breakeven',
      paybackMonths: 14,
      riskScalability: 'Stabilising',
      regulatoryReadiness: 'Partial',
      operationalScalability: 'Needs optimisation',
      strategicFit: 'Strong'
    }
  },

  {
    id: 'botim-score',
    name: 'Botim Score',
    description: 'Alternative credit score product leveraging Botim social-graph and usage data.',
    stage: 'Evaluation',
    decision: 'Kill',
    score: 31,
    nullHypothesis:
      'Botim usage and social-graph signals correlate strongly enough with creditworthiness to enable a viable alternative scoring product.',
    targetCustomer: 'Thin-file mass-market users in UAE with active Botim usage but no traditional credit history.',
    aiSummary:
      'Botim Score shows weak demand at 3%, low problem severity, and an unclear monetisation path. Data privacy concerns under UAE PDPL are material, and the path to a regulator-acceptable use of social-graph signals is unproven. Recommendation: Kill — reallocate capacity to higher-signal bets.',
    market: {
      tam: '$2B',
      sam: '$150M',
      som: '$8M',
      sources: {
        tam: 'GCC alternative credit data, 2024',
        sam: 'UAE thin-file Botim-active overlap, internal',
        som: 'Year-1 attainable, internal model'
      },
      competitors: [
        {
          name: 'Tasaheel',
          metrics: [
            { label: 'Scored consumers', value: '~1M', source: 'Tasaheel, 2024' },
            { label: 'Owner', value: 'Aafaq Islamic Finance', source: 'Aafaq disclosures' },
            { label: 'Profitability', value: 'Profitable (subsidiary)', source: 'Aafaq FY23' }
          ],
          edge: 'Existing lender relationships and Sharia-compliant positioning we would have to replicate.',
          gap: 'Traditional data only — does not unlock the thin-file segment Botim Score is meant to address.',
          threat: 'Low'
        },
        {
          name: 'CreditEase',
          metrics: [
            { label: 'Revenue', value: '~$1.2B (FY23)', source: 'CreditEase annual, 2024' },
            { label: 'Markets', value: 'China + B2B SaaS exports', source: 'CreditEase, 2024' },
            { label: 'Profitability', value: 'Profitable', source: 'CreditEase FY23' }
          ],
          edge: 'Scale playbook in alternative credit data — proves the model works in adjacent geographies.',
          gap: 'No UAE consumer footprint and no data-trust with local users; not a near-term threat to us.',
          threat: 'Low'
        },
        {
          name: 'Traditional bureaus (AECB)',
          metrics: [
            { label: 'Coverage', value: '~5.5M UAE residents', source: 'AECB, 2024' },
            { label: 'Mandate', value: 'Federal credit registry', source: 'AECB charter' },
            { label: 'Profitability', value: 'Government-backed', source: 'AECB' }
          ],
          edge: 'Mandated regulatory role and trusted infrastructure — every lender already plugs in here.',
          gap:
            'Thin-file population is exactly the wedge — but the wedge itself is regulator-blocked under PDPL, so no defensible path for us.',
          threat: 'Low'
        }
      ]
    },
    risks: [
      {
        name: 'Data privacy (UAE PDPL)',
        category: 'Regulatory',
        severity: 'High',
        mitigation: 'Unclear path; consent-based use case may not meet regulator expectations.'
      },
      {
        name: 'Unclear monetisation',
        category: 'Market',
        severity: 'High',
        mitigation: 'No buyer-side validation from banks/lenders to date.'
      }
    ],
    kpis: {
      demandSignal: 0.03,
      problemSeverity: 'Low',
      marketClarity: 'Unclear',
      speedToMvp: 20
    }
  }
]
