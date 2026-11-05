#!/bin/sh
set -e
psql -v ON_ERROR_STOP=1 -v kc_password="$(cat /run/secrets/keycloak_db_password)" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/init.sql.in
