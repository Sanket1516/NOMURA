# Step 1 Results: Frontend

**Date:** 2026-11-05 | **Code:** `04_APPLICATION/web/` | **Screenshots:** `07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/` (58 PNG: 18 screens × desktop 1440, tablet 834, mobile 390, plus 4 variants)
**Environment:** Linux container, Node 22.23.4, Chromium 1243 via Playwright 1.63.0. No backend running.

## Verdict

The 17 requested screens (plus about-AI and offline) build, render and pass automated accessibility checks. **Every screen that needs the backend runs on clearly labelled sample data or shows an honest "not connected" state.** No AI response is faked.

## Tests

| # | Test | Result |
|---|---|---|
| 1 | `next build` (Next.js 16.4.5, TypeScript 7.0.2 strict type check) | PASS, 27 routes |
| 2 | `tsc --noEmit` | PASS |
| 3 | Vitest: lakh/crore formatting, spoken rupees, SSE parser, demo data arithmetic for 4 personas | PASS, 19/19 |
| 4 | Playwright: public pages render, axe WCAG 2.0/2.1/2.2 A+AA, 0 serious or critical | PASS |
| 5 | App routes redirect to login without a session | PASS |
| 6 | Preview: all 12 app pages render with the "Preview with sample data" banner and pass axe | PASS |
| 7 | Onboarding: consent requires the AI item, persona template prefills, validation messages, focus moves to step heading, "not saved" notice | PASS |
| 8 | Assistant in preview: question returns "Not answered" + "AI agents are not connected" (no fabricated answer) | PASS |
| 9 | Scam Shield: text check reports preview honestly; upload button disabled until a valid file | PASS |
| 10 | Accessibility settings: 150 % text, high contrast, reduced motion apply, persist across pages; axe passes in that mode | PASS |
| 11 | Keyboard: first Tab is "Skip to main content" and moves to `#main` | PASS |
| 12 | Charts: score figcaption text equivalent and data table | PASS |
| 13 | PWA: manifest (standalone, 192/512 icons), service worker and icons served | PASS |
| 14 | BFF proxy: 401 without session, 503 "Preview mode" in preview | PASS |
| 15 | No horizontal scroll at 360 px on all 19 routes | PASS (found and fixed 3 overflow bugs) |
| 16 | npm licence check, 176 lockfile packages | PASS, 0 need review |

Command: `cd 04_APPLICATION/web && npm ci && npm run build && npm test && PLAYWRIGHT_BROWSERS_PATH=<browsers> npx playwright test`.

## Defects found and fixed during testing

1. Light-theme accent colour failed contrast (3.5:1). Changed `#b86e00` to `#945800` (5.05:1 on its soft background).
2. Mobile horizontal overflow: `<fieldset>` min-content width, grid items `min-width:auto`, and absolutely positioned screen-reader text escaping scroll containers.
3. Savings chart labels distorted by `preserveAspectRatio="none"`.

## Screen status

| # | Screen | Route | Works without backend | Needs backend for |
|---|---|---|---|---|
| 1 | Landing | `/` | Fully | - |
| 2 | Login | `/login` | Preview sign-in | Real sign-in (Keycloak) |
| 3 | Registration | `/register` | Explains steps | Account creation (Keycloak) |
| 4 | Onboarding | `/onboarding`, `/onboarding/profile` | Validation, flow | Saving consent, profile, answers |
| 5 | Persona selection | `/onboarding/persona` | Fully (sets templates) | - |
| 6 | Dashboard | `/home` | Sample data | Real data (`/v1/dashboard`) |
| 7 | AI assistant | `/assistant` | UI, validation, honest error | All answers (`/v1/chat`, voice, sentinel) |
| 8 | Financial planning | `/planning` | Sample data + "Why this" | Real plans (calculators) |
| 9 | Goals | `/goals` | Sample data, form validation | Saving goals |
| 10 | Scam detection | `/shield` | Form, file validation | Verdicts (Sentinel) |
| 11 | Schemes | `/schemes` | Search and filter over sample catalogue | Eligibility (Connector) |
| 12 | Learning | `/learn` | Sample progress | Lessons, quizzes |
| 13 | Confidence Score | `/score` | Sample data, charts, voice summary | Real score (engine) |
| 14 | Voice assistant | `/voice` | Recording UI | STT, agents, TTS |
| 15 | Accessibility settings | `/settings/accessibility` | Fully | Sync across devices (optional) |
| 16 | Profile | `/profile` | Sample profile | Export, delete |
| 17 | Notifications | `/notifications` | Sample list, filter, mark read locally | Persisted read state |

## Not done in Step 1

- Real sign-in has not been exercised (no Keycloak yet). Done in Step 6.
- No TalkBack, NVDA or VoiceOver run. axe is automated only.
- Only Chromium tested. Firefox and Safari not tested.
- Noto Devanagari and Kannada fonts are not bundled; the browser's own fonts render those scripts.
- Page content is English; only navigation labels are translated, as drafts needing native review.
- Monthly report screen and risk profile card are not built.
