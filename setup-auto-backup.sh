#!/bin/bash
# Настройка автоматических бэкапов через cron

echo "⚙️  Настройка автоматических бэкапов..."
echo ""

# Создаем папку для бэкапов
mkdir -p /root/backups
echo "✅ Папка /root/backups создана"
echo ""

# Делаем скрипт бэкапа исполняемым
chmod +x /root/Andrey_Magazin/backup-all.sh
echo "✅ Скрипт backup-all.sh сделан исполняемым"
echo ""

# Добавляем задачу в cron
CRON_JOB="0 3 * * * cd /root/Andrey_Magazin && ./backup-all.sh >> /root/backups/backup.log 2>&1"

# Проверяем есть ли уже такая задача
if crontab -l 2>/dev/null | grep -q "backup-all.sh"; then
    echo "⚠️  Задача cron уже существует"
else
    # Добавляем новую задачу
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Задача cron добавлена"
fi
echo ""

# Показываем текущие задачи cron
echo "📋 Текущие задачи cron:"
echo "─────────────────────────────────────────────────────────"
crontab -l
echo "─────────────────────────────────────────────────────────"
echo ""

# Делаем тестовый бэкап
echo "🧪 Запускаем тестовый бэкап..."
cd /root/Andrey_Magazin
./backup-all.sh
echo ""

echo "================================"
echo "✅ НАСТРОЙКА ЗАВЕРШЕНА!"
echo "================================"
echo ""
echo "📅 Бэкапы будут создаваться автоматически каждый день в 3:00"
echo "📁 Папка с бэкапами: /root/backups"
echo "🗑️  Старые бэкапы (>7 дней) удаляются автоматически"
echo ""
echo "Команды:"
echo "  ./backup-all.sh        - Создать бэкап вручную"
echo "  ./restore-backup.sh    - Восстановить из бэкапа"
echo "  ls -lh /root/backups   - Посмотреть список бэкапов"
