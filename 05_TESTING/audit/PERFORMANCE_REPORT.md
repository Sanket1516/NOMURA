# Performance Report

**Date:** 2026-11-05. **Honest summary: performance was not benchmarked.** No load test, latency percentile or memory profile was run. The numbers below are incidental observations from functional runs on one Windows laptop with Docker, and must not be quoted as measurements.

## Observed (single user, local, warm)

| Observation | Value | Source |
|---|---|---|
| API request durations in test logs | 14 to 64 ms for profile, schemes, chat (rule-based path) | structured request logs in the pytest output |
| Live E2E journeys end to end | 2 to 7 s each, including browser steps and real OCR | Playwright timings |
| Whole live suite | 27 to 34 s for 8 journeys | Playwright |
| Disk | Docker build cache grew large during the fresh build; `docker builder prune -af` is the documented cleanup | OPERATIONS.md |

## Not measured

- Latency under concurrent users, throughput, and the rate-limit behaviour under load.
- Real model latency: no LLM, speech or embedding model has run, so the dominant cost of the final product is unknown. The RTX 3050 has 6 GB VRAM and all models must share it (T0.11).
- Memory use per container; Neo4j and Qdrant footprint on a 16 GB machine with models loaded.
- Web: bundle sizes, Lighthouse scores, time to interactive on a low-end phone.
- Database: query plans and index use under realistic data volumes. RLS adds a per-row policy check; its cost at scale is unknown.

## Code-quality observations (read, not profiled)

- Business logic is in `domain/` and `services/`; routes are thin. No duplicate calculator logic was found between web and API; the web uses sample data only in preview mode (`lib/demo.ts`) and it is labelled.
- Scheme, lesson and scam data are JSON files read at call time; caching could help but has not been needed.
- `npm audit` and `pip-audit` clean. An unused-dependency scan was not run.

## How to measure (script written 2026-11-05, not yet run against the real stack)

`04_APPLICATION/web/scripts/load_test.mjs` signs in once as a demo user through Keycloak, then loads seven read endpoints at 1, 5, 10 and 25 concurrent users and prints requests per second, p50/p95/p99/max latency, status-code counts (so rate limits and errors show up), optional chat timings (`CHAT=5`, the API allows 30 per hour) and `docker stats` memory. Command and options are at the top of the script. The statistics code has unit tests; the load loop was exercised only against a throwaway mock server here, **so no real figure exists yet**. Paste the script's output below with the date and machine when you run it, and do not quote any number that did not come from your run.

## Recommended next steps

1. Run `scripts/load_test.mjs` (see above) for the main read paths and `CHAT=5` for the chat path, rule-based first and then with the model on. k6 or Locust are alternatives for heavier tests.
2. Record container memory with `docker stats` under load.
3. Run Lighthouse on `/home` and `/learn` with mobile throttling.
4. Measure model latency and VRAM once T0.03 and T0.11 are done.
