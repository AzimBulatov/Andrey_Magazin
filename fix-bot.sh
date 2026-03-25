#!/bin/bash

echo "==================================="
echo "ИСПРАВЛЕНИЕ TELEGRAM БОТА"
echo "==================================="
echo ""

# Получаем токен из .env
if [ -f .env ]; then
    source .env
elif [ -f .env.production ]; then
    source .env.production
else
    echo "❌ Файл .env не найден!"
    exit 1
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN не установлен в .env"
    exit 1
fi

echo "1️⃣ Удаление webhook (если установлен):"
echo "-----------------------------------"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=true"
echo ""
echo ""

echo "2️⃣ Проверка токена:"
echo "-----------------------------------"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"
echo ""
echo ""

echo "3️⃣ Перезапуск backend контейнера:"
echo "-----------------------------------"
docker-compose restart backend
echo ""

echo "4️⃣ Ожидание запуска (10 секунд)..."
sleep 10
echo ""

echo "5️⃣ Проверка логов после перезапуска:"
echo "-----------------------------------"
docker logs telegram-shop-backend --tail 30
echo ""

echo "==================================="
echo "✅ ГОТОВО!"
echo "==================================="
echo ""
echo "Попробуйте написать боту /start"
echo "Если не работает - запустите: ./diagnose-bot.sh"
