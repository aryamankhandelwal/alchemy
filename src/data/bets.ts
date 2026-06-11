// Seed data inserted by server/seed.ts the first time the bets collection is
// empty. Snapshot of the live portfolio taken 2026-06-11 — these two bets are
// the canonical defaults; histories start clean on a fresh seed.

import type { Bet } from '@/types/bet'

export const SEED_BETS: Bet[] = [
  {
    "id": "sme-insurance",
    "name": "SME Insurance",
    "description": "Embedded insurance product targeting SME owners. Commission-based model via insurer partnerships. Initially distributed through point of sale (POS) with plans to expand to the online platform.",
    "stage": "Evaluation",
    "decision": "Proceed",
    "score": 65,
    "nullHypothesis": "SME owners using the Astra app will not attach insurance products at conversion rates that justify the integration and licensing cost.",
    "targetCustomer": "SME owners (1–50 employees) already on the Astra app for banking or lending; UAE-based, primarily trading and services sectors. Initially offered through point of sale (POS) with eventual transition to online platform.",
    "aiSummary": "SME Insurance is an embedded product leveraging Astra's platform to offer insurance to SME owners. The LTV/CAC ratio of 5x meets the proceed threshold, and the market size is substantial. While key demand and market clarity KPIs are yet to be entered, the embedded distribution provides a unique advantage over competitors like Bayzat and CoverB. Mitigation plans for regulatory and operational risks appear sound.\nRecommendation: Proceed",
    "market": {
      "tam": "USD 4.2 billion",
      "sam": "USD 1.2 billion",
      "som": "USD 150 million",
      "sources": {
        "tam": "Mordor Intelligence, 2024; Khaleej Times, 2024; The National News, 2024",
        "sam": "UAE Ministry of Economy, mid-2022; Dubai SME, 2019; Mordor Intelligence, 2024",
        "som": "Derived from TAM/SAM estimates based on assumed penetration rates for new digital products"
      },
      "competitors": [
        {
          "name": "CoverB",
          "metrics": [
            {
              "label": "Market Recognition",
              "value": "Top Player Among UAE Insurtech Companies",
              "source": "Industry reports, 2025"
            },
            {
              "label": "Platform Focus",
              "value": "User-centric digital platform for comparison & purchase",
              "source": "Company statements, 2025"
            }
          ],
          "edge": "Established dedicated insurtech platform with broad digital comparison, customization capabilities, and AI-driven claims processing. Strong focus on direct insurance customer engagement.",
          "gap": "Requires active seeking by the SME owner for insurance; lacks the embedded advantage of leveraging an existing, trusted banking/lending relationship with lower customer acquisition cost.",
          "threat": "Medium"
        },
        {
          "name": "Bayzat",
          "metrics": [
            {
              "label": "Total Funding",
              "value": "US$60 million",
              "source": "Wamda, 2023"
            },
            {
              "label": "Business Customers",
              "value": "Over 4,000",
              "source": "Magnitt, 2024"
            }
          ],
          "edge": "Comprehensive 'work-life platform' integrating HR management, payroll, employee benefits, and insurance. Provides a holistic solution for businesses with significant funding and a large existing customer base.",
          "gap": "Their insurance offering is part of a broader HR/benefits suite, while Astra's embedded approach can offer more direct and instantaneous insurance products related to core banking/lending transactions.",
          "threat": "High"
        },
        {
          "name": "PolicyBazaar.ae / PromptTechInsurance (Online Aggregators/Brokers)",
          "metrics": [
            {
              "label": "Insurer Partnerships",
              "value": "Wide range of insurer partners",
              "source": "Company websites, 2024"
            },
            {
              "label": "Service Offering",
              "value": "Online comparison and purchase of tailored solutions",
              "source": "Company websites, 2024"
            }
          ],
          "edge": "Offers a broad selection of policies from multiple insurers, allowing SMEs to compare quotes and find competitive pricing easily.",
          "gap": "Requires SMEs to actively search for and compare insurance options; lacks the seamless, proactive, and contextual offering inherent in Astra's embedded model within an existing financial relationship.",
          "threat": "Medium"
        },
        {
          "name": "MetLife UAE",
          "metrics": [
            {
              "label": "Years in UAE",
              "value": "Over 50 years",
              "source": "MetLife UAE website, 2024"
            },
            {
              "label": "Global Presence",
              "value": "Large, established global insurer",
              "source": "MetLife Global Reports, 2024"
            }
          ],
          "edge": "Strong brand recognition, extensive experience in the UAE, and established relationships within the insurance ecosystem. Provides specific, compliant medical insurance packages for SMEs.",
          "gap": "Primarily focuses on group medical insurance for SMEs, a narrower scope compared to Astra's potential to offer a broader range of business insurance products (e.g., property, liability, cyber) directly tied to banking/lending activities.",
          "threat": "Medium"
        },
        {
          "name": "Interactive Insurance Brokers / Gargash Insurance (Digitalizing Traditional Brokers)",
          "metrics": [
            {
              "label": "LinkedIn Followers (Interactive Insurance Brokers)",
              "value": "21,000+",
              "source": "LinkedIn, 2024"
            },
            {
              "label": "Industry Experience (Interactive Insurance Brokers)",
              "value": "Since 2001",
              "source": "Company website, 2024"
            }
          ],
          "edge": "Long-standing reputation, extensive industry expertise, human-touch advisory services, and strong existing relationships with insurers and SME clients. Investing in digital tools to enhance traditional strengths.",
          "gap": "Even with digital transformation, their core model often involves a more consultative process. Astra's direct embedded approach offers instantaneous, contextual insurance at the point of transaction, reducing friction significantly.",
          "threat": "Medium"
        }
      ]
    },
    "risks": [
      {
        "name": "Insurance licensing",
        "category": "Regulatory",
        "severity": "Medium",
        "mitigation": "Partner with licensed insurer under broker agreement; CBUAE/IA file pre-cleared."
      },
      {
        "name": "Claims flow dependency",
        "category": "Operational",
        "severity": "Medium",
        "mitigation": "Insurer SLA + monitored claims dashboard; weekly ops review."
      }
    ],
    "kpis": {
      "activationRate": 0.38,
      "conversionRate": 0.12,
      "retentionD30": 0.35,
      "ltvCac": 2.3,
      "riskSignals": "Moderate",
      "operationalLoad": "Medium"
    },
    "timeline": {
      "Evaluation": {
        "start": "2026-05-05",
        "end": null
      },
      "Pilot": {
        "start": null,
        "end": null
      },
      "Scale": {
        "start": null,
        "end": null
      }
    },
    "customKpis": [
      {
        "id": "ltv-cac-f7wi",
        "name": "LTV / CAC",
        "definition": "LTV/CAC measures long-term customer value against acquisition cost. It shows how effectively you're spending to acquire profitable, repeat insurance customers.",
        "kill": "<1x",
        "proceed": "1-10x",
        "prioritise": ">10x",
        "value": "5x"
      }
    ],
    "scoreRationale": "- LTV/CAC is 5x, meeting the 'Proceed' threshold.\n- Several key KPIs (demandSignal, problemSeverity, marketClarity, speedToMvp) are not entered, which is neutral as the bet is in the Evaluation stage.\n- Risks are medium severity with credible mitigation plans, posing a moderate challenge.\n- Market analysis shows significant competition, but the embedded distribution offers a clear edge.",
    "hiddenKpis": [],
    "initiatives": []
  },
  {
    "id": "savings-pots-4gai",
    "name": "Savings Pots",
    "description": "Botim Pots is a goal-based savings feature enabling users to ring-fence money within their Botim wallet for specific objectives. It targets existing Botim users to build saving habits. Monetization occurs by cross-selling wealth products as users achieve savings goals, converting transactional users into primary customers.",
    "stage": "Pilot",
    "decision": "Proceed",
    "score": 68,
    "nullHypothesis": "This fails if a significant portion of Botim users do not consistently use the savings pots to accumulate funds for their stated goals over time.",
    "targetCustomer": "Financially active Botim users in the UAE/MENA region who frequently send/receive remittances, manage household expenses, or aim to save for specific life goals but lack structured savings habits.",
    "aiSummary": "Savings Pots is a goal-based savings feature within the Botim wallet, targeting existing users to build saving habits and cross-selling wealth products. Early indicators show a promising Conversion Rate (PRIORITISE) and LTV/CAC (PROCEED).\n\nWhile several KPIs are missing, this is expected at the Pilot stage. The high-severity regulatory risk has a mitigation strategy. Competitive pressure is noted but does not undermine the core proposition.\nRecommendation: Proceed",
    "market": {
      "tam": "$35.05B",
      "sam": "$7.01B",
      "som": "$125.85M",
      "sources": {
        "tam": "Projected Middle East and Africa Digital Wallet Market revenue in 2026, calculated from USD 20,526.37 million in 2023 at a Compound Annual Growth Rate (CAGR) of 19.73%.",
        "sam": "Estimated 20% of the Total Addressable Market (TAM) representing the addressable revenue pool for savings and personal finance features within the Middle East and Africa Digital Wallet Market in 2026.",
        "som": "Estimated 1.5% market share of the projected Serviceable Available Market (SAM) for Botim Pots in its first year of attainability (2027), assuming the SAM continues to grow at a 19.73% CAGR."
      },
      "competitors": [
        {
          "name": "Liv. Bank (by Emirates NBD)",
          "metrics": [
            {
              "label": "Parent company (Emirates NBD) assets oversaw",
              "value": "$134 billion",
              "source": "Emirates NBD Investor Relations (various reports)"
            },
            {
              "label": "Parent company (Emirates NBD) total assets",
              "value": "$1,109 billion",
              "source": "Emirates NBD Investor Relations (various reports)"
            }
          ],
          "edge": "Strong brand recognition and inherent trust derived from its parent company, Emirates NBD, a well-established traditional bank. It offers a broader suite of digital banking and traditional financial services.",
          "gap": "May exhibit less agility in developing highly niche digital savings features, and might not cater as specifically to the remittance-focused customer segment as Botim.",
          "threat": "High"
        },
        {
          "name": "Mashreq Neo (by Mashreq Bank)",
          "metrics": [
            {
              "label": "Parent company (Mashreq) Q1 FY26 profit rise",
              "value": "7%",
              "source": "Mashreq Bank Financial Statements / News Reports, Q1 FY26"
            },
            {
              "label": "Parent company (Mashreq) regional presence",
              "value": "Significant regional bank",
              "source": "Mashreq Bank Corporate Information"
            }
          ],
          "edge": "Similar to Liv. Bank, it benefits from the backing of a large, established traditional bank, providing a comprehensive range of digital banking services beyond just savings, coupled with established regulatory compliance.",
          "gap": "Similar to Liv. Bank, it may not possess the same level of specialization in micro-savings within a digital wallet ecosystem or a deep understanding of the unique remittance behavior of Botim's target users.",
          "threat": "High"
        },
        {
          "name": "MNT-Halan (Egypt-based, expanding to UAE)",
          "metrics": [
            {
              "label": "Estimated annual revenue",
              "value": "$184.6M",
              "source": "Data derived from various financial news outlets and company statements (e.g., TechCrunch, Wamda)"
            },
            {
              "label": "Total funding",
              "value": "$550M",
              "source": "Various financial news outlets and company statements (e.g., TechCrunch, Wamda)"
            },
            {
              "label": "Valuation",
              "value": "$1B",
              "source": "Bloomberg, February 2023"
            },
            {
              "label": "Active users",
              "value": "2 million",
              "source": "Company statements, December 2024"
            }
          ],
          "edge": "Strong focus on the underserved and unbanked populations, offering a comprehensive suite of financial services including loans, payments, e-wallets, and investments. The company has significant funding, a proven ability to scale rapidly, and direct experience with e-wallets and various financial services.",
          "gap": "May not have the same deep integration with Botim's core remittance functionality or the established trust of its existing user base within that specific ecosystem. It is also a newer entrant to the UAE market compared to local incumbents.",
          "threat": "High"
        }
      ]
    },
    "risks": [
      {
        "name": "Regulatory compliance for locked funds",
        "category": "Regulatory",
        "severity": "High",
        "mitigation": "Obtain clear legal counsel and regulatory approval for lock-in mechanisms, cooling-off periods, and biometric override procedures. Ensure transparent user disclosures."
      },
      {
        "name": "Technical integration with existing Botim systems",
        "category": "Operational",
        "severity": "Medium",
        "mitigation": "Conduct thorough architectural design and phased implementation; leverage modular APIs; dedicate a cross-functional team for integration, robust testing."
      },
      {
        "name": "Low user adoption or sustained engagement",
        "category": "Market",
        "severity": "Medium",
        "mitigation": "Conduct user research to refine UX/UI, run A/B tests on automation triggers, integrate gamification, and leverage targeted in-app marketing."
      },
      {
        "name": "Competition from existing savings solutions",
        "category": "Market",
        "severity": "Medium",
        "mitigation": "Differentiate through unique Botim-specific features like remittance-linked triggers and seamless integration with existing communication/payment rails; focus on superior UX and trust."
      }
    ],
    "kpis": {
      "demandSignal": 0.15,
      "problemSeverity": "High",
      "marketClarity": "Partial",
      "speedToMvp": 12,
      "activationRate": 0.25,
      "conversionRate": 0.16,
      "ltvCac": 1
    },
    "timeline": {
      "Evaluation": {
        "start": "2026-04-10",
        "end": "2026-06-03"
      },
      "Pilot": {
        "start": "2026-06-03",
        "end": null
      },
      "Scale": {
        "start": null,
        "end": null
      }
    },
    "scoreRationale": "- Conversion Rate (PRIORITISE) and LTV/CAC (PROCEED) show positive early signs.\n- Activation Rate (PROCEED) is acceptable for the pilot stage.\n- Several KPIs are not yet entered (Retention D30, Risk Signals, Operational Load), which is typical for this early stage and does not heavily penalize the score.\n- High-severity 'Regulatory compliance' risk has a credible mitigation plan, reducing its impact.\n- Market context is secondary and competitive pressure is high but does not detract from the core value proposition.",
    "initiatives": []
  }
]
