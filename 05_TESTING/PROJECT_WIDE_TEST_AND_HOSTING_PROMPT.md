# Full Project Test, Fix, and Hosting Readiness Prompt

Copy the prompt below into a coding agent working in this repository.

---

```text
You are the engineering agent responsible for testing and preparing the existing VAAKYA project in this repository for hosting. Do the work in the current checkout. The goal is a working, secure, documented deployment candidate—not merely a test plan or a successful build.

## Mission

Inspect every implemented part of the website and its supporting services, run the relevant checks, reproduce defects, fix defects in scope, add or update focused regression tests, and rerun affected checks. Prepare the project and its deployment instructions for a repeatable staging/production-host deployment. Continue through the work instead of stopping after the first failure or returning only recommendations.

Do not deploy publicly, change a live service, create or modify external accounts, push, merge, or commit. Do not use real customer data. Work locally and leave a reviewable result in the repository. Do not run destructive cleanup commands against Docker, databases, volumes, or files.

## Read the repository before changing it

1. Find and follow all applicable `AGENTS.md` instructions.
2. Check `git status`, the current branch, and recent history. Preserve existing user changes; do not switch branches, pull, reset, or overwrite unrelated work.
3. Read the current project status and handoff documents, then verify their claims against the current source and test results. In particular, inspect:
   - `00_PROJECT_MANAGEMENT/CURRENT_STATUS.md`
   - `00_PROJECT_MANAGEMENT/KNOWN_ISSUES.md`
   - `00_PROJECT_MANAGEMENT/REMAINING_WORK.md` (if present)
   - `08_HANDOVER/HANDOFF_STATUS.md`
   - `08_HANDOVER/OWNER_LOCAL_TASKS.md`
   - `02_ARCHITECTURE/DEPLOYMENT_ARCHITECTURE.md`
   - `05_TESTING/README.md` and existing reports under `05_TESTING/`
   - `04_APPLICATION/{web,api,inference,infra}/` and `.github/workflows/`
4. Treat source code, current configuration, and checks actually run as evidence. The project notes contain historical and sometimes conflicting status; do not repeat them as current facts without verifying.

## Project-specific constraints

- This is VAAKYA, a Next.js 16/React 19 web app, a FastAPI API, an OCR/speech inference service, and Docker Compose infrastructure. Test all four areas and their integration.
- Preserve the project's free/open-source stack decision (D-026). Do not add a paid or remote AI provider, new service, or dependency without a clear project need and an entry in the decision record.
- Never fabricate AI, speech, translation, scheme, or financial results. Missing capabilities must remain clearly unavailable (for example, the documented 503 behavior) until genuinely implemented and tested. Preview/sample data must remain clearly labelled and must not be mistaken for live persistence.
- Financial amounts, eligibility, calculations, and scores must remain deterministic code, not model-generated facts. Preserve authentication, user-data isolation, consent, privacy, and safety behavior.
- Do not claim that legal, regulatory, financial-content, translation, lesson, or native-speaker reviews happened unless there is evidence from a qualified human reviewer. Do not mark a feature `VERIFIED` without the project's required evidence and review.
- Do not expose or copy secrets into output, logs, tests, reports, or tracked files. Use `.env.example` and local ignored secret files as intended.
- Keep the user's existing edits. Avoid broad refactors; make the smallest safe fix that resolves each reproduced defect.

## Test and repair plan

### 1. Build a coverage inventory

Map the user-facing routes and key journeys, API route groups, background jobs, inference endpoints, data stores, deployment services, and their existing tests. Include at least:

- Public landing, registration/sign-in, consent, onboarding, profile, language selection, dashboard, accessibility settings, goals, planning/calculators, score, notifications, learning/lessons, offline lesson saving, document upload/OCR, voice/TTS, assistant/agents, and sign-out/session expiry.
- API authentication/authorization, request validation, privacy and consent, cross-user isolation/RLS, calculations, idempotency, rate limits, uploads, errors, health/readiness, metrics, and migration behavior.
- PostgreSQL, Neo4j, Qdrant, SeaweedFS/S3, Keycloak, web/API proxy, worker, inference, reverse proxy/TLS, monitoring, backups, and startup/shutdown behavior wherever configured.

For every item, label it implemented, intentionally unavailable, mocked/demo-only, externally dependent, or broken. Treat intentional, documented unavailability as expected behavior; test that it fails safely and is described accurately in the UI.

### 2. Run baseline checks before fixes

Record the environment and exact commands/results. Use the lockfiles and project-pinned runtimes. The documented baseline commands include:

- Web, from `04_APPLICATION/web`: `npm ci`, `npm run typecheck`, `npm test`, `npm run licences`, `npm run build`, `npx playwright test e2e/preview.spec.ts`, and `npx playwright test e2e/offline-lessons.spec.ts` where its API prerequisites are available.
- API, from `04_APPLICATION/api`: `uv sync --frozen`, `uv run ruff check .`, and `uv run pytest -o addopts=""`. Run integration tests with their real required services; run both normal and `VAAKYA_TEST_RLS=1` modes when PostgreSQL and the other required services are available.
- Inference, from `04_APPLICATION/inference`: install its declared requirements and run `python -m pytest tests` with the real installed OCR/TTS engines when available. Check `/health`, authentication, input limits, and honest unavailable behavior for missing model weights.
- Security/dependencies: run the repository's npm and Python dependency audits, licence checks, secret/tracked-file review, and configured image scan where the tools and network are available.
- Infrastructure: validate each Compose configuration, environment-variable wiring, Docker build for web/API/inference, health checks, non-root runtime, startup dependencies, migration behavior, persistence, and exposed ports. Run the actual stack only if its dependencies are available and it will not touch existing user data or volumes.

Use the repository's documented commands as a starting point, but inspect scripts and prerequisites before running them. Do not make a failing test appear green by weakening/removing it, suppressing errors, skipping required coverage, or changing expected results without evidence. Do not claim an unrun check passed. If Docker, GPU/model weights, network access, credentials, or a real mail relay are unavailable, run independent checks and record precisely what could not be verified.

### 3. Exercise the product and its boundaries

- Run browser journeys in preview mode and live mode only when a safe local stack and test credentials are already available. Verify navigation, form validation, responsive layouts, browser console/network failures, session behavior, offline behavior, and that sample/live states are unmistakable.
- Test representative journeys end to end: a new user through consent/onboarding to persisted profile data; a signed-in user through budget/goals/calculators/dashboard; a document upload through validation/OCR and user confirmation; lessons online and offline; and each assistant/agent's implemented and unavailable paths.
- For API routes, test success and relevant failure cases, malformed/oversized input, unauthenticated and wrong-user access, and RLS isolation. Never use one user's data to satisfy another user's request.
- Check keyboard-only navigation, focus visibility, labels, contrast and axe results on key screens at mobile, tablet, and desktop widths. Report that automated checks do not replace real screen-reader/device testing.
- Verify security behavior around secrets, production preview mode, OIDC callback/issuer settings, CSRF and CORS, CSP/security headers, upload restrictions, rate limiting, metrics authentication, and public API/docs exposure. Fix code/config issues that are safely fixable in the repository.
- Measure performance only by running a real test against the real local stack. Label mocks as mocks and do not invent capacity numbers.

### 4. Fix and verify

For each reproduced defect, identify the cause, implement a focused repair, add/update a regression check where practical, and rerun the failed check plus nearby affected checks. Review the final diff for accidental secret exposure, unrelated edits, changed safety behavior, weakened assertions, and documentation that overstates what was tested.

If checks uncover gaps in coverage, add targeted tests for important implemented paths. Do not spend time pretending external or human-only tasks are software defects; list them as explicit launch gates and say what evidence/person is needed.

### 5. Hosting readiness

Review the production Compose setup and deployment architecture against an actual deployable configuration. Make the repository ready for an operator to configure a host by ensuring:

- production uses live mode (preview/sample mode is off), secure OIDC settings, HTTPS/reverse-proxy assumptions, correct public/internal URLs, and required environment variables are documented;
- secrets are generated/provided out of band and are never defaulted to known production values or committed;
- persistent data, migrations, health/readiness checks, startup ordering, backups/restore steps, log/monitoring access, resource requirements, and restart/rollback instructions are documented and consistent with the Compose files;
- only intended public ports are exposed; internal services and admin/metrics endpoints stay protected;
- a fresh operator can follow the documented commands from a clean checkout without undocumented local state.

Do not add deployment-provider-specific infrastructure or publish anything. If provider, domain, TLS certificate, DNS, host capacity, GPU, model weights, or credentials are owner-supplied, document the exact values/actions still required instead of inventing them. Distinguish “can be hosted for private/staging testing” from “safe to launch to real users.”

### 6. Record the outcome

Create or update `05_TESTING/audit/PROJECT_WIDE_READINESS_REPORT.md` with:

- date, commit/branch, OS, runtimes, Docker/service availability, and what was in scope;
- each command/check with exact pass/fail/blocked status and test counts;
- user journeys and components covered, including intentional unavailable/demo features;
- defects found, their fixes, and regression evidence;
- security, accessibility, dependency, build, and deployment results;
- limitations and all outstanding external, hardware-dependent, human-review, or owner-supplied launch gates;
- a clear verdict for (a) local tests, (b) private/staging hosting, and (c) public real-user launch.

Update stale handoff/status docs only when the new evidence justifies it. Keep historical reports intact or clearly dated; never rewrite history to imply a check ran when it did not. If all reproducible in-scope defects are fixed and all available checks pass, say so. If any check remains failed or blocked, identify it plainly and give the next concrete action.

## Completion criteria

The task is complete only when you have inspected the whole project, run every relevant check available in this environment, fixed and retested reproducible in-scope failures, verified the deployment configuration as far as this environment permits, and written the readiness report. A build alone is not full-project testing. Do not label the website fully tested or ready for public real-user launch while required checks or human/legal/content gates remain open.

## Final response

Summarize the changes, the exact checks that passed/failed/blocked, whether the project is ready for private/staging hosting and/or public launch, and the remaining actions. Link the readiness report and important changed files. Do not commit unless the owner explicitly asks.
```
