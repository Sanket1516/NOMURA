# Step 2 Results: Backend

**Date:** 2026-11-05 | **Code:** `04_APPLICATION/api/` | **Environment:** Linux container, Python 3.13.18, PostgreSQL 18.6 in Docker.

## Verdict

The API starts locally (uvicorn) and as a Docker image (non-root, migrations on start). 42 routes in OpenAPI. User-data modules are real and persisted in PostgreSQL. Agent-backed endpoints return an explicit 503 until Steps 4 to 6 register them.

## Tests

| Suite | Count | Result |
|---|---|---|
| Unit: calculators (emergency fund, goal plan, irregular income, seasonal, loan APR, SIP illustration) with hand-checked values | 9 | PASS |
| Unit: Confidence Score fcs-1 (zero, full marks, caps, weights, rounding, bands, actions) | 8 | PASS |
| Integration, auth and errors: missing/expired/wrong-aud/wrong-iss/wrong-key/alg none/HS256 tokens → 401; 422 with field locations; unknown fields rejected; 413; request id echo; control characters stripped | 10 | PASS |
| Integration, user flows: consent append-only, dynamic assessment, completion guards, baseline score, goal lifecycle with idempotency, plan "why", contribution validation, budget summary, variable-income rule, calculators via API, quiz updates score and hides answers, dashboard shape, export and erase | 14 | PASS |
| Integration, security: cross-user access 404 on 6 routes, rate limit 429 + Retry-After, AI endpoints 503 not fake, upload magic bytes, size, EXIF/GPS stripping, PDF with JavaScript rejected, consent required | 5 | PASS |
| **Total** | **46** | **PASS** |

**Mutation check:** removing the `user_id` filter in `get_owned` makes `test_cross_user_access_is_404` fail, so the isolation test detects the regression it guards.

**Other checks:** `ruff` clean; licence check 156/156 Python distributions allowed; `/healthz`, `/readyz`, `/docs`, `/openapi.json` served; 401 problem details on `/v1/me` without a token; Docker image 1.13 GB, ran `alembic upgrade head` to revision 0001 on an empty database.

## Real versus not yet connected

| Module | State |
|---|---|
| Auth verification (Keycloak RS256 JWKS) | Real; tested with locally signed tokens. Not yet against a running Keycloak (Step 6) |
| Profiles, consent, preferences, onboarding, assessment | Real |
| Financial items, budget, goals, plans, calculators | Real |
| Confidence Score engine and dashboard | Real |
| Learning (6 lessons, quizzes) | Real; content is draft pending human review (FR-EDU-07) |
| Notifications | Real; nothing generates notifications yet (proactive jobs: Step 5) |
| Documents | Validation real; storage interface implemented in Step 3; OCR/extraction in Step 5-6 |
| Chat, Sentinel, schemes, voice | 503 "Feature not available" until Steps 4-6 |
| Rate limits | Real, in-memory: correct for one API replica only |
| PostgreSQL Row Level Security | Not implemented; isolation is enforced in repositories and tested |
