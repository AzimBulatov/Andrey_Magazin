#!/bin/bash
# Скрипт для смены паролей на сильные

echo "🔐 СМЕНА ПАРОЛЕЙ НА СИЛЬНЫЕ"
echo "================================"
echo ""

# Генерируем сильные пароли
ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-40)

echo "📝 Сгенерированы новые пароли:"
echo "================================"
echo ""
echo "ADMIN_PASSWORD: $ADMIN_PASSWORD"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"
echo ""
echo "⚠️  СОХРАНИ ЭТИ ПАРОЛИ В НАДЕЖНОМ МЕСТЕ!"
echo ""
read -p "Продолжить смену паролей? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Отменено"
    exit 1
fi

echo ""
echo "1️⃣ Обновление .env.production..."
# Обновляем .env.production
cat > .env.production << EOF
# PostgreSQL
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET

# Telegram Bot
TELEGRAM_BOT_TOKEN=8548014458:AAHxiyZ8136trjrUDfAOvBPg1_z5CX3nTBc

# API URLs
API_URL=http://andreyshop.chickenkiller.com
WEBSITE_URL=http://andreyshop.chickenkiller.com

# YooKassa
YOOKASSA_SHOP_ID=1280139
YOOKASSA_SECRET_KEY=test_8m_ZECQI5MzCFbveTmtmoAqo1rIabyk0eRkTJDPF2cg
EOF
echo "✅ .env.production обновлен"
echo ""

echo "2️⃣ Обновление backend/.env..."
# Обновляем backend/.env
cat > backend/.env << EOF
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@postgres:5432/telegram_shop
JWT_SECRET=$JWT_SECRET
TELEGRAM_BOT_TOKEN=8548014458:AAHxiyZ8136trjrUDfAOvBPg1_z5CX3nTBc
PORT=3000
API_URL=http://andreyshop.chickenkiller.com
WEBSITE_URL=http://andreyshop.chickenkiller.com
WEBHOOK_DOMAIN=
YOOKASSA_SHOP_ID=1280139
YOOKASSA_SECRET_KEY=test_8m_ZECQI5MzCFbveTmtmoAqo1rIabyk0eRkTJDPF2cg
REDIS_HOST=redis
REDIS_PORT=6379
EOF
echo "✅ backend/.env обновлен"
echo ""

echo "3️⃣ Смена пароля PostgreSQL..."
docker exec -it telegram-shop-db psql -U postgres -c "ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';"
echo "✅ Пароль PostgreSQL изменен"
echo ""

echo "4️⃣ Смена пароля админа в базе данных..."
# Создаем временный скрипт для смены пароля админа
cat > /tmp/change-admin-password.js << 'EOFJS'
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function changeAdminPassword() {
  const client = new Client({
    host: 'postgres',
    port: 5432,
    user: 'postgres',
    password: process.env.NEW_POSTGRES_PASSWORD,
    database: 'telegram_shop',
  });

  try {
    await client.connect();
    
    const newPassword = process.env.NEW_ADMIN_PASSWORD;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль в таблице admins
    await client.query(
      'UPDATE admins SET password = $1 WHERE email = $2',
      [hashedPassword, 'admin@shop.com']
    );
    
    // Обновляем пароль в таблице users
    await client.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, 'admin@shop.com']
    );
    
    console.log('✅ Пароль админа изменен');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

changeAdminPassword();
EOFJS

# Копируем скрипт в контейнер и выполняем
docker cp /tmp/change-admin-password.js telegram-shop-backend:/app/change-admin-password.js
docker exec -e NEW_POSTGRES_PASSWORD=$POSTGRES_PASSWORD -e NEW_ADMIN_PASSWORD=$ADMIN_PASSWORD telegram-shop-backend node change-admin-password.js
docker exec telegram-shop-backend rm /app/change-admin-password.js
rm /tmp/change-admin-password.js
echo ""

echo "5️⃣ Перезапуск контейнеров..."
docker compose down
docker compose up -d
echo "✅ Контейнеры перезапущены"
echo ""

echo "================================"
echo "✅ ВСЕ ПАРОЛИ ИЗМЕНЕНЫ!"
echo "================================"
echo ""
echo "📝 НОВЫЕ УЧЕТНЫЕ ДАННЫЕ:"
echo "================================"
echo ""
echo "🔐 Админ панель:"
echo "   Email: admin@shop.com"
echo "   Пароль: $ADMIN_PASSWORD"
echo ""
echo "🗄️  PostgreSQL:"
echo "   User: postgres"
echo "   Пароль: $POSTGRES_PASSWORD"
echo ""
echo "🔑 JWT Secret:"
echo "   $JWT_SECRET"
echo ""
echo "⚠️  СОХРАНИ ЭТИ ДАННЫЕ В НАДЕЖНОМ МЕСТЕ!"
echo "⚠️  Файл с паролями: ~/passwords.txt"
echo ""

# Сохраняем пароли в файл
cat > ~/passwords.txt << EOF
=================================
ПАРОЛИ ДЛЯ ANDREY SHOP
Дата: $(date)
=================================

АДМИН ПАНЕЛЬ:
Email: admin@shop.com
Пароль: $ADMIN_PASSWORD

POSTGRESQL:
User: postgres
Пароль: $POSTGRES_PASSWORD

JWT SECRET:
$JWT_SECRET

=================================
EOF

chmod 600 ~/passwords.txt
echo "💾 Пароли сохранены в ~/passwords.txt"
echo ""
echo "Готово! Теперь можешь войти с новым паролем."
