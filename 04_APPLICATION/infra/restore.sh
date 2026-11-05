#!/bin/sh
# Restore rehearsal (NFR-AVAIL-03): restores the app database from a backup into a SCRATCH database and compares
# row counts with the live one. It never overwrites the live database. For a real restore, see 06_DOCUMENTATION/OPERATIONS.md.
# Usage: ./restore.sh <backup-dir> [scratch-db]
set -eu
cd "$(dirname "$0")"
DIR="$1"; DB="${2:-vaakya_restore_check}"
( cd "$DIR" && sha256sum -c SHA256SUMS )
docker compose exec -T postgres psql -U vaakya -d vaakya -qc "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB"
docker compose exec -T api python -m vaakya.backup decrypt < "$DIR/vaakya.dump.enc" | docker compose exec -T postgres pg_restore -U vaakya -d "$DB" --no-owner
Q="SELECT string_agg(c, ',') FROM (SELECT relname || '=' || n_live_tup AS c FROM pg_stat_user_tables ORDER BY relname) t"
count() { docker compose exec -T postgres psql -U vaakya -d "$1" -tAc "ANALYZE" -tAc "SELECT 'users=' || count(*) FROM users UNION ALL SELECT 'events=' || count(*) FROM events UNION ALL SELECT 'goals=' || count(*) FROM goals UNION ALL SELECT 'score_history=' || count(*) FROM score_history" | tr '\n' ' '; }
LIVE=$(count vaakya); RESTORED=$(count "$DB")
echo "live:     $LIVE"; echo "restored: $RESTORED"
[ "$LIVE" = "$RESTORED" ] && echo "RESTORE REHEARSAL PASSED" || { echo "RESTORE REHEARSAL FAILED"; exit 1; }
_=$Q
