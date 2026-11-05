# Operations Guide

How to run VAAKYA on one Linux host (DEPLOYMENT_ARCHITECTURE). Everything is free and open source (D-026).

## 1. First start

```bash
cd 04_APPLICATION/infra
./init-secrets.sh                        # random secrets in ./secrets (never commit); prints the demo password
docker compose build                     # api, worker, web, inference images
# Production (TLS through Caddy, Keycloak at /auth, no other ports, preview off):
VAAKYA_DOMAIN=vaakya.example.org docker compose -f compose.yaml -f compose.prod.yaml up -d
docker compose exec api python -m vaakya.seed schemes     # scheme catalogue; add `demo` only on test systems
```

Point the domain's DNS at the host and open ports 80 and 443. Caddy obtains a Let's Encrypt certificate. `VAAKYA_DOMAIN=localhost` uses Caddy's local CA for testing (tested: 8 live journeys pass over https://localhost).

Local development without TLS: `docker compose up -d` (web on :3000, Keycloak on :8080, preview mode on).

If Docker Hub refuses `ubuntu:24.04` for the inference image, build a base with `debootstrap --variant=minbase noble <dir> http://archive.ubuntu.com/ubuntu`, `tar -C <dir> -c . | docker import - vaakya-base/ubuntu:24.04`, and build with `--build-arg BASE=vaakya-base/ubuntu:24.04`.

## 2. What is public

| Path | Goes to | Notes |
|---|---|---|
| `https://DOMAIN/` | web (Next.js) | The web server calls the API on the internal network |
| `https://DOMAIN/auth/realms/vaakya/...` | Keycloak | Sign-in, registration, token endpoints |
| `https://DOMAIN/auth/admin`, `/auth/realms/master` | **404** | Admin console only through an SSH tunnel |
| everything else | not exposed | API, databases, inference, metrics are on internal networks |

Admin access: `ssh -L 8080:localhost:8080 host`, then temporarily publish Keycloak with the development compose file, or use `docker compose exec keycloak /opt/keycloak/bin/kcadm.sh`.

## 3. Backups and restore

```bash
./backup.sh /srv/vaakya-backups          # PostgreSQL (app + Keycloak) and SeaweedFS, AES-256-GCM encrypted, with SHA256SUMS
./restore.sh /srv/vaakya-backups/<timestamp>   # rehearsal: restores into a scratch database and compares row counts
```

- Key: `VAAKYA_BACKUP_KEY_B64` in `secrets/api.env`. **Keep an offline copy**; without it backups cannot be read.
- Neo4j and Qdrant are not backed up: the worker rebuilds the graph from PostgreSQL, and Qdrant re-ingests the corpus on start.
- Tested 2026-11-05: rehearsal restored 17 users, 414 events, 8 goals, 133 score snapshots exactly; backup files contain no plaintext.
- Schedule `backup.sh` nightly with cron and copy the directory off the host. Rehearse a restore monthly (NFR-AVAIL-03).
- Real restore (disaster): stop api and worker, `pg_restore --clean -d vaakya` from the decrypted dump, restore the SeaweedFS tar into its volume, start everything; the worker re-syncs Neo4j.

## 4. Monitoring

`docker compose -f compose.yaml -f compose.prod.yaml --profile monitoring up -d` adds Prometheus (scrapes `api:8000/metrics` and Keycloak) and Grafana on `127.0.0.1:3001` (SSH tunnel). Metrics: request count and latency by route, agent answers (and whether a model was used), Sentinel verdicts by level, safety fallbacks. No user data in labels.
**Status:** configuration validated; Prometheus and Grafana containers were not run in the build environment (Docker Hub rate limit). The API metrics endpoint is tested.

## 5. Routine tasks

| Task | How |
|---|---|
| Update images | `git pull && docker compose build && docker compose -f compose.yaml -f compose.prod.yaml up -d` (migrations run on API start) |
| Rotate a secret | Edit `secrets/*`, then `docker compose up -d` for the affected services. Rotating the vault key needs re-encryption of documents (not automated) |
| Free disk | `docker builder prune -af` (the build cache filled the disk once and broke SeaweedFS) |
| Erase a user | The user does it in Profile → Delete; it removes PostgreSQL rows, vault objects and graph nodes. Delete the Keycloak account in the admin console |
| Check health | `docker compose ps`; `docker compose exec api python -c "import urllib.request;print(urllib.request.urlopen('http://127.0.0.1:8000/readyz').read())"` |
