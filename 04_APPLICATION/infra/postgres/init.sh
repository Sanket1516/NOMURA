#!/bin/sh
set -e
KC_PASSWORD="$(cat /run/secrets/keycloak_db_password)"
API_PASSWORD="$(cat /run/secrets/api_db_password)"
[ -n "$KC_PASSWORD" ] && [ -n "$API_PASSWORD" ] || { echo "database role secrets are empty or unreadable" >&2; exit 1; }
psql -v ON_ERROR_STOP=1 -v kc_password="$KC_PASSWORD" -v api_password="$API_PASSWORD" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -f /docker-entrypoint-initdb.d/init.sql.in
