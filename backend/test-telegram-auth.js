const { Client } = require('pg');

async function testTelegramAuth() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'telegram_shop',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Проверяем существование таблицы telegram_auth_tokens
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_auth_tokens'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Table telegram_auth_tokens exists');

      // Проверяем структуру таблицы
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'telegram_auth_tokens'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Проверяем количество записей
      const count = await client.query('SELECT COUNT(*) FROM telegram_auth_tokens');
      console.log(`\n📊 Records in table: ${count.rows[0].count}`);

      // Показываем последние записи
      const recent = await client.query(`
        SELECT id, "userId", "telegramId", used, "createdAt", "expiresAt"
        FROM telegram_auth_tokens 
        ORDER BY "createdAt" DESC 
        LIMIT 5
      `);

      if (recent.rows.length > 0) {
        console.log('\n📝 Recent tokens:');
        recent.rows.forEach(row => {
          console.log(`  ID: ${row.id}, User: ${row.userId}, TG: ${row.telegramId}, Used: ${row.used}`);
        });
      }
    } else {
      console.log('❌ Table telegram_auth_tokens does NOT exist');
      console.log('💡 The table should be created automatically when the app starts');
      console.log('💡 Make sure the backend is running with synchronize: true');
    }

    // Проверяем пользователей с telegramId
    const usersWithTelegram = await client.query(`
      SELECT id, "telegramId", username, "firstName", "lastName"
      FROM users 
      WHERE "telegramId" IS NOT NULL
      LIMIT 5
    `);

    console.log(`\n👥 Users with Telegram ID: ${usersWithTelegram.rows.length}`);
    usersWithTelegram.rows.forEach(user => {
      console.log(`  ID: ${user.id}, TG: ${user.telegramId}, Name: ${user.firstName} ${user.lastName || ''}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

testTelegramAuth();
