#!/bin/bash
set -e

host="$1"
shift

echo "Waiting for postgres at $host..."

until PGPASSWORD=postgres psql -h "$host" -U "postgres" -d "telegram_shop" -c '\q' 2>/dev/null; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "Postgres is up - starting application"
exec "$@"
