#!/bin/bash
# Автоматический бэкап базы данных и файлов

BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Создаем папку для бэкапов если её нет
mkdir -p $BACKUP_DIR

echo "🔄 Начинаем бэкап..."
echo ""

# 1. Бэкап базы данных
echo "1️⃣ Бэкап базы данных..."
docker exec telegram-shop-db pg_dump -U postgres telegram_shop > $BACKUP_DIR/db_backup_$DATE.sql
if [ $? -eq 0 ]; then
    echo "  ✅ База сохранена: $BACKUP_DIR/db_backup_$DATE.sql"
    DB_SIZE=$(du -h $BACKUP_DIR/db_backup_$DATE.sql | cut -f1)
    echo "  📦 Размер: $DB_SIZE"
else
    echo "  ❌ Ошибка бэкапа базы данных"
fi
echo ""

# 2. Бэкап загруженных файлов (картинки товаров)
echo "2️⃣ Бэкап загруженных файлов..."
docker run --rm \
    -v andrey_magazin_uploads_data:/data \
    -v $BACKUP_DIR:/backup \
    alpine tar czf /backup/uploads_backup_$DATE.tar.gz -C /data .

if [ $? -eq 0 ]; then
    echo "  ✅ Файлы сохранены: $BACKUP_DIR/uploads_backup_$DATE.tar.gz"
    UPLOADS_SIZE=$(du -h $BACKUP_DIR/uploads_backup_$DATE.tar.gz | cut -f1)
    echo "  📦 Размер: $UPLOADS_SIZE"
else
    echo "  ❌ Ошибка бэкапа файлов"
fi
echo ""

# 3. Удаляем старые бэкапы (старше 7 дней)
echo "3️⃣ Очистка старых бэкапов (старше 7 дней)..."
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +7 -delete
echo "  ✅ Старые бэкапы удалены"
echo ""

# 4. Показываем список бэкапов
echo "📋 Список бэкапов:"
echo "─────────────────────────────────────────────────────────"
ls -lh $BACKUP_DIR | grep -E "db_backup|uploads_backup" | tail -10
echo "─────────────────────────────────────────────────────────"
echo ""

echo "✅ Бэкап завершен!"
echo ""
echo "📁 Папка с бэкапами: $BACKUP_DIR"
echo "🔄 Для восстановления используйте: ./restore-backup.sh"
