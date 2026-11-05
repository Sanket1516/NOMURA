# Persona Analysis

**Last updated:** 2026-11-05

The problem statement PDF is the source of record for persona facts. Deck and mockup details that differ are listed under each persona and recorded as C-018 in `DECISIONS_LOG.md`.

Need IDs (`PN-*`) trace to requirements in `FUNCTIONAL_REQUIREMENTS.md`.

## Summary

| | Priya | Rajesh | Kisan | Divya |
|---|---|---|---|---|
| Age | 32 | 24 | 45 | 28 |
| Role | School teacher | Gig worker (food delivery, freelancing) | Farmer, 3 acres | Content writer, works from home; visual impairment |
| Location | Thane | Mumbai | Rural Karnataka | Pune |
| Income | ₹35,000/month | ₹15,000-40,000/month, variable | Seasonal, weather-dependent | ₹25,000/month |
| Language | Marathi | Not stated | Kannada | Not stated |
| Pattern | Salaried, regular | Irregular | Seasonal | Salaried, regular |
| Main barrier | Jargon and mis-selling | No fit-for-income advice | Complex processes, no one to ask | Inaccessible tools |
| Trust threat | WhatsApp "investment tips" | Instant loan apps | Informal lenders, middlemen | Reliance on family compromises privacy |

---

## Priya

**Source facts:** A 32-year-old school teacher in Thane earning ₹35,000 monthly. Wants to save for her daughter's education and plan for retirement, but feels overwhelmed by jargon. Every bank visit, she is sold products she doesn't understand, from ULIPs to complex mutual funds. Articles she tried were too technical or not relevant to her income. Her WhatsApp is flooded with "investment tips" from unknown sources.

She dreams of a trusted advisor who understands her goals, speaks Marathi and explains concepts simply. She decides based on fear or peer pressure, has missed employer benefits, paid unnecessary charges, and struggles to track where her money goes.

| Need ID | Need |
|---|---|
| PN-PRI-1 | Simple explanations from a trusted guide in Marathi |
| PN-PRI-2 | Save for daughter's education, plan for retirement |
| PN-PRI-3 | Understand products she is sold |
| PN-PRI-4 | Separate legitimate advice from WhatsApp tips |
| PN-PRI-5 | Education tailored to life stage and income |
| PN-PRI-6 | Stop missing employer benefits |
| PN-PRI-7 | Avoid unnecessary charges, see where money goes |

**Promised outcome [ES 2.2]:** Gains confidence to evaluate investment and insurance products before making financial commitments.

**Primary journey:** Marathi onboarding, Goal Studio for education and retirement, product evaluation with the Educator, scam check of a WhatsApp tip.

**Deck differences:** Mockups use ₹50,000 income, age 24 in UI-12, and the name Priya Sharma with Hindi in the data slide sample. Problem statement values apply.

**Design note [ER]:** Priya does not need an app that tells her what to buy. She needs a way to question a seller with confidence.

---

## Rajesh

**Source facts:** A 24-year-old gig worker in Mumbai earning variable income through food delivery and freelancing, fluctuating between ₹15,000 and ₹40,000 monthly, making traditional budgeting impossible. No emergency fund, no health insurance, and often falls prey to instant loan apps with predatory interest rates.

Bank advisors tell him to "come back when you have ₹5 lakhs to invest." YouTube advice seems designed for salaried professionals. He needs guidance on irregular cash flow, small emergency savings and avoiding debt traps, in bite-sized, practical steps that fit his chaotic schedule.

| Need ID | Need |
|---|---|
| PN-RAJ-1 | Manage irregular cash flow |
| PN-RAJ-2 | Build small emergency savings |
| PN-RAJ-3 | Address missing health insurance |
| PN-RAJ-4 | Avoid instant loan apps and debt traps |
| PN-RAJ-5 | Bite-sized, practical steps |
| PN-RAJ-6 | Guidance without minimum-wealth gatekeeping or salaried assumptions |

**Promised outcome [ES 2.2]:** Builds long-term savings discipline and financial resilience despite variable income.

**Primary journey:** Income-range onboarding, starter emergency fund plan with lean-month floor, loan offer check with Sentinel.

**Deck differences:** Slide 6 shows ₹10,000, ₹25,000 and ₹15,000 months. Problem statement range applies.

**Design note [ER]:** Every savings calculation must handle a ₹15,000 month. Fixed monthly targets, as shown in UI-03, would fail him. His language is unstated, so Hindi or English are plausible, but neither is a source fact.

---

## Kisan

**Source facts:** A 45-year-old farmer in rural Karnataka cultivating 3 acres. Income is seasonal and weather-dependent, creating massive cash flow challenges. He takes informal loans at high interest during sowing season and often loses money to middlemen when selling produce. He has heard of PM-KISAN, crop insurance and Kisan Credit Cards but finds application processes confusing and intimidating.

He struggles with basic planning: when to save, how much to set aside for next season, whether to invest in better equipment or save for his children's education. He has questions about market prices, minimum support prices and protection from crop failure, with no one to ask. Most services aren't designed for agricultural income patterns, and information in Kannada relevant to his farming context is hard to access.

| Need ID | Need |
|---|---|
| PN-KIS-1 | Handle seasonal, weather-dependent income |
| PN-KIS-2 | Reduce informal loans and middleman losses |
| PN-KIS-3 | Understand and apply for PM-KISAN, crop insurance, KCC |
| PN-KIS-4 | Know when to save and how much for next season |
| PN-KIS-5 | Weigh equipment against children's education |
| PN-KIS-6 | Market prices, MSP, crop failure protection |
| PN-KIS-7 | Kannada content relevant to farming |

**Promised outcome [ES 2.2]:** **Missing.** The Kisan cell duplicates Rajesh's text (C-030). Deck slide 6 frames it as scheme awareness and crop and income protection.

**Primary journey:** Kannada voice onboarding, scheme eligibility, application steps, seasonal plan.

**Deck differences:** Slide 6 adds PMFBY, PMSBY and Atal Pension Yojana.

**Design note [ER]:** He is the hardest test of the product. He needs Kannada speech in both directions, the UI mock has no Kannada, and open-source Kannada speech output is unproven. Land records (7/12) are specific to Maharashtra in the deck's usage; Karnataka uses a different record, RTC/Pahani, so verify this before claiming support. Live market prices have no data source, so the plan gives educational answers only.

---

## Divya

**Source facts:** A 28-year-old person with visual impairment working as a content writer from home in Pune. She earns ₹25,000 monthly but faces unique challenges managing her finances. Most banking apps aren't screen-reader friendly, making even basic transactions stressful. She wants to learn about tax-saving instruments, understand her EPF statements and start investing, but financial literacy content is rarely accessible.

Divya relies on family members for complex tasks, which compromises her independence and privacy. She wishes for financial tools that understand her needs: voice-based interactions, accessible interfaces, and guidance that doesn't assume she can see charts and graphs. She's eligible for government schemes for persons with disabilities but doesn't know how to access them or manage the benefits.

| Need ID | Need |
|---|---|
| PN-DIV-1 | Voice-based interaction |
| PN-DIV-2 | Screen-reader friendly, accessible interfaces |
| PN-DIV-3 | No assumption that she can see charts |
| PN-DIV-4 | Learn about tax-saving instruments |
| PN-DIV-5 | Understand EPF statements |
| PN-DIV-6 | Start investing |
| PN-DIV-7 | Independence and privacy |
| PN-DIV-8 | Access and manage disability schemes |

**Promised outcome [ES 2.2]:** Receives fully accessible financial guidance and personalized benefit discovery without accessibility barriers.

**Primary journey:** Entire product with display off, using TalkBack or NVDA plus voice.

**Deck differences:** UI-01 depicts this persona as a man with a white cane. The persona card on slide 6 and the problem statement describe a woman.

**Design note [ER]:** The mockups are visually dense: gauges, rings and pie charts. Screen-reader support means a separate information design for those elements, and an `aria-label` is not enough. Her privacy need is also a voice problem, because speaking financial data aloud can expose it. She should be able to choose a screen reader with keyboard input instead of open voice.

---

## Cross-persona requirements

| Theme | Priya | Rajesh | Kisan | Divya | Requirements |
|---|---|---|---|---|---|
| Language | Marathi | Unstated | Kannada | Unstated | FR-LNG-01, FR-LNG-02, FR-VOI-07 |
| Income model | Fixed | Variable | Seasonal | Fixed | FR-ONB-06, FR-STR-06, FR-STR-07 |
| Scam exposure | Tips | Loan apps | Informal lenders | General | FR-SEN-02, FR-SEN-08, FR-SEN-09 |
| Schemes | Insurance, pension | Health, insurance | Agriculture | Disability | FR-CON-01, FR-CON-08, FR-CON-09 |
| Access | Touch | Touch, short sessions | Voice, low literacy likely | Screen reader, voice | FR-A11-03, FR-LNG-04, FR-VOI-03 |
| Trust barrier | Sellers | Advisors dismiss him | Intimidating processes | Dependence | FR-SAF-04, FR-CON-03, FR-A11-04 |

## Persona test coverage

Each persona is a seeded test user and an end-to-end acceptance scenario, AC-P1 to AC-P4 in `ACCEPTANCE_CRITERIA.md`.

Recruit real testers if possible, especially a screen-reader user. A sighted developer simulating Divya will miss real problems.
