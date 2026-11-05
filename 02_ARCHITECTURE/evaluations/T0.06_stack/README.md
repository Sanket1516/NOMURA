# T0.06 Stack spike

**Task:** T0.06. Select current stable versions, build the API image, smoke-test imports, start the licence register.
**Status:** Done on 2026-11-05 in a Linux cloud container. Results: `05_TESTING/evaluations/T0.06_RESULTS.md`.

> **This is not application code.** It proves that the planned dependency set installs, builds and runs together.
> T1.01 and T1.03 build the real `04_APPLICATION/api` and `web` from these lockfiles.

| Folder | Contents |
|---|---|
| `api/` | `pyproject.toml` and `uv.lock` (pinned API set), `Dockerfile`, `smoke_imports.py`, `service_probe.py`, `licence_check.py` with unit tests |
| `web/` | `package.json` and `package-lock.json` (Next.js 16, React 19, Tailwind 4, TypeScript 7), a one-page app, `licence_check.mjs` |
| `infra/` | `compose.spike.yaml`: PostgreSQL, Neo4j, Qdrant, SeaweedFS and Keycloak with spike-only credentials |

## Not covered

- **Inference stack:** Ollama models, faster-whisper, PaddleOCR, IndicTrans2 and TTS. These need the RTX 3050 and belong to T0.03, T0.07, T0.08, T0.09 and T0.13.
- **Presidio analyzer models:** the spaCy language model download is part of T0.04. Only the anonymizer was exercised.
- **Ollama, Caddy, Prometheus, Grafana and Loki** were not started.

## Reproduce

Requirements: Docker with Compose, `uv`, Node 22.14 or later.

```bash
cd 02_ARCHITECTURE/evaluations/T0.06_stack/api
docker build -t vaakya-t006-api .
docker run --rm --network none vaakya-t006-api
docker run --rm --network none vaakya-t006-api sh -c "pip-licenses --from=mixed --format=json --python /opt/venv/bin/python | python licence_check.py"
uv run --frozen pytest -q test_licence_check.py
```

Behind a TLS-intercepting proxy, add `--network host --build-arg HTTPS_PROXY=$HTTPS_PROXY --secret id=ca,src=<ca.crt>` to `docker build`.

```bash
cd 02_ARCHITECTURE/evaluations/T0.06_stack/web
npm ci && npx next build && node licence_check.mjs
```

```bash
cd 02_ARCHITECTURE/evaluations/T0.06_stack/infra
docker compose -f compose.spike.yaml up -d
docker run --rm --network vaakya-t006_default vaakya-t006-api python service_probe.py
docker compose -f compose.spike.yaml down -v
```
