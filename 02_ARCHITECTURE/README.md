# Architecture

Technical architecture, diagrams, schemas, agent workflows and evaluation spikes.

**Status:** Architecture set v1.0 written 2026-11-05 (T0.15). Design only; no application code exists. Owner review pending.

| File | Contents |
|---|---|
| `SYSTEM_ARCHITECTURE.md` | Start here: principles, stack, containers, GPU model, document index |
| `FRONTEND_ARCHITECTURE.md` | Next.js PWA pages, layouts, state, API client, auth flow, accessibility |
| `BACKEND_ARCHITECTURE.md` | FastAPI modules, middleware, auth, validation, errors, logging, jobs |
| `AGENT_ARCHITECTURE.md` | LangGraph, four agents, Dual-LLM, RAG, Sentinel flow, safety, proactive |
| `DATABASE_ARCHITECTURE.md` | PostgreSQL, Neo4j Life Graph and queries, Qdrant, SeaweedFS, backups |
| `API_DESIGN.md` | Endpoint index and request/response schemas |
| `SECURITY_ARCHITECTURE.md` | Threats, authN/Z, secrets, encryption, uploads, privacy, injection |
| `DEPLOYMENT_ARCHITECTURE.md` | Compose topology, environments, CI/CD, observability, scale path |
| `DATA_FLOW.md` | Sequence diagrams for each journey and what crosses each boundary |
| `COMPONENT_DEPENDENCIES.md` | Version validation, service and module dependencies |
| `ARCHITECTURE_COVERAGE.md` | Generated: every tracked feature mapped to a strategy. Re-run `python3 02_ARCHITECTURE/tools/coverage.py` |
| `evaluations/T0.06_stack/` | T0.06 spike: lockfiles, Dockerfile, smoke tests, licence checks, service compose |
