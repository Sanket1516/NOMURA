#!/bin/sh
# Creates ./secrets with random values for local development. Never commit the secrets directory.
set -e
cd "$(dirname "$0")"
mkdir -p secrets && chmod 700 secrets
rand() { head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32; }
[ -f secrets/postgres_password.txt ] && { echo "secrets already exist"; exit 0; }
PG=$(rand); KC=$(rand); APIDB=$(rand); NEO=$(rand); WEB=$(rand); INF=$(rand); DEMO="${VAAKYA_DEMO_PASSWORD:-$(rand)}"
printf %s "$PG" > secrets/postgres_password.txt
printf %s "$KC" > secrets/keycloak_db_password.txt
printf %s "$APIDB" > secrets/api_db_password.txt
printf 'KC_DB_PASSWORD=%s\nKC_BOOTSTRAP_ADMIN_PASSWORD=%s\nVAAKYA_WEB_CLIENT_SECRET=%s\nVAAKYA_DEMO_PASSWORD=%s\n' "$KC" "$(rand)" "$WEB" "$DEMO" > secrets/keycloak.env
printf 'NEO4J_AUTH=neo4j/%s\n' "$NEO" > secrets/neo4j.env
printf 'INFERENCE_TOKEN=%s\n' "$INF" > secrets/inference.env
printf 'VAAKYA_DATABASE_URL=postgresql+psycopg://vaakya_api:%s@postgres:5432/vaakya\nVAAKYA_ADMIN_DATABASE_URL=postgresql+psycopg://vaakya:%s@postgres:5432/vaakya\nVAAKYA_NEO4J_PASSWORD=%s\nVAAKYA_INFERENCE_TOKEN=%s\nVAAKYA_LOG_HMAC_KEY=%s\nVAAKYA_VAULT_KEK_B64=%s\n' \
  "$APIDB" "$PG" "$NEO" "$INF" "$(rand)" "$(head -c 32 /dev/urandom | base64)" > secrets/api.env
printf 'VAAKYA_BACKUP_KEY_B64=%s\n' "$(head -c 32 /dev/urandom | base64)" >> secrets/api.env
printf 'OIDC_CLIENT_SECRET=%s\n' "$WEB" > secrets/web.env
chmod 600 secrets/*
# Compose file secrets are bind-mounted with host permissions; the postgres user must read these two.
# The secrets directory itself stays 700.
chmod 644 secrets/postgres_password.txt secrets/keycloak_db_password.txt secrets/api_db_password.txt
echo "Secrets created in infra/secrets. Demo user password: $DEMO"
