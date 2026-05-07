// Hard-coded bet data for the New Horizons demo.
// Sourced from the New Horizons Memo v1 (Astra Tech, 2026).

export const SEED_BETS = [
  {
    id: 'sme-insurance',
    name: 'SME Insurance',
    description: 'Embedded insurance product targeting SME owners via the Astra app. Commission-based model via insurer partnerships.',
    stage: 'Pilot',
    decision: 'Prioritise',
    score: 74,
    nullHypothesis: 'SME owners using the Astra app will not attach insurance products at conversion rates that justify the integration and licensing cost.',
    targetCustomer: 'SME owners (1–50 employees) already on the Astra app for banking or lending; UAE-based, primarily trading and services sectors.',
    aiSummary: 'SME Insurance is in Pilot with strong demand validation — 38% activation and 12% conversion. LTV/CAC of 1.8x sits just below the >2.0x prioritise threshold for Pilot, driven by current acquisition mix. Top watch items: insurance licensing complexity (mitigated via partner broker) and operational dependency on partner claims flow. Recommendation: continue pilot, push CAC down via embedded distribution before the Scale gate.',
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
        { name: 'Bayzat', strength: 'Strong HR-led SME foothold', weakness: 'Limited embedded distribution', threat: 'Medium' },
        { name: 'Sukoon', strength: 'Established UAE insurer', weakness: 'Slow digital onboarding', threat: 'Low' },
        { name: 'Yallacompare', strength: 'High brand awareness', weakness: 'Aggregator UX, weak SME flow', threat: 'Low' }
      ]
    },
    risks: [
      { name: 'Insurance licensing', category: 'Regulatory', severity: 'Medium', mitigation: 'Partner with licensed insurer under broker agreement; CBUAE/IA file pre-cleared.' },
      { name: 'Claims flow dependency', category: 'Operational', severity: 'Medium', mitigation: 'Insurer SLA + monitored claims dashboard; weekly ops review.' }
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
    description: 'Allow users to access earned wages before payday via employer payroll integrations.',
    stage: 'Evaluation',
    decision: 'Proceed',
    score: 58,
    nullHypothesis: 'Salaried users will not adopt earned-wage access at rates that justify the cost of integrating with employer payroll systems.',
    targetCustomer: 'Mid-income salaried employees (AED 4–15k/month) at SMEs without payroll flexibility; 25–45 age range; UAE-based.',
    aiSummary: 'EWA shows promising early demand at 9% and a clear problem statement. Regulatory classification of wage advances under UAE labour law and CBUAE rules is the gating constraint. Speed-to-MVP at 8 weeks is within the proceed band. Recommendation: Proceed with employer integration interviews and a regulatory readiness sprint before pilot.',
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
        { name: 'NymCard', strength: 'B2B issuer infrastructure', weakness: 'No direct consumer EWA play', threat: 'Low' },
        { name: 'Zenda', strength: 'Corporate distribution', weakness: 'Education-segment focus', threat: 'Low' },
        { name: 'DapnDap', strength: 'Early UAE EWA mover', weakness: 'Narrow employer base', threat: 'Medium' }
      ]
    },
    risks: [
      { name: 'Wage advance classification', category: 'Regulatory', severity: 'High', mitigation: 'Pre-engage CBUAE; structure as employer-funded advance, not credit.' },
      { name: 'Advance recovery', category: 'Credit', severity: 'Medium', mitigation: 'Recovery via direct payroll deduction; employer indemnity in MSA.' }
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
    nullHypothesis: 'Users will not engage with AI-driven financial guidance frequently enough for it to drive product attach or revenue lift.',
    targetCustomer: 'Mass-affluent app users (income AED 15–50k/month) with at least three financial products; 25–50 age range.',
    aiSummary: 'AI Financial Advisor has the strongest signal in the portfolio — 22% demand, well-defined ICP, 5-week speed to MVP. Top risk is FCA-equivalent advisory permissions; model hallucination is mitigatable via deterministic guardrails on regulated content. Recommendation: prioritise — fast-track to pilot.',
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
        { name: 'Sarwa', strength: 'Established robo-advisor brand', weakness: 'Narrow remit (investments only)', threat: 'Medium' },
        { name: 'StashAway', strength: 'Regional reach', weakness: 'Paid tier gates AI features', threat: 'Medium' },
        { name: 'Informal "advisors"', strength: 'High trust in WhatsApp groups', weakness: 'Unregulated, inconsistent', threat: 'Low' }
      ]
    },
    risks: [
      { name: 'Advisory permissions', category: 'Regulatory', severity: 'High', mitigation: 'Frame as guidance not advice; legal review of all regulated content paths.' },
      { name: 'Model hallucination', category: 'Operational', severity: 'Medium', mitigation: 'Deterministic guardrails for regulated content; eval suite with regression thresholds.' }
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
    nullHypothesis: 'Expat users will not consolidate remittance, FX, and savings into a single bundle from Astra at rates that beat unbundled alternatives.',
    targetCustomer: 'UAE expats (South Asia, Egypt, Philippines corridors) sending >AED 1k/month abroad; 25–45 age range.',
    aiSummary: 'Cross-Border Bundle is in Pilot with mixed signals — 24% activation and 7% conversion are below prioritise thresholds, and LTV/CAC at 1.3x indicates economics are unclear. FX margin compression and multi-jurisdiction compliance are the main constraints. Recommendation: Proceed with refined pricing and a single-corridor focus before the Scale gate.',
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
        { name: 'Wise', strength: 'Strong UX and pricing transparency', weakness: 'UK-priced; no bundled savings', threat: 'High' },
        { name: 'Lulu Money', strength: 'Incumbent corridor depth', weakness: 'Weak digital UX', threat: 'Medium' },
        { name: 'Now Money', strength: 'UAE-first proposition', weakness: 'Narrow product breadth', threat: 'Low' }
      ]
    },
    risks: [
      { name: 'Multi-jurisdiction compliance', category: 'Regulatory', severity: 'High', mitigation: 'Phased corridor rollout; per-corridor compliance lead.' },
      { name: 'FX margin compression', category: 'Market', severity: 'Medium', mitigation: 'Hedge book + dynamic pricing engine; bundle subsidy from savings spread.' }
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
    nullHypothesis: 'Behavioural and transactional ML signals will not improve credit funnel conversion meaningfully over the existing rules-based flow.',
    targetCustomer: 'Existing Astra app users with thin credit files but rich behavioural data; 22–40 age range.',
    aiSummary: 'AI Credit Pre-Approval is in Scale with LTV/CAC at 2.1x (proceed band), contribution margin approaching breakeven, and 14-month payback. CBUAE model risk guidance (partial approval) is the main gating item. Recommendation: Proceed — drive payback below 12 months via segment-targeted CAC reduction and finalise model risk documentation.',
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
        { name: 'Credit Saison', strength: 'Established scorecards', weakness: 'Legacy stack, slow iteration', threat: 'Low' },
        { name: 'Tabby / Tamara', strength: 'BNPL distribution at point of sale', weakness: 'Narrow credit horizon', threat: 'Medium' },
        { name: 'Local banks', strength: 'Trusted, deep capital', weakness: 'Rules-based, slow approvals', threat: 'Medium' }
      ]
    },
    risks: [
      { name: 'Model drift', category: 'Credit', severity: 'Medium', mitigation: 'Monthly drift monitoring; auto-shadow deploy of challenger model.' },
      { name: 'CBUAE model risk guidelines', category: 'Regulatory', severity: 'Medium', mitigation: 'Partial approval secured; model risk documentation in flight.' }
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
    nullHypothesis: 'Botim usage and social-graph signals correlate strongly enough with creditworthiness to enable a viable alternative scoring product.',
    targetCustomer: 'Thin-file mass-market users in UAE with active Botim usage but no traditional credit history.',
    aiSummary: 'Botim Score shows weak demand at 3%, low problem severity, and an unclear monetisation path. Data privacy concerns under UAE PDPL are material, and the path to a regulator-acceptable use of social-graph signals is unproven. Recommendation: Kill — reallocate capacity to higher-signal bets.',
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
        { name: 'Tasaheel', strength: 'Incumbent scoring presence', weakness: 'Traditional data only', threat: 'Low' },
        { name: 'CreditEase', strength: 'B2B partnerships', weakness: 'Limited consumer footprint', threat: 'Low' },
        { name: 'Traditional bureaus', strength: 'Trusted, regulated', weakness: 'Thin-file gap', threat: 'Low' }
      ]
    },
    risks: [
      { name: 'Data privacy (UAE PDPL)', category: 'Regulatory', severity: 'High', mitigation: 'Unclear path; consent-based use case may not meet regulator expectations.' },
      { name: 'Unclear monetisation', category: 'Market', severity: 'High', mitigation: 'No buyer-side validation from banks/lenders to date.' }
    ],
    kpis: {
      demandSignal: 0.03,
      problemSeverity: 'Low',
      marketClarity: 'Unclear',
      speedToMvp: 20
    }
  }
]
