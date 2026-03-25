const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'telegram_shop',
  });

  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');

    const email = 'admin@shop.com';
    const password = 'admin123';
    const name = 'Администратор';

    const hashedPassword = await bcrypt.hash(password, 10);

    // Проверяем, существует ли таблица admins
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admins'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  Таблица admins не существует. Создаю...');
      await client.query(`
        CREATE TABLE admins (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Таблица admins создана');
    }

    // Вставляем админа
    await client.query(
      `INSERT INTO admins (email, password, name, role, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET 
       password = $2, name = $3, "updatedAt" = NOW()`,
      [email, hashedPassword, name, 'admin']
    );

    console.log('\n✅ Администратор создан/обновлен!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:   ', email);
    console.log('🔑 Пароль:  ', password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nИспользуйте эти данные для входа в админ-панель');
    console.log('URL: http://localhost:3001/admin\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

createAdmin();
