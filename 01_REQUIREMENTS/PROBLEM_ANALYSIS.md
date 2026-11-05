# Problem Analysis

**Last updated:** 2026-11-05

**Sources:** `NOMURA/INVINCIBLES/KakushIN Problem Statement_.pdf` (read visually, as the pages are images) and the team's Executive Summary. Items are labelled by origin. Nothing here is invented.

## 1. Challenge metadata

| Field | Value |
|---|---|
| Organiser | Nomura Services, India, Early Careers |
| Event | Coding Contest, KakushIN |
| Theme | Financial Literacy & Agentic AI Hackathon |
| Problem titles in the PDF | "ArthSaathi - Your Digital Financial Companion" and "Financial Guardians - AI Agents for Financial Empowerment" |
| Team's round status | Executive Summary is labelled Round 1, June 2026 |

## 2. Complete problem statement [Source: PS]

**The challenge, verbatim:**

> Your challenge is to develop an **Agentic AI-powered solution** that democratizes financial literacy and empowers individuals across diverse economic backgrounds, abilities, and contexts to make informed financial decisions.

**Context:**

- Financial literacy "remains the missing link between opportunity and prosperity".
- "The gap between financial access and financial understanding has never been wider."
- People struggle with credit scores, retirement planning, distinguishing insurance products, and avoiding predatory lending.
- Educators, NGOs and community workers are already fighting financial illiteracy, "but they can't scale their impact alone".
- The vision: "each person had a personal financial guide - available 24/7, speaking their language, understanding their context, and proactively helping them make better money decisions."

The PDF's closing line of guidance is: "We're looking for innovative thinking, not checkbox implementations."

## 3. Broad questions to explore [Source: PS]

| ID | Question |
|---|---|
| PS-Q1 | How might AI agents adapt to vastly different user contexts (income patterns, literacy levels, abilities, languages, life situations) to provide relevant financial guidance? |
| PS-Q2 | What innovative approaches can make financial literacy accessible to underserved populations who are often excluded from traditional financial education? |
| PS-Q3 | How can technology bridge the gap between financial access and financial understanding in a scalable, sustainable way? |
| PS-Q4 | What role can AI play in building trust and confidence in financial decision-making for vulnerable populations? |
| PS-Q5 | How do we ensure that AI solutions are inclusive, accessible, and work across different abilities, languages, and technological constraints? |
| PS-Q6 | What mechanisms can drive sustained engagement with financial learning and encourage positive behavioral change? |
| PS-Q7 | How might we measure real-world impact and ensure solutions create tangible improvements in people's financial well-being? |

## 4. Possible expected outcomes [Source: PS]

**Status of this list, verbatim:** "The following are illustrative guidelines, not requirements. We encourage you to think creatively and propose innovative solutions that may go beyond or differ from these suggestions."

| ID | Group | Consideration |
|---|---|---|
| PS-A1 | Accessibility & Inclusion | Consider diverse user groups, including varying literacy levels, languages, physical abilities, and technological access |
| PS-A2 | Accessibility & Inclusion | Consider voice-first, text-based, visual, or multimodal approaches based on user needs |
| PS-A3 | Accessibility & Inclusion | Think about offline capabilities for low-connectivity areas |
| PS-U1 | User Experience | Make financial literacy engaging and not overwhelming |
| PS-U2 | User Experience | Build trust with users who may be skeptical of technology or financial institutions |
| PS-U3 | User Experience | Personalize experiences to individual contexts and needs |
| PS-I1 | Impact & Sustainability | Track whether users are actually improving their financial decision-making |
| PS-I2 | Impact & Sustainability | Encourage long-term usage rather than one-time interactions |
| PS-I3 | Impact & Sustainability | Scale to reach millions while maintaining quality |
| PS-R1 | Responsible AI | Ensure transparency about AI capabilities and limitations |
| PS-R2 | Responsible AI | Safeguards to protect vulnerable users from manipulation or harmful advice |
| PS-R3 | Responsible AI | Handle sensitive financial data responsibly |
| PS-R4 | Responsible AI | Mechanisms for human oversight or escalation |
| PS-T1 | Technical Innovation | Creative uses of Agentic AI, multi-agent systems, or other emerging technologies |
| PS-T2 | Technical Innovation | Integration possibilities with existing financial ecosystems |
| PS-T3 | Technical Innovation | Novel interaction paradigms beyond traditional chatbots |

### Areas you might explore, "not exhaustive"

| ID | Area |
|---|---|
| PS-E1 | Personalized financial education and guidance systems |
| PS-E2 | Fraud prevention and scam awareness tools |
| PS-E3 | Tools for managing irregular or seasonal incomes |
| PS-E4 | Accessible financial interfaces for persons with disabilities |
| PS-E5 | Multilingual and culturally-relevant content generation |
| PS-E6 | Behavioral change mechanisms (gamification, nudges, social support) |
| PS-E7 | Impact measurement and outcome tracking |
| PS-E8 | Tools for educators/NGOs to scale their reach |
| PS-E9 | Financial planning for specific contexts (agriculture, gig economy, retirement, etc.) |

## 5. What the problem statement does not contain

The brief asked for evaluation expectations and constraints. Reported honestly:

| Item | Finding |
|---|---|
| Evaluation criteria or rubric | **Not specified** |
| Submission format or deliverables | **Not specified** |
| Dates, schedule, round structure | **Not specified** |
| Mandatory technologies, LLMs or platforms | **Not specified** |
| Team size or eligibility rules | **Not specified** |
| Hard constraints | Only that the solution be **Agentic AI-powered**. All other items are illustrative. |
| Mandatory features | **None.** Personas are background, and outcomes are guidelines. |

**Implication:** this project's requirements are almost all commitments from the Executive Summary and deck. The problem statement sets direction, and the project sets the scope. The hackathon is now complete, so evaluation criteria no longer apply (Q1 in `DECISIONS_LOG.md`).

## 6. Team's analysis [Source: Executive Summary, deck]

**Paradox:** financial services are becoming smarter, but financial decision-making remains difficult.

**Common pattern:** all four personas meet the same challenge at critical moments: evaluating opportunities, assessing risks, understanding consequences and taking informed action.

**Key insight:** "India's next financial inclusion challenge is not access to financial services - it is access to financial confidence."

**Pain points [deck s5]:**

1. Financial information exists, but is not understandable
2. No personalized financial guidance
3. Financial scams are growing rapidly
4. Government schemes are hard to discover
5. Financial apps are not accessible
6. Financial guidance is reactive
7. Nobody measures financial improvement

**The gap [deck s3]:** "The challenge is not a lack of information, but the lack of trusted, contextual, accessible, and proactive guidance."

## 7. Statistics cited by the team [Source: deck s4, s7]

**Not independently verified.** Check each one against its primary source before it is reused.

| Claim | Team's cited source |
|---|---|
| 27% of Indians are financially literate | NCFE Financial Literacy & Inclusion Survey |
| Digital fraud rate 7.1% versus global 3.8% | BioCatch via Economic Times |
| Over ₹52,976 crore lost to cyber fraud in six years | Ministry of Home Affairs via Livemint |
| Cyber fraud cases rose more than 4x in a single year | Reuters citing government data |
| Over 94 crore beneficiaries under welfare schemes | Press Information Bureau |
| Over 900 million internet users expected | IAMAI and Kantar |
| TAM 730M, SAM 280M, SOM 1M in three years | **No source given** |
| Competitor table: Jupiter, Fi Money, BankSathi, Gramcover | **No source given** |

## 8. Team's stated assumptions [Source: deck s8]

| Area | Assumption | Planning note |
|---|---|---|
| User | Users have a smartphone with internet | Conflicts with offline ambitions (C-020) |
| User | Users can upload documents or answer guided questions | Supported by two paths |
| User | Users consent to secure storage and processing | FR-ONB-04 |
| User | Users periodically review recommendations | Monthly coach |
| Data | Uploaded documents contain sufficient information | Questionnaire backfills |
| Data | OCR accuracy is acceptable for supported formats | Must be measured |
| Data | Scheme data remains available through public sources | Curated offline copy planned |
| AI | Recommendations remain educational and advisory | D-017 |
| AI | Users retain final decision-making authority | FR-SAF-02 |
| AI | AI-generated learning content is reviewed for accuracy | FR-EDU-07 |
| AI | "We think KakushIN LLM based on Claude 4 supports the understanding of many Indian languages" | No longer relevant. KakushIN LLM is not used (D-002). |
| Accessibility | Voice supports low-literacy users | Validate with users if possible |
| Accessibility | Regional language support increases adoption | Not measurable at a hackathon |

## 9. Business context [Source: deck s26]

Future opportunities only, not build scope: government partnerships, bank white-label, product referrals. Stated principle: "Recommendations remain suitability-based and user-first. Revenue never influences advice."

## 10. Engineering assessment [ER]

| Question | Assessment |
|---|---|
| Best-covered areas | PS-Q1, PS-E1, PS-E2, PS-E3, PS-E5, PS-E9 |
| Weakest areas | PS-R4 human oversight, which has no source design. PS-E8 NGO tools, absent from the team's documents. PS-A3 offline, claimed but not designed. |
| Biggest credibility risk | Claims in the hackathon documents that the build may not deliver: on-device processing, IVR, offline packs, real-time scam detection. |
| Strongest differentiators, if real | Scam check that explains itself; eligibility that shows its reasoning; a plan for irregular income; a complete voice-and-screen-reader journey; measured impact. |
