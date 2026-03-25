#!/bin/bash

echo "==================================="
echo "ДИАГНОСТИКА TELEGRAM БОТА НА СЕРВЕРЕ"
echo "==================================="
echo ""

echo "1️⃣ Проверка контейнера backend:"
echo "-----------------------------------"
docker ps | grep backend
echo ""

echo "2️⃣ Переменная TELEGRAM_BOT_TOKEN:"
echo "-----------------------------------"
docker exec telegram-shop-backend sh -c 'echo "Token: ${TELEGRAM_BOT_TOKEN:0:10}...${TELEGRAM_BOT_TOKEN: -5}"'
echo ""

echo "3️⃣ Проверка токена через Telegram API:"
echo "-----------------------------------"
docker exec telegram-shop-backend sh -c 'curl -s https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe | python3 -m json.tool 2>/dev/null || cat'
echo ""

echo "4️⃣ Проверка webhook (должен быть пустой для polling):"
echo "-----------------------------------"
docker exec telegram-shop-backend sh -c 'curl -s https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo | python3 -m json.tool 2>/dev/null || cat'
echo ""

echo "5️⃣ Логи backend (последние 100 строк, фильтр по Telegram):"
echo "-----------------------------------"
docker logs telegram-shop-backend --tail 100 2>&1 | grep -i "telegram\|bot\|telegraf" || echo "Нет упоминаний о Telegram в логах"
echo ""

echo "6️⃣ Логи backend (последние 50 строк - все):"
echo "-----------------------------------"
docker logs telegram-shop-backend --tail 50
echo ""

echo "7️⃣ Проверка переменных окружения в контейнере:"
echo "-----------------------------------"
docker exec telegram-shop-backend sh -c 'env | grep -E "TELEGRAM|API_URL|WEBSITE_URL"'
echo ""

echo "8️⃣ Проверка процессов Node.js в контейнере:"
echo "-----------------------------------"
docker exec telegram-shop-backend sh -c 'ps aux | grep node'
echo ""

echo "==================================="
echo "КОНЕЦ ДИАГНОСТИКИ"
echo "==================================="
echo ""
echo "📋 Что делать дальше:"
echo "- Если токен неверный - обновите .env и перезапустите: docker-compose restart backend"
echo "- Если webhook установлен - удалите его: curl https://api.telegram.org/bot<TOKEN>/deleteWebhook"
echo "- Если в логах ошибки - скопируйте их и покажите мне"
