#!/bin/sh
set -e
KC_PASSWORD="$(cat /run/secrets/keycloak_db_password)"
[ -n "$KC_PASSWORD" ] || { echo "keycloak_db_password secret is empty or unreadable" >&2; exit 1; }
psql -v ON_ERROR_STOP=1 -v kc_password="$KC_PASSWORD" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/init.sql.in
