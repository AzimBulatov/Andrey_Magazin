#!/bin/bash

echo "🔍 Диагностика проблем..."
echo ""

# 1. Проверка переменных окружения
echo "1️⃣ Проверка переменных окружения:"
echo "TELEGRAM_BOT_TOKEN установлен: $(docker-compose exec -T backend env | grep TELEGRAM_BOT_TOKEN | cut -d'=' -f1)"
echo "API_URL: $(docker-compose exec -T backend env | grep API_URL | cut -d'=' -f2)"
echo "WEBSITE_URL: $(docker-compose exec -T backend env | grep WEBSITE_URL | cut -d'=' -f2)"
echo ""

# 2. Проверка подключения к Telegram API
echo "2️⃣ Проверка подключения к Telegram API:"
docker-compose exec -T backend sh -c "curl -s https://api.telegram.org/bot\$TELEGRAM_BOT_TOKEN/getMe | head -n 5"
echo ""

# 3. Проверка базы данных
echo "3️⃣ Проверка базы данных:"
docker-compose exec -T postgres psql -U postgres telegram_shop -c "SELECT COUNT(*) as admin_count FROM admins;"
echo ""

# 4. Проверка nginx конфигурации
echo "4️⃣ Проверка nginx конфигурации:"
docker-compose exec -T nginx nginx -t
echo ""

# 5. Проверка доступности backend изнутри
echo "5️⃣ Проверка backend изнутри контейнера:"
docker-compose exec -T nginx curl -s http://backend:3000/ | head -n 3
echo ""

# 6. Проверка доступности через nginx
echo "6️⃣ Проверка через nginx:"
curl -s http://andreyshop.chickenkiller.com/auth/me | head -n 3
echo ""

echo "✅ Диагностика завершена!"
echo ""
echo "🔧 Запустите ./fix-and-restart.sh для исправления проблем"
