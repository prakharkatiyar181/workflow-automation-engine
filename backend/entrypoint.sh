#!/bin/bash
# Entrypoint for the Django backend container.
# Waits for PostgreSQL to be ready, runs migrations, then hands off to CMD.
set -e

echo "═══════════════════════════════════════════"
echo "  Workflow Engine — Backend Startup"
echo "═══════════════════════════════════════════"

# ── Wait for PostgreSQL ───────────────────────────────────────────────────────
echo "⏳  Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until python - <<EOF
import psycopg2, sys, os
try:
    psycopg2.connect(
        dbname=os.environ["POSTGRES_DB"],
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        host=os.environ["DB_HOST"],
        port=os.environ["DB_PORT"],
    ).close()
    sys.exit(0)
except Exception as e:
    sys.exit(1)
EOF
do
  echo "   PostgreSQL not ready — retrying in 2s..."
  sleep 2
done

echo "✅  PostgreSQL is ready."

# ── Run Migrations ────────────────────────────────────────────────────────────
echo "📦  Running database migrations..."
python manage.py migrate --noinput

echo "✅  Migrations complete."
echo "🚀  Starting application..."
echo "═══════════════════════════════════════════"

# Hand off to the container CMD (daphne or celery worker)
exec "$@"
