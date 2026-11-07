<div align="center">

<img src="04_APPLICATION/web/public/icons/icon-192.png" alt="VAAKYA logo" width="88" />

# VAAKYA — AI Financial Guardian

**Money decisions, with a guardian by your side.**

Four AI agents help people learn about money, plan savings, stay safe from scams and find the government schemes they qualify for — in English, हिन्दी, मराठी and ಕನ್ನಡ, by voice or text.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_18-4169E1?logo=postgresql&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-4581C3?logo=neo4j&logoColor=white)
![Keycloak](https://img.shields.io/badge/Keycloak-4D4D4D?logo=keycloak&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)
![Open source](https://img.shields.io/badge/100%25-free_%26_open_source-2ea44f)

Built for the **Nomura KakushIN Hackathon** by Team INVINCIBLES (SVKM's NMIMS MPSTME).

<img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/desktop/01-landing.png" alt="VAAKYA landing page" width="900" />

</div>

---

## Table of contents

- [Why VAAKYA](#why-vaakya)
- [Screenshots](#screenshots)
- [The four agents](#the-four-agents)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Repository layout](#repository-layout)
- [Project status](#project-status)
- [Team](#team)

## Why VAAKYA

Millions of first-time savers in India face the same problems: financial products they don't understand, incomes that change every month, a flood of scam messages and government schemes they never hear about. VAAKYA is designed around four real personas:

| Persona | Who they are | What VAAKYA does for them |
|---|---|---|
| **Priya** | A teacher comparing the products she is sold | Explains products in plain words, with sources |
| **Rajesh** | A gig worker whose income changes every month | Builds savings plans that flex with income |
| **Kisan** | A farmer planning around harvests | Finds farm schemes and explains eligibility |
| **Divya** | A writer who uses a screen reader | Fully accessible: high contrast, large text, voice |

## Screenshots

> All screenshots below are real captures of the running application (Playwright, `e2e/screenshots.spec.ts`), including the live stack with real Keycloak sign-in.

### Dashboard

<p align="center">
  <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/01-dashboard-live.png" alt="Dashboard with Confidence Score, savings, goals and agent activity" width="820" />
</p>

### Core features

| Ask VAAKYA (AI assistant) | Scam Shield |
|:---:|:---:|
| <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/02-assistant-live.png" alt="AI assistant" width="420" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/03-scam-shield-live-ocr.png" alt="Scam Shield with OCR" width="420" /> |
| **Government schemes** | **Financial planning** |
| <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/04-schemes-live.png" alt="Schemes" width="420" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/05-planning-live.png" alt="Planning" width="420" /> |
| **Financial Life Graph** | **Lesson + quiz** |
| <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/06-life-graph-live.png" alt="Life graph" width="420" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/07-lesson-quiz-live.png" alt="Lesson and quiz" width="420" /> |
| **Confidence Score** | **Monthly review** |
| <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/08-score-live.png" alt="Confidence score" width="420" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/11-monthly-review-live.png" alt="Monthly review" width="420" /> |

### Onboarding

| Sign in | Consent | Choose a persona | Profile |
|:---:|:---:|:---:|:---:|
| <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/desktop/02-login.png" alt="Login" width="200" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/desktop/04-onboarding-consent.png" alt="Consent" width="200" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/desktop/05-persona-selection.png" alt="Persona" width="200" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/desktop/06-onboarding-profile.png" alt="Profile" width="200" /> |

### Mobile, accessibility and themes

| Mobile dashboard | Voice (mobile) | Dark mode | High contrast + large text |
|:---:|:---:|:---:|:---:|
| <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/mobile/07-dashboard.png" alt="Mobile dashboard" width="190" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/09-voice-live-mobile.png" alt="Voice on mobile" width="190" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/variants/dashboard-dark-rajesh.png" alt="Dark mode" width="190" /> | <img src="07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/variants/score-high-contrast-large-text-divya.png" alt="High contrast" width="190" /> |

More than 70 screenshots (desktop, tablet, mobile, live and theme variants) are in [`07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND`](07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND).

## The four agents

A LangGraph orchestrator routes each request to a specialised agent. Money calculations and scheme eligibility are done by **tested code, not guessed by AI**.

| Agent | Role | Example question |
|---|---|---|
| 📘 **Educator** | Explains money topics in simple words, with citations from trusted sources | "Is a ULIP the same as insurance?" |
| 🧭 **Strategy Builder** | Builds savings plans and goal roadmaps from the user's own numbers | "I earn ₹15,000 to ₹40,000. How do I save?" |
| 🛡️ **Sentinel** | Checks messages, offers and screenshots (OCR) for scam signals | "Is this loan app safe?" |
| 🏛️ **Connector** | Finds government schemes and explains eligibility and steps | "Which farm schemes can I get?" |

## Features

- **Financial Confidence Score** — a 0–100 score across six dimensions (literacy, scam awareness, savings behaviour, goal progress, scheme awareness, debt awareness) with explained recommendations
- **Scam Shield** — paste a message or upload a screenshot; OCR + rules flag OTP requests, fake prizes, instant-loan traps
- **Goals and planning** — savings plans, goal tracking and monthly reviews
- **Financial Life Graph** — a Neo4j graph of the user's income, goals, schemes and risks
- **Learning** — short lessons with quizzes
- **Voice** — speech input and spoken answers in four languages
- **Documents** — encrypted uploads with OCR review
- **Privacy first** — 10 Indian identifier types (Aadhaar, PAN, …) are redacted before any reasoning model sees the text; Row Level Security in PostgreSQL; consent checks
- **Accessible** — WCAG 2.2 AA checked with axe, light/dark/high-contrast themes, text scaling, reduced motion, low-literacy mode
- **Installable PWA** with an offline page
- **Preview mode** — try the whole app with four synthetic personas, no account needed

## Architecture

```
 Browser (Next.js 16 PWA) ──► Next.js BFF (OIDC + PKCE, CSRF, CSP)
                                   │
                                   ▼
                     FastAPI  (~50 endpoints, rate limits, metrics)
                     └─ LangGraph orchestrator
                        ├─ Educator   ├─ Strategy Builder
                        ├─ Sentinel   └─ Connector
            ┌─────────────┬──────────────┬──────────────┬──────────────┐
            ▼             ▼              ▼              ▼              ▼
       PostgreSQL 18    Neo4j        Qdrant        SeaweedFS     Inference service
       (RLS, system   (Life Graph)  (knowledge    (encrypted     (Tesseract OCR,
        of record)                    base)        documents)     eSpeak NG TTS)
                                   Keycloak 26 (identity) · Caddy (TLS)
```

Full architecture (10 documents, 29 diagrams): [`02_ARCHITECTURE/`](02_ARCHITECTURE).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, lucide-react |
| Auth | Keycloak 26 — OIDC + PKCE through a server-side BFF |
| API | Python 3.13, FastAPI, SQLAlchemy 2 + Alembic, LangGraph |
| Data | PostgreSQL 18, Neo4j 5, Qdrant, SeaweedFS (S3) |
| AI / ML | Tesseract OCR (eng/hin/mar/kan), eSpeak NG, faster-whisper (planned), IndicTrans2 (planned) |
| Ops | Docker Compose, Caddy, Prometheus, Grafana, encrypted backups |
| Testing | Vitest, Playwright + axe, pytest |

## Getting started

### Quick preview (web only, sample data)

```bash
cd 04_APPLICATION/web
npm ci
npm run build && npx next start   # http://localhost:3000
```

Open `/login` and pick one of the four personas. Every screen is labelled "Sample data" and nothing is saved.

### Full stack (Docker Compose)

```bash
cd 04_APPLICATION/infra
./init-secrets.sh                 # generates local secrets
docker compose up -d --build      # postgres, keycloak, neo4j, qdrant, seaweedfs, inference, api, worker, web
```

See [`04_APPLICATION/api/README.md`](04_APPLICATION/api/README.md), [`04_APPLICATION/web/README.md`](04_APPLICATION/web/README.md) and [`06_DOCUMENTATION/OPERATIONS.md`](06_DOCUMENTATION/OPERATIONS.md) for configuration and production deployment.

## Testing

| Suite | Result |
|---|---|
| API unit + integration (real PostgreSQL, Neo4j, SeaweedFS, Qdrant) | 156 passed |
| Inference service (real Tesseract and eSpeak NG) | 10 passed |
| Web unit (Vitest) | 26 passed |
| Web E2E (Playwright + axe WCAG 2.2 AA, 360/768 px, keyboard, CSP, CSRF) | 29 passed |
| Live E2E through real Keycloak on the full Docker stack | 8 journeys passed |

```bash
cd 04_APPLICATION/web && npm test && npx playwright test
cd 04_APPLICATION/api && uv run pytest
```

## Repository layout

```
00_PROJECT_MANAGEMENT/      plans, status, decisions, feature tracker
01_REQUIREMENTS/            159 functional + 49 non-functional requirements
02_ARCHITECTURE/            architecture documents and diagrams
03_DESIGN/                  UX and design system
04_APPLICATION/             web/ · api/ · inference/ · infra/
05_TESTING/                 test plans, results and audits
06_DOCUMENTATION/           operations, database schema, confidence score
07_HACKATHON_DELIVERABLES/  product screenshots
08_HANDOVER/                work summary and handover notes
NOMURA/                     original hackathon submission (slides, diagrams)
```

## Project status

The application runs end to end on a local Docker stack. Language models have not yet been connected: agents currently answer with deterministic, tested rules and are clearly labelled when no LLM was used. Scheme facts and translations are drafts awaiting human review. See [`08_HANDOVER/WORK_SUMMARY.md`](08_HANDOVER/WORK_SUMMARY.md) for an honest list of what is done, what is limited and what remains.

> VAAKYA gives educational guidance, not regulated financial advice.

## Team

**Team INVINCIBLES** — SVKM's NMIMS MPSTME

- **Sanket Mali** — [@Sanket1516](https://github.com/Sanket1516)


