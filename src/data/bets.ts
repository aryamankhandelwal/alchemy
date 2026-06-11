// Seed data inserted by server/seed.ts the first time the bets collection is
// empty. Snapshot of the live portfolio taken 2026-06-11 via
// scripts/snapshot-seed.py — re-run that script to refresh this file plus the
// seed/ folder (artifacts manifest + binaries). Histories start clean.

import type { Bet } from '@/types/bet'

export const SEED_BETS: Bet[] = [
  {
    "id": "sme-insurance",
    "name": "SME Insurance",
    "description": "Embedded insurance product targeting SME owners. Commission-based model via insurer partnerships. Initially distributed through point of sale (POS) with plans to expand to the online platform.",
    "stage": "Evaluation",
    "decision": "Proceed",
    "score": 58,
    "nullHypothesis": "SME owners using the Astra app will not attach insurance products at conversion rates that justify the integration and licensing cost.",
    "targetCustomer": "SME owners (1–50 employees) already on the Astra app for banking or lending; UAE-based, primarily trading and services sectors. Initially offered through point of sale (POS) with eventual transition to online platform.",
    "aiSummary": "This bet aims to embed insurance for SMEs within Astra's banking and lending platform, targeting a significant market with a commission-based model.\nWhile the LTV/CAC is strong and the strategic impact is high, a KILL on the demandSignal KPI drastically reduces confidence.\nEffort is moderate due to regulatory and operational risks.\nRecommendation: Proceed",
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
      "operationalLoad": "Medium",
      "demandSignal": null
    },
    "timeline": {
      "Evaluation": {
        "start": "2026-05-12",
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
    "scoreRationale": "- Reach 7/10 — The SAM of USD 1.2 billion and SOM of USD 150 million represent a substantial addressable market for SMEs already using Astra's banking/lending services.\n- Impact 8/10 — Embedded insurance offers significant strategic upside by enhancing Astra's core financial products and creating a stronger portfolio moat.\n- Confidence 4/10 — The KILL verdict on the demandSignal KPI significantly lowers confidence despite a strong LTV/CAC ratio.\n- Effort 6/10 (lower is better) — Partnerships with insurers and navigating regulatory approvals present a moderate effort, as indicated by the licensing and claims flow risks.",
    "hiddenKpis": [],
    "initiatives": [],
    "rice": {
      "reach": 7,
      "impact": 8,
      "confidence": 4,
      "effort": 6
    }
  },
  {
    "id": "savings-pots-4gai",
    "name": "Savings Pots",
    "description": "Botim Pots is a goal-based savings feature enabling users to ring-fence money within their Botim wallet for specific objectives. It targets existing Botim users to build saving habits. Monetization occurs by cross-selling wealth products as users achieve savings goals, converting transactional users into primary customers.",
    "stage": "Pilot",
    "decision": "Proceed",
    "score": 65,
    "nullHypothesis": "This fails if a significant portion of Botim users do not consistently use the savings pots to accumulate funds for their stated goals over time.",
    "targetCustomer": "Financially active Botim users in the UAE/MENA region who frequently send/receive remittances, manage household expenses, or aim to save for specific life goals but lack structured savings habits.",
    "aiSummary": "Savings Pots is a goal-based savings feature within the Botim wallet, aiming to build saving habits among existing users and cross-sell wealth products. It shows promise with two 'Proceed' KPIs (activation, LTV/CAC) and a clear strategy to differentiate against strong competitors. Despite regulatory risks, mitigation plans are in place.\nRecommendation: Proceed",
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
      "conversionRate": null,
      "ltvCac": 1,
      "retentionD30": null
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
    "scoreRationale": "- Two KPIs (activationRate, ltvCac) are PROCEED, and conversionRate & retentionD30 are missing (expected for this stage).\n- High severity 'Regulatory compliance' risk is noted but has a credible mitigation plan.\n- Market analysis shows strong competitor presence but Botim has differentiation through integration and user trust.\n- The 'Low user adoption' risk has a decent mitigation; 'Competition' risk is well-addressed.",
    "initiatives": []
  },
  {
    "id": "remittance-protect-9a66",
    "name": "Remittance Protect",
    "description": "Embedded insurance protecting remittances via Botim. For AED 3, it covers up to AED 1,200 for 30 days. Monetization via per-transaction fee. Partnership with Chubb as reinsurer and a licensed fronting insurer is planned.",
    "stage": "Evaluation",
    "decision": "Proceed",
    "score": 72,
    "nullHypothesis": "This fails if Botim users do not see value in paying a small fee for remittance protection.",
    "targetCustomer": "Botim users sending remittances from UAE to MENA countries.",
    "aiSummary": "Remittance Protect offers embedded micro-insurance for remittances via Botim, with a clear value proposition for users. Key evaluation KPIs are all marked PROCEED, and market analysis indicates a viable niche.\nWhile regulatory and adoption risks exist, planned mitigations appear reasonable.\nRecommendation: Proceed",
    "market": {
      "tam": "$1 Trillion+",
      "sam": "$4.635 Billion",
      "som": "$120 Million",
      "sources": {
        "tam": "MENA remittance market was valued at approximately $701 billion in 2020 and projected to reach $1000 billion by 2027. (Source: Mordor Intelligence, IMARC Group)",
        "sam": "MENA digital remittance market is projected to reach $4.635 billion by 2030. (Source: Mordor Intelligence)",
        "som": "UAE outbound remittances ~$43 billion annually; assuming 1% to MENA and $0.30 fee per transaction equates to ~$120 million in Year 1. (Source: UAE Central Bank data, estimated transaction value)"
      },
      "competitors": [
        {
          "name": "botim Money (with Mastercard Move/TerraPay Partnerships)",
          "metrics": [
            {
              "label": "User base",
              "value": "Millions of users in UAE and beyond",
              "source": "Company website/public statements"
            },
            {
              "label": "Global reach",
              "value": "Transfers to over 150 countries",
              "source": "Company website/public statements"
            },
            {
              "label": "Licensing",
              "value": "Licensed by CBUAE for SVF and RPSCS",
              "source": "Central Bank of UAE"
            }
          ],
          "edge": "Established user base, existing communication platform integration, broader remittance network, and multiple payout options.",
          "gap": "Dedicated remittance insurance protection for a small fee, focused on a specific value-add for remittance transactions.",
          "threat": "Medium"
        },
        {
          "name": "Hemaayah Embedded Insurance",
          "metrics": [
            {
              "label": "Focus",
              "value": "Embedding insurance into remittance services",
              "source": "Company website"
            },
            {
              "label": "Target demographic",
              "value": "Millions of GCC workers and their families",
              "source": "Company website"
            },
            {
              "label": "Product type",
              "value": "Coverage for health and potentially other financial products",
              "source": "Company website"
            }
          ],
          "edge": "Established expertise and focus specifically on embedded insurance for remittances.",
          "gap": "Potentially higher price point or longer coverage duration for specific products compared to our AED 3 for 30 days offering.",
          "threat": "High"
        },
        {
          "name": "Chubb",
          "metrics": [
            {
              "label": "Market position",
              "value": "Global leader in insurance and reinsurance",
              "source": "Company website"
            },
            {
              "label": "Regional presence",
              "value": "Expertise in UAE/MENA region",
              "source": "Company website"
            },
            {
              "label": "Product range",
              "value": "Property and casualty, accident and health, cyber insurance",
              "source": "Company website"
            }
          ],
          "edge": "Financial strength, underwriting expertise, global reach, and a wide range of insurance products.",
          "gap": "Direct integration into the remittance flow at the point of transaction, micro-duration (30-day) specific coverage at a very low price point.",
          "threat": "Low"
        },
        {
          "name": "Al Ansari Exchange",
          "metrics": [
            {
              "label": "Market share",
              "value": "Significant market share in traditional remittances",
              "source": "Industry reports"
            },
            {
              "label": "Physical presence",
              "value": "Established network of branches in UAE",
              "source": "Company website"
            },
            {
              "label": "Customer base",
              "value": "Large, trusted customer base",
              "source": "Company website"
            }
          ],
          "edge": "Deep-rooted trust, broad customer base that may still prefer traditional channels, established networks.",
          "gap": "Digital integration, speed, ease of use through a single app, embedded value-added services like insurance directly within the transaction flow.",
          "threat": "Medium"
        },
        {
          "name": "Wise (formerly TransferWise)",
          "metrics": [
            {
              "label": "User base",
              "value": "Over 16 million global customers",
              "source": "Wise investor relations"
            },
            {
              "label": "Transaction volume",
              "value": "£120 billion+ FY23",
              "source": "Wise investor relations"
            },
            {
              "label": "Corridors",
              "value": "Extensive global corridors",
              "source": "Wise website"
            }
          ],
          "edge": "Established digital remittance infrastructure, extensive global corridors, and brand recognition in digital remittances.",
          "gap": "The specific offering of 'Remittance Protect' as an integrated, low-cost, short-duration insurance product directly tied to each remittance transaction.",
          "threat": "Medium"
        }
      ]
    },
    "risks": [
      {
        "name": "Regulatory approval delays",
        "category": "Regulatory",
        "severity": "High",
        "mitigation": "Engage legal counsel early, research specific country regulations for each remittance corridor."
      },
      {
        "name": "Integration complexity",
        "category": "Operational",
        "severity": "Medium",
        "mitigation": "Develop clear API documentation and provide dedicated technical support for Botim."
      },
      {
        "name": "Adverse selection",
        "category": "Credit",
        "severity": "Medium",
        "mitigation": "Implement anti-fraud measures and potentially adjust premiums based on risk profiles if data becomes available."
      },
      {
        "name": "Low customer adoption",
        "category": "Market",
        "severity": "Medium",
        "mitigation": "Conduct user surveys and A/B test different product offerings and marketing messages within the Botim app."
      }
    ],
    "kpis": {
      "demandSignal": 0.12,
      "problemSeverity": "Medium",
      "marketClarity": "Partial",
      "speedToMvp": 16
    },
    "timeline": {
      "Evaluation": {
        "start": "2026-05-01",
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
    "createdAt": "2026-06-11T09:53:11.783217+00:00",
    "scoreRationale": "- All four KPIs (demandSignal, problemSeverity, marketClarity, speedToMvp) are PROCEED, indicating a solid foundation.\n- No critical risks identified; while High-severity 'Regulatory approval delays' exists, mitigation is noted.\n- Market analysis shows significant TAM/SAM/SOM, with multiple competitors offering adjacent services, but a clear gap for this specific offering.\n- The 'Low customer adoption' risk mitigation (user surveys, A/B testing) is appropriate for this stage.",
    "initiatives": [
      {
        "id": "init-mq9bpizrfxu",
        "name": "IRA",
        "notes": "- Took to IRA - received feedback to come back with journey artifacts for final compliance approval and to fill in InfoSec form for cybersec approval",
        "subs": [
          {
            "id": "sub-mq9bqp5k5un",
            "name": "IRA meeting - v1",
            "done": true,
            "due": "2026-06-05"
          },
          {
            "id": "sub-mq9brhgl0bz",
            "name": "Journey artifact procurement",
            "done": false,
            "due": "2026-06-25"
          }
        ],
        "artifactIds": [
          "19eb61c5f9378f1"
        ]
      },
      {
        "id": "init-mq9brqavorp",
        "name": "Partnership agreement",
        "notes": "",
        "subs": [
          {
            "id": "sub-mq9bs4ys5n4",
            "name": "Choose and secure fronting insurer",
            "done": false,
            "due": "2026-06-25"
          },
          {
            "id": "sub-mq9bssz4abc",
            "name": "Sign MOU (or other legal docs - non-binding)",
            "done": false,
            "due": null
          }
        ],
        "artifactIds": []
      },
      {
        "id": "init-mq9cixeptbs",
        "name": "Partner selection",
        "notes": "",
        "subs": [
          {
            "id": "sub-mq9cj8rkpqi",
            "name": "Competitive benchmark insurance and reinsurance providers",
            "done": true,
            "due": null
          },
          {
            "id": "sub-mq9cjdissr6",
            "name": "Secure commercial agreement",
            "done": true,
            "due": null
          },
          {
            "id": "sub-mq9cjlo2res",
            "name": "Complete product architecture and pricing",
            "done": true,
            "due": null
          }
        ],
        "artifactIds": []
      }
    ]
  },
  {
    "id": "earned-wage-access",
    "name": "Earned Wage Access",
    "description": "Lets salaried users draw down a portion of wages they have already earned before payday, for a flat fee per withdrawal. Distributed through employer payroll partnerships with WPS integration.",
    "stage": "Pilot",
    "decision": "Prioritise",
    "score": 84,
    "scoreRationale": "- Activation (46%) and retention (44%) both sit in the prioritise band for Pilot.\n- LTV/CAC at 2.4x clears the >2.0x prioritise threshold on near-zero CAC via employer channel.\n- Regulatory risk is real (CBUAE EWA guidance pending) but mitigated by the employer-funded float model.\n- Market is large and competitors are sub-scale locally.",
    "nullHypothesis": "This fails if salaried workers will not pay a flat fee to access earned wages early, or if employers refuse payroll integration.",
    "targetCustomer": "Salaried workers in the UAE earning AED 3,000-12,000/month, paid via WPS, with thin or no credit file — security, hospitality, logistics, and retail staff.",
    "aiSummary": "EWA is the strongest pilot in the portfolio: 46% activation and 44% D30 retention show the product is habit-forming, and the employer channel keeps CAC near zero, putting LTV/CAC at 2.4x. The open question is the CBUAE stance on wage-advance products, which the employer-funded float largely de-risks. Unit economics already clear the Scale bar.\nRecommendation: Prioritise",
    "market": {
      "tam": "USD 2.8 billion",
      "sam": "USD 640 million",
      "som": "USD 45 million",
      "sources": {
        "tam": "GCC EWA + early-wage fintech revenue pool, EY MENA FinTech 2025",
        "sam": "UAE WPS-paid workforce earning under AED 15k/month",
        "som": "3-year obtainable share via top-20 employer partnerships"
      },
      "competitors": [
        {
          "name": "FlexxPay",
          "threat": "Medium",
          "edge": "Established employer integrations in KSA and UAE.",
          "gap": "No consumer super-app distribution; standalone B2B sales motion."
        },
        {
          "name": "Khazna (Egypt)",
          "threat": "Low",
          "edge": "Proven model at scale in Egypt with 500k+ users.",
          "gap": "No UAE presence or WPS integration."
        },
        {
          "name": "Payd",
          "threat": "Medium",
          "edge": "Fast employer onboarding, slick HR-platform plugins.",
          "gap": "Thin balance sheet for float; limited brand trust."
        }
      ]
    },
    "risks": [
      {
        "name": "CBUAE EWA guidance pending",
        "category": "Regulatory",
        "severity": "High",
        "mitigation": "Employer-funded float keeps the product outside lending definitions; legal opinion secured, engaging CBUAE sandbox."
      },
      {
        "name": "Employer concentration",
        "category": "Market",
        "severity": "Medium",
        "mitigation": "Cap any single employer at 20% of advances; pipeline of 14 employers signed."
      },
      {
        "name": "Payroll data accuracy",
        "category": "Operational",
        "severity": "Medium",
        "mitigation": "Daily WPS reconciliation plus a 50% earned-wage drawdown cap."
      }
    ],
    "kpis": {
      "activationRate": 0.46,
      "conversionRate": 0.18,
      "retentionD30": 0.44,
      "ltvCac": 2.4,
      "riskSignals": "Low",
      "operationalLoad": "Medium"
    },
    "timeline": {
      "Evaluation": {
        "start": "2026-01-15",
        "end": "2026-03-31"
      },
      "Pilot": {
        "start": "2026-04-01",
        "end": "2026-09-30"
      },
      "Scale": {
        "start": "2026-10-01",
        "end": null
      }
    },
    "createdAt": "2026-01-15T08:00:00+00:00"
  },
  {
    "id": "expat-wealth",
    "name": "Wealth Management for Expats",
    "description": "Low-minimum diversified investment portfolios (global ETFs plus Shariah-compliant options) for UAE expats, with auto-invest from salary and remittance-linked goal planning.",
    "stage": "Evaluation",
    "decision": "Prioritise",
    "score": 78,
    "scoreRationale": "- Demand signal of 22% from the in-app waitlist test clears the >15% prioritise band.\n- Problem severity High: expats hold idle cash and lack home-market access to investing.\n- Market clarity is well-defined around the 25-45 salaried expat segment.\n- 8-week MVP via a B2B2C brokerage partner sits in the proceed band, not prioritise — the one drag on the score.",
    "nullHypothesis": "This fails if expats will not trust a messaging-first super-app with investment balances above AED 5,000.",
    "targetCustomer": "Salaried expats aged 25-45 earning AED 8,000-35,000/month who remit regularly and hold 2-6 months of idle salary in non-interest accounts.",
    "aiSummary": "A 22% waitlist conversion from a single in-app banner is the strongest demand signal we have measured at Evaluation. The segment is well-defined and underserved: incumbent private banks ignore sub-AED-200k balances and standalone robo-advisors lack distribution. An 8-week MVP through a partner brokerage is achievable. Trust in the brand for investing is the core hypothesis to test in Pilot.\nRecommendation: Prioritise",
    "market": {
      "tam": "USD 38 billion",
      "sam": "USD 5.2 billion",
      "som": "USD 180 million",
      "sources": {
        "tam": "UAE expat investable assets, BCG Global Wealth 2025",
        "sam": "Salaried expats AED 8-35k/month with investable surplus",
        "som": "3-year AUM target at 0.9% fee capture"
      },
      "competitors": [
        {
          "name": "Sarwa",
          "threat": "High",
          "edge": "First-mover UAE robo-advisor with strong brand among western expats.",
          "gap": "CAC-heavy standalone acquisition; weak South Asian segment penetration."
        },
        {
          "name": "StashAway MENA",
          "threat": "Medium",
          "edge": "Mature product and track record from Singapore.",
          "gap": "No local payments or remittance hooks."
        },
        {
          "name": "baraka",
          "threat": "Medium",
          "edge": "Strong GCC brand for single-stock investing.",
          "gap": "Trading-first audience, not goal-based savers."
        }
      ]
    },
    "risks": [
      {
        "name": "SCA licensing scope",
        "category": "Regulatory",
        "severity": "High",
        "mitigation": "Launch under partner brokerage licence; own licence application in parallel."
      },
      {
        "name": "Trust barrier for investing in a messaging app",
        "category": "Market",
        "severity": "Medium",
        "mitigation": "Segregated custody messaging, named custodian, capital-guaranteed entry product."
      },
      {
        "name": "Market downturn at launch",
        "category": "Credit",
        "severity": "Low",
        "mitigation": "Lead with money-market fund so early cohort sees stable returns."
      }
    ],
    "kpis": {
      "demandSignal": 0.22,
      "problemSeverity": "High",
      "marketClarity": "Well-defined",
      "speedToMvp": 8
    },
    "timeline": {
      "Evaluation": {
        "start": "2026-05-01",
        "end": "2026-08-31"
      },
      "Pilot": {
        "start": "2026-09-01",
        "end": null
      },
      "Scale": {
        "start": null,
        "end": null
      }
    },
    "createdAt": "2026-05-01T08:00:00+00:00"
  },
  {
    "id": "retail-crypto",
    "name": "Retail Crypto Trading",
    "description": "In-app buy/sell/hold for major cryptocurrencies (BTC, ETH plus a curated top-10) aimed at retail users, monetised via trading spread.",
    "stage": "Evaluation",
    "decision": "Kill",
    "score": 31,
    "scoreRationale": "- Demand signal 4% sits in the kill band (<5%) — banner and waitlist tests both underperformed.\n- Market clarity is Unclear: heavy overlap with licensed exchanges users already hold.\n- 30-week MVP (VARA licensing path) is past the >26-week kill threshold.\n- Severe regulatory and reputational risk concentration for a low-differentiation product.",
    "nullHypothesis": "This fails if our remittance-first user base has no unmet need for in-app crypto trading versus existing licensed exchanges.",
    "targetCustomer": "Crypto-curious retail users aged 21-40 who have not yet opened an account on a dedicated exchange.",
    "aiSummary": "Both demand tests came back in the kill band: 4% banner conversion against a 5% floor, and qualitative feedback shows users who want crypto already use Binance or local licensed exchanges. The VARA licensing path pushes MVP past 30 weeks, and differentiation versus incumbents is spread pricing only. The bet consumes scarce regulatory capital for a commodity product.\nRecommendation: Kill",
    "market": {
      "tam": "USD 12 billion",
      "sam": "USD 850 million",
      "som": "USD 20 million",
      "sources": {
        "tam": "MENA retail crypto trading revenue, Chainalysis 2025",
        "sam": "UAE retail spread/fee pool",
        "som": "Obtainable share given incumbent exchange dominance"
      },
      "competitors": [
        {
          "name": "Binance FZE",
          "threat": "High",
          "edge": "VARA-licensed, deepest liquidity, default choice for the segment.",
          "gap": "Standalone app outside our ecosystem."
        },
        {
          "name": "M2",
          "threat": "Medium",
          "edge": "UAE-headquartered with local banking rails.",
          "gap": "Smaller coin universe and brand."
        }
      ]
    },
    "risks": [
      {
        "name": "VARA licensing cost and timeline",
        "category": "Regulatory",
        "severity": "High",
        "mitigation": "None viable at acceptable cost — primary kill driver."
      },
      {
        "name": "Reputational spillover to core wallet",
        "category": "Market",
        "severity": "High",
        "mitigation": "Would require separate branding, eroding the distribution advantage."
      },
      {
        "name": "Volatility-driven support load",
        "category": "Operational",
        "severity": "Medium",
        "mitigation": "Not pursued."
      }
    ],
    "kpis": {
      "demandSignal": 0.04,
      "problemSeverity": "Low",
      "marketClarity": "Unclear",
      "speedToMvp": 30
    },
    "timeline": {
      "Evaluation": {
        "start": "2026-02-01",
        "end": "2026-05-31"
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
    "createdAt": "2026-02-01T08:00:00+00:00"
  },
  {
    "id": "merchant-bnpl",
    "name": "Merchant BNPL",
    "description": "Buy-now-pay-later instalments offered at checkout for small online merchants, underwritten in-house and funded off our balance sheet.",
    "stage": "Pilot",
    "decision": "Killed",
    "score": 22,
    "scoreRationale": "- Conversion held at 4% through the pilot, below the 5% kill floor.\n- LTV/CAC of 0.7x is structurally negative after cost of risk; defaults ran 3x the underwriting model.\n- Risk signals High: first-payment default concentrated in two merchant categories.\n- Tabby/Tamara duopoly at checkout left no wedge; killed at the May gate review.",
    "nullHypothesis": "This fails if checkout instalments cannot reach sustainable unit economics against entrenched BNPL incumbents.",
    "targetCustomer": "Small UAE e-commerce merchants (AED 50k-500k monthly GMV) without access to Tabby or Tamara enterprise terms.",
    "aiSummary": "The pilot disproved the thesis: conversion stuck at 4%, first-payment defaults ran three times the model, and LTV/CAC landed at 0.7x with no credible path above 1.0x while funding off our own balance sheet. Tabby and Tamara already own checkout intent for the merchants we targeted. Killed at the May 2026 gate review; underwriting learnings carry over to SME lending.\nRecommendation: Kill",
    "market": {
      "tam": "USD 6.5 billion",
      "sam": "USD 900 million",
      "som": "USD 30 million",
      "sources": {
        "tam": "GCC BNPL GMV, Redseer 2025",
        "sam": "UAE long-tail merchant GMV outside incumbent enterprise deals",
        "som": "Obtainable GMV share at pilot take rates"
      },
      "competitors": [
        {
          "name": "Tabby",
          "threat": "High",
          "edge": "Category-defining brand, USD 1B+ valuation, enterprise merchant lock-in.",
          "gap": "Thin coverage of long-tail merchants — the gap we tested and found uneconomic."
        },
        {
          "name": "Tamara",
          "threat": "High",
          "edge": "KSA scale and deep checkout integrations.",
          "gap": "Limited UAE long-tail focus."
        }
      ]
    },
    "risks": [
      {
        "name": "Credit losses above model",
        "category": "Credit",
        "severity": "High",
        "mitigation": "Realised — 3x modelled first-payment default; primary kill driver."
      },
      {
        "name": "Balance-sheet funding cost",
        "category": "Credit",
        "severity": "High",
        "mitigation": "No off-balance-sheet partner secured at viable economics."
      },
      {
        "name": "Checkout integration support load",
        "category": "Operational",
        "severity": "Medium",
        "mitigation": "Sunset complete; integrations decommissioned June 2026."
      }
    ],
    "kpis": {
      "activationRate": 0.17,
      "conversionRate": 0.04,
      "retentionD30": 0.21,
      "ltvCac": 0.7,
      "riskSignals": "High",
      "operationalLoad": "High"
    },
    "timeline": {
      "Evaluation": {
        "start": "2025-11-01",
        "end": "2026-01-31"
      },
      "Pilot": {
        "start": "2026-02-01",
        "end": "2026-05-15"
      },
      "Scale": {
        "start": null,
        "end": null
      }
    },
    "createdAt": "2025-11-01T08:00:00+00:00"
  },
  {
    "id": "remit-dynamic-pricing",
    "name": "Remittance Dynamic Pricing",
    "description": "A corridor-level pricing engine that sets remittance fees and FX margins dynamically — by corridor, transfer size, time-to-payday, and competitor rates — instead of a static rate card. Optimises for contribution margin on price-insensitive flows and volume share on contested corridors.",
    "stage": "Scale",
    "decision": "Proceed",
    "score": 66,
    "scoreRationale": "- LTV/CAC of 2.1x sits mid proceed band for Scale (1.5-2.5x); pricing uplift accrues to existing users so CAC is near zero.\n- Contribution margin approaching breakeven: +38bps blended margin uplift in optimised corridors vs control.\n- Payback at 11 months (engine build + data costs) is inside the 9-18 month proceed band.\n- Regulatory readiness Partial: fee-transparency disclosure format pending CBUAE confirmation in two corridors.\n- Operational scalability needs optimisation — repricing is daily-batch, not yet real-time.",
    "nullHypothesis": "This fails if dynamic pricing triggers enough price-comparison churn on contested corridors to wipe out the margin gains from price-insensitive flows.",
    "targetCustomer": "Existing remittance users across the India, Pakistan, Philippines, and Egypt corridors — segmented by price sensitivity: payday-driven urgent senders (inelastic) vs rate-shoppers (elastic).",
    "aiSummary": "Dynamic pricing has scaled across our four largest corridors and is the highest-leverage margin initiative in the portfolio: +38bps blended margin in optimised corridors with churn within guardrails. Economics are sound but not exceptional yet — 2.1x LTV/CAC and an 11-month payback on the engine investment, with contribution margin approaching breakeven as data costs amortise. The CBUAE fee-disclosure format and moving from daily-batch to real-time repricing are the open items. Continue scaling with corridor-level churn guardrails.\nRecommendation: Proceed",
    "market": {
      "tam": "USD 9.4 billion",
      "sam": "USD 1.8 billion",
      "som": "USD 140 million",
      "sources": {
        "tam": "UAE outbound remittance revenue pool, World Bank 2025",
        "sam": "Revenue pool across our four live corridors",
        "som": "3-year incremental margin capture at +30-40bps blended uplift"
      },
      "competitors": [
        {
          "name": "Wise",
          "threat": "High",
          "edge": "Transparent mid-market-rate brand that punishes opaque pricing; sets the reference price for rate-shoppers.",
          "gap": "Premium positioning leaves the cash-adjacent, payday-urgent segment unserved."
        },
        {
          "name": "e& money",
          "threat": "High",
          "edge": "Telecom distribution and aggressive static promo pricing on contested corridors.",
          "gap": "No pricing engine — corridor-wide promos burn margin on inelastic flows."
        },
        {
          "name": "Lulu Exchange",
          "threat": "Medium",
          "edge": "Branch network trusted by cash-first remitters; negotiated bulk FX rates.",
          "gap": "Static rate card, no digital personalisation."
        }
      ]
    },
    "risks": [
      {
        "name": "Fee-transparency rules on personalised pricing",
        "category": "Regulatory",
        "severity": "High",
        "mitigation": "All-in price shown pre-confirmation in every flow; disclosure format under review with CBUAE; engine constrained to corridor/time-based — not individual — pricing in sensitive markets."
      },
      {
        "name": "Price-comparison churn on contested corridors",
        "category": "Market",
        "severity": "Medium",
        "mitigation": "Corridor-level churn guardrails auto-revert to rate card if weekly churn exceeds 1.5x control; Wise-indexed price floor on rate-shopper segments."
      },
      {
        "name": "Perceived unfairness / social media backlash",
        "category": "Market",
        "severity": "Medium",
        "mitigation": "No same-user price discrimination; pricing varies by corridor, size, and time only — defensible as cost-based."
      },
      {
        "name": "FX volatility breaking margin models",
        "category": "Credit",
        "severity": "Medium",
        "mitigation": "Engine reprices daily against hedged corridor positions; kill-switch to static card during volatility spikes."
      }
    ],
    "kpis": {
      "ltvCac": 2.1,
      "contributionMargin": "Approaching breakeven",
      "paybackMonths": 11,
      "riskScalability": "Stabilising",
      "regulatoryReadiness": "Partial",
      "operationalScalability": "Needs optimisation",
      "strategicFit": "Strong"
    },
    "timeline": {
      "Evaluation": {
        "start": "2025-10-01",
        "end": "2025-12-31"
      },
      "Pilot": {
        "start": "2026-01-01",
        "end": "2026-04-30"
      },
      "Scale": {
        "start": "2026-05-01",
        "end": "2026-12-31"
      }
    },
    "createdAt": "2025-10-01T08:00:00+00:00"
  }
]
