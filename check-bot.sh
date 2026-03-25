#!/bin/bash

echo "=== Проверка Telegram бота ==="
echo ""

echo "1. Проверка переменных окружения:"
docker exec telegram-shop-backend sh -c 'echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN"'
echo ""

echo "2. Проверка токена через Telegram API:"
docker exec telegram-shop-backend sh -c 'curl -s https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe'
echo ""
echo ""

echo "3. Проверка webhook:"
docker exec telegram-shop-backend sh -c 'curl -s https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo'
echo ""
echo ""

echo "4. Логи backend (последние 50 строк):"
docker logs telegram-shop-backend --tail 50
echo ""

echo "5. Проверка что backend запущен:"
docker ps | grep backend
echo ""

echo "=== Конец проверки ==="
