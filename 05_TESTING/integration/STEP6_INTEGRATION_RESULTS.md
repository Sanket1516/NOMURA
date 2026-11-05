# Step 6 Results: Integration

**Date:** 2026-11-05 | **Stack:** `04_APPLICATION/infra/compose.yaml`, all nine services in Docker on one Linux host
**Screenshots:** `07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/` (10, from the real stack) plus 58 preview screenshots.

## Stack that ran

| Service | Image | State |
|---|---|---|
| postgres | postgres:18 | healthy; app DB + separate Keycloak DB and role |
| keycloak | keycloak/keycloak:26.8.1 | realm imported; PKCE client; demo users; registration |
| neo4j, qdrant, seaweedfs | 5.26 community, v1.20.0, 4.50 | running |
| inference | vaakya-inference (Ubuntu 24.04 base built with debootstrap because Docker Hub rate-limited) | healthy; Tesseract eng/hin/mar/kan, eSpeak NG |
| api, worker | vaakya-api | healthy; `/readyz` reports postgres ok and vault, graph, orchestrator, sentinel, connector, speech configured |
| web | vaakya-web (Next.js standalone) | serving on :3000 |

Seeded with `python -m vaakya.seed all`: 10 schemes, four demo users whose ids match the Keycloak realm.

## Live end-to-end journeys (Playwright, real sign-in) — 7/7 pass, stable over 3 consecutive runs

| # | Journey | Proves |
|---|---|---|
| 1 | Demo user signs in at Keycloak → live dashboard | OIDC + PKCE through the BFF; API token verification; "Your data" label; no preview banner |
| 2 | Ask VAAKYA: SIP question → Educator answer with sources; loan-app question → Sentinel + Strategy Builder | Orchestrator, Qdrant retrieval, citations, agent handoff, SSE through the proxy |
| 3 | Scam Shield: pasted prize scam → High/Critical; screenshot of a KYC/OTP SMS → verdict via real Tesseract OCR | Sentinel pipeline end to end, file upload through the proxy |
| 4 | Schemes: PMJJBY eligibility with per-criterion results and steps | Connector engine on live profile |
| 5 | Planning shows the plan's formula; Life Graph "Live from your graph" from Neo4j; Loans lesson quiz updates the score; Score page | Calculators, graph projection, learning API |
| 6 | Voice on a phone viewport with a fake microphone → honest "speech model not installed (T0.08)" | No fabricated transcript |
| 7 | New user registers on Keycloak's page → consent → persona → profile → money → live dashboard with their name | Registration and onboarding end to end |

Plus: web unit 19/19, preview E2E 12/12 (axe 0 serious/critical, 360 px no overflow), API 139 + 4 inference-integration tests, inference service 10/10.

## Defects found by integration and fixed

1. Keycloak could not read its DB password: Compose file secrets kept host mode 600 → init script made a passwordless role. Secrets now readable by the container user; init fails loudly on an empty secret.
2. Demo users' last name "(demo)" failed Keycloak's name validation → sign-in stopped at "Update account". Renamed.
3. Worker inherited the API's HTTP healthcheck → "unhealthy". Disabled for the worker.
4. After onboarding, the client router replayed a cached `/home → /onboarding` redirect. Full navigation now.
5. Under reduced motion, staggered cards waited for their delay (content invisible up to 480 ms). Delays are now zero under reduced motion.
6. Dashboard activity repeated "Checked a scheme's rules" once per scheme. Deduplicated by kind.
7. Life Graph was unreadable (overlapping labels, ineligible schemes, one node per scam check). Hub-and-sector layout; ineligible schemes left out; scam checks summarised.

## UI polish added (owner request)

Dashboard hero with floating light, shimmering name, animated score badge and count-up stats; score ring draws in with a moving knob; bars and progress grow; line charts draw; staggered card entry; hover lift; animated Life Graph. All motion stops under reduced motion and the setting in Accessibility.

## Still not done

- Faster-whisper, LLM, translation and e5 models (owner's machine).
- `docker compose up --build` from scratch: images were built manually because of Docker Hub limits; Compose builds use the same Dockerfiles.
- TLS/Caddy production profile, backups, monitoring stack.
