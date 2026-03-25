#!/bin/bash

echo "🔧 Исправление конфигурации и перезапуск..."

# Останавливаем контейнеры
echo "⏹️  Останавливаем контейнеры..."
docker-compose down

# Пересобираем client-site с новой конфигурацией
echo "🔨 Пересобираем client-site..."
docker-compose build client-site

# Перезапускаем nginx
echo "🔄 Пересобираем nginx..."
docker-compose build nginx

# Запускаем все сервисы
echo "🚀 Запускаем все сервисы..."
docker-compose up -d

# Ждем запуска
echo "⏳ Ждем запуска сервисов..."
sleep 10

# Проверяем статус
echo "✅ Проверяем статус:"
docker-compose ps

echo ""
echo "📋 Логи backend:"
docker-compose logs --tail=20 backend

echo ""
echo "✅ Готово! Проверьте сайт: http://andreyshop.chickenkiller.com"
