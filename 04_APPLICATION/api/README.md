# VAAKYA API (FastAPI)

Python 3.13 (3.12 also tested), FastAPI 0.162, SQLAlchemy 2.1 + Alembic, PostgreSQL 18. Architecture: `02_ARCHITECTURE/BACKEND_ARCHITECTURE.md`. Endpoint design: `02_ARCHITECTURE/API_DESIGN.md`. Live OpenAPI: `/docs`.

## Install and run locally

```bash
cd 04_APPLICATION/api
uv sync --frozen                      # creates .venv from uv.lock
cp .env.example .env                  # then edit the values
docker run -d --name vaakya-pg -e POSTGRES_PASSWORD=CHANGE_ME -e POSTGRES_USER=vaakya -e POSTGRES_DB=vaakya -p 5432:5432 postgres:18
uv run alembic upgrade head
uv run uvicorn vaakya.asgi:app --reload --port 8000
```

Docker image: `docker build -t vaakya-api .` then run with the same `VAAKYA_*` variables. The container runs migrations, then serves on port 8000 as a non-root user.

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `VAAKYA_DATABASE_URL` | yes | `postgresql+psycopg://user:pass@host:5432/db` |
| `VAAKYA_OIDC_ISSUER` | yes | Keycloak realm issuer, exactly as in tokens |
| `VAAKYA_OIDC_JWKS_URL` | no | JWKS URL when the issuer URL is not reachable from the API |
| `VAAKYA_OIDC_AUDIENCE` | no | Default `vaakya-api` |
| `VAAKYA_LOG_HMAC_KEY` | production | Key for hashing user ids in logs. Startup fails in production without it |
| `VAAKYA_CORS_ORIGINS` | no | JSON list. Empty: same-origin only (the web BFF calls the API server-side) |
| `VAAKYA_ENV` | no | `development`, `test`, `production` |

## Test

```bash
docker run -d --name vaakya-pg-test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=vaakya -p 55432:5432 postgres:18
uv run pytest                 # unit + integration (integration skips if PostgreSQL is unreachable)
uv run ruff check vaakya tests
```

Integration tests use real RS256 JWTs signed by a test key and a real PostgreSQL. They cover success and failure for every module, cross-user isolation, rate limits and upload validation.

## Example requests

All `/v1` routes need `Authorization: Bearer <Keycloak access token>`. Money is integer paise.

```bash
TOKEN=...   # e.g. from Keycloak's token endpoint
curl -s -X PUT localhost:8000/v1/me/consents -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"grants":[{"purpose":"ai_processing","version":"2026-11","granted":true}]}'
curl -s -X PUT localhost:8000/v1/me/profile -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"display_name":"Priya","birth_year":1994,"state":"Maharashtra","income_type":"salaried"}'
curl -s -X POST localhost:8000/v1/assessment/answers -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"answers":[{"question_id":"monthly_income","value":{"min_paise":3500000,"max_paise":3500000}},{"question_id":"monthly_expenses","value":{"paise":2600000}},{"question_id":"loan_emi","value":{"paise":0}},{"question_id":"savings","value":{"paise":4200000}},{"question_id":"risk_preference","value":"low"},{"question_id":"primary_goal","value":"emergency_fund"}]}'
curl -s -X POST localhost:8000/v1/assessment/complete -H "authorization: Bearer $TOKEN"
curl -s -X POST localhost:8000/v1/goals -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -H 'idempotency-key: g1' \
  -d '{"type":"emergency_fund","title":"Emergency fund","target":{"paise":15600000},"target_date":"2028-10-31"}'
curl -s -X POST localhost:8000/v1/planning/loan-cost -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"principal":{"paise":1000000},"emi":{"paise":400000},"months":3,"upfront_fees":{"paise":200000}}'
curl -s localhost:8000/v1/score -H "authorization: Bearer $TOKEN"
```

## Endpoint status

| Area | Endpoints | Backed by |
|---|---|---|
| Identity, consent, preferences, export, erase | `/v1/me*` | **Real**: PostgreSQL |
| Onboarding and assessment | `/v1/onboarding/path`, `/v1/assessment/*` | **Real** |
| Financial profile and budget | `/v1/financial-items*`, `/v1/budget` | **Real** |
| Goals and plans | `/v1/goals*` | **Real**: `domain/calculators.py` |
| Planning calculators | `/v1/planning/*` | **Real**: deterministic, unit-tested |
| Confidence Score and dashboard | `/v1/score*`, `/v1/dashboard` | **Real**: `domain/score.py` (fcs-1) |
| Learning | `/v1/learning/*` | **Real**; lesson content is draft, awaiting review |
| Notifications | `/v1/notifications*` | **Real** |
| Documents | `/v1/documents*` | Validation real; storage needs the vault (Step 3), else 503 |
| Assistant, Sentinel, schemes, voice | `/v1/chat`, `/v1/sentinel/*`, `/v1/schemes*`, `/v1/voice/*` | Return **503 "Feature not available"** until Steps 4-6 register them. Never mocked |
