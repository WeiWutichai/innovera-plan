#!/bin/sh
set -e

# On first boot (empty data volume) restore the baked, seeded SQLite template.
# Only applies to the SQLite/file datasource; for Postgres, run
# `prisma migrate deploy` + seeding in your deploy pipeline instead.
DB_FILE="/app/data/dev.db"

case "${DATABASE_URL:-}" in
  file:*)
    if [ ! -f "$DB_FILE" ]; then
      echo "[entrypoint] initialising database at $DB_FILE from seed template"
      cp /app/prisma/seed.db "$DB_FILE"
    else
      echo "[entrypoint] using existing database at $DB_FILE"
    fi
    ;;
  *)
    echo "[entrypoint] non-file DATABASE_URL detected; skipping SQLite bootstrap"
    ;;
esac

exec "$@"
