#!/bin/sh
# Encrypted backups (NFR-AVAIL-03). PostgreSQL (app + Keycloak) and the SeaweedFS document store.
# Neo4j and Qdrant are not backed up: Neo4j is rebuilt from PostgreSQL (worker relay) and Qdrant from the corpus (D-010).
# Usage: ./backup.sh [dir]   — writes <dir>/<timestamp>/*.enc ; copy that directory off the host.
set -eu
cd "$(dirname "$0")"
OUT="${1:-./backups}/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT" && chmod 700 "$OUT"
enc() { docker compose exec -T api python -m vaakya.backup encrypt; }
docker compose exec -T postgres pg_dump -U vaakya -Fc vaakya | enc > "$OUT/vaakya.dump.enc"
docker compose exec -T postgres pg_dump -U vaakya -Fc keycloak | enc > "$OUT/keycloak.dump.enc"
docker compose exec -T seaweedfs tar -C /data -cf - . | enc > "$OUT/seaweedfs.tar.enc"
( cd "$OUT" && sha256sum *.enc > SHA256SUMS )
ls -l "$OUT"
echo "Backup written to $OUT"
