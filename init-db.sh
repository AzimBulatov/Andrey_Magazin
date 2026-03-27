#!/bin/bash
set -e

# Создаем базу данных если её нет
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE telegram_shop'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'telegram_shop')\gexec
EOSQL

echo "✅ База данных telegram_shop готова"
