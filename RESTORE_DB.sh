#!/bin/bash
# Скрипт для восстановления базы данных на сервере

echo "🔧 ВОССТАНОВЛЕНИЕ БАЗЫ ДАННЫХ"
echo "================================"
echo ""

# Шаг 1: Создать базу данных
echo "1️⃣ Создание базы данных telegram_shop..."
docker exec -it telegram-shop-db psql -U postgres -c "CREATE DATABASE telegram_shop;" 2>/dev/null || echo "  ⚠️  База уже существует"
echo ""

# Шаг 2: Перезапустить backend (создаст таблицы)
echo "2️⃣ Перезапуск backend для создания таблиц..."
docker-compose restart backend
echo "  ⏳ Ждем 15 секунд..."
sleep 15
echo ""

# Шаг 3: Проверить таблицы
echo "3️⃣ Проверка созданных таблиц:"
docker exec -it telegram-shop-db psql -U postgres telegram_shop -c "\dt"
echo ""

# Шаг 4: Создать админа
echo "4️⃣ Создание администратора..."
docker exec -i telegram-shop-backend node create-admin-server.js
echo ""

# Шаг 5: Засеять данные
echo "5️⃣ Заполнение базы тестовыми данными..."
docker exec -i telegram-shop-backend node seed-massive-data.js
echo ""

# Шаг 6: Проверка
echo "6️⃣ Проверка данных:"
echo "-------------------"
echo "Категории:"
docker exec -it telegram-shop-db psql -U postgres telegram_shop -c "SELECT COUNT(*) FROM categories;"
echo ""
echo "Товары:"
docker exec -it telegram-shop-db psql -U postgres telegram_shop -c "SELECT COUNT(*) FROM products;"
echo ""
echo "Пользователи:"
docker exec -it telegram-shop-db psql -U postgres telegram_shop -c "SELECT COUNT(*) FROM users;"
echo ""
echo "Заказы:"
docker exec -it telegram-shop-db psql -U postgres telegram_shop -c "SELECT COUNT(*) FROM orders;"
echo ""

echo "================================"
echo "✅ ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО!"
echo "================================"
echo ""
echo "Логин админа: admin@shop.com"
echo "Пароль админа: admin123"
echo ""
echo "Сайт: http://andreyshop.chickenkiller.com"
