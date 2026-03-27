#!/bin/bash
# Восстановление из бэкапа

BACKUP_DIR="/root/backups"

echo "🔄 ВОССТАНОВЛЕНИЕ ИЗ БЭКАПА"
echo "================================"
echo ""

# Показываем доступные бэкапы
echo "📋 Доступные бэкапы базы данных:"
echo "─────────────────────────────────────────────────────────"
ls -lh $BACKUP_DIR/db_backup_*.sql 2>/dev/null | nl
echo "─────────────────────────────────────────────────────────"
echo ""

echo "📋 Доступные бэкапы файлов:"
echo "─────────────────────────────────────────────────────────"
ls -lh $BACKUP_DIR/uploads_backup_*.tar.gz 2>/dev/null | nl
echo "─────────────────────────────────────────────────────────"
echo ""

# Получаем последний бэкап БД
LATEST_DB=$(ls -t $BACKUP_DIR/db_backup_*.sql 2>/dev/null | head -1)
LATEST_UPLOADS=$(ls -t $BACKUP_DIR/uploads_backup_*.tar.gz 2>/dev/null | head -1)

if [ -z "$LATEST_DB" ]; then
    echo "❌ Бэкапы базы данных не найдены!"
    exit 1
fi

echo "🎯 Будет восстановлен последний бэкап:"
echo "  БД: $(basename $LATEST_DB)"
echo "  Файлы: $(basename $LATEST_UPLOADS)"
echo ""
echo "⚠️  ВНИМАНИЕ: Текущие данные будут ПЕРЕЗАПИСАНЫ!"
echo ""
read -p "Продолжить? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Отменено"
    exit 0
fi

echo ""
echo "🔄 Начинаем восстановление..."
echo ""

# 1. Восстановление базы данных
echo "1️⃣ Восстановление базы данных..."
docker exec -i telegram-shop-db psql -U postgres -c "DROP DATABASE IF EXISTS telegram_shop;"
docker exec -i telegram-shop-db psql -U postgres -c "CREATE DATABASE telegram_shop;"
docker exec -i telegram-shop-db psql -U postgres telegram_shop < $LATEST_DB

if [ $? -eq 0 ]; then
    echo "  ✅ База данных восстановлена"
else
    echo "  ❌ Ошибка восстановления базы данных"
    exit 1
fi
echo ""

# 2. Восстановление файлов
if [ -n "$LATEST_UPLOADS" ]; then
    echo "2️⃣ Восстановление загруженных файлов..."
    docker run --rm \
        -v andrey_magazin_uploads_data:/data \
        -v $BACKUP_DIR:/backup \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename $LATEST_UPLOADS) -C /data"
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Файлы восстановлены"
    else
        echo "  ❌ Ошибка восстановления файлов"
    fi
else
    echo "2️⃣ Бэкап файлов не найден, пропускаем..."
fi
echo ""

# 3. Перезапуск backend
echo "3️⃣ Перезапуск backend..."
docker-compose restart backend
echo "  ⏳ Ждем 10 секунд..."
sleep 10
echo ""

# 4. Проверка
echo "4️⃣ Проверка восстановления:"
echo "----------------------------"
docker exec -it telegram-shop-db psql -U postgres telegram_shop -c "SELECT 
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM orders) as orders;"
echo ""

echo "================================"
echo "✅ ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО!"
echo "================================"
