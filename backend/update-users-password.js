const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function updateUsersPassword() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'telegram_shop',
  });

  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');

    // Получаем всех пользователей без пароля
    const result = await client.query(
      'SELECT id, email FROM users WHERE password IS NULL AND email IS NOT NULL'
    );

    console.log(`📝 Найдено пользователей без пароля: ${result.rows.length}`);

    // Устанавливаем временный пароль для всех пользователей
    const tempPassword = 'password123';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    for (const user of result.rows) {
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, user.id]
      );
      console.log(`✅ Обновлен пользователь: ${user.email}`);
    }

    console.log('\n✅ Все пользователи обновлены!');
    console.log(`⚠️  Временный пароль для всех: ${tempPassword}`);
    console.log('⚠️  Рекомендуется сменить пароль после входа\n');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
  }
}

updateUsersPassword();
