const { Client } = require('pg');

async function checkDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'telegram_shop',
  });

  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    // Проверяем структуру таблицы users
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Структура таблицы users:');
    console.log('─'.repeat(60));
    columnsResult.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('─'.repeat(60));

    // Проверяем наличие поля password
    const hasPassword = columnsResult.rows.some(col => col.column_name === 'password');
    
    if (hasPassword) {
      console.log('\n✅ Поле password существует');
      
      // Проверяем пользователей
      const usersResult = await client.query(`
        SELECT id, email, "firstName", "lastName", 
               CASE WHEN password IS NULL THEN 'НЕТ' ELSE 'ДА' END as has_password
        FROM users
        WHERE email IS NOT NULL
        ORDER BY id;
      `);

      if (usersResult.rows.length > 0) {
        console.log('\n👥 Пользователи в базе:');
        console.log('─'.repeat(80));
        console.log('ID'.padEnd(5), 'Email'.padEnd(30), 'Имя'.padEnd(20), 'Пароль');
        console.log('─'.repeat(80));
        usersResult.rows.forEach(user => {
          console.log(
            String(user.id).padEnd(5),
            (user.email || '').padEnd(30),
            (user.firstName || '').padEnd(20),
            user.has_password
          );
        });
        console.log('─'.repeat(80));

        const usersWithoutPassword = usersResult.rows.filter(u => u.has_password === 'НЕТ');
        if (usersWithoutPassword.length > 0) {
          console.log(`\n⚠️  Найдено ${usersWithoutPassword.length} пользователей без пароля`);
          console.log('💡 Запустите: node update-users-password.js');
        } else {
          console.log('\n✅ Все пользователи имеют пароли');
        }
      } else {
        console.log('\n📝 Пользователей в базе нет');
      }
    } else {
      console.log('\n❌ Поле password НЕ существует!');
      console.log('💡 Перезапустите backend, чтобы TypeORM создал поле');
    }

    // Проверяем админов
    const adminsResult = await client.query(`
      SELECT id, email, name FROM admins ORDER BY id;
    `);

    if (adminsResult.rows.length > 0) {
      console.log('\n👨‍💼 Администраторы:');
      console.log('─'.repeat(60));
      console.log('ID'.padEnd(5), 'Email'.padEnd(30), 'Имя');
      console.log('─'.repeat(60));
      adminsResult.rows.forEach(admin => {
        console.log(
          String(admin.id).padEnd(5),
          (admin.email || '').padEnd(30),
          admin.name || ''
        );
      });
      console.log('─'.repeat(60));
    } else {
      console.log('\n📝 Администраторов в базе нет');
      console.log('💡 Создайте админа: node create-admin.js');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 База данных не запущена. Запустите: docker-compose up -d postgres');
    }
  } finally {
    await client.end();
  }
}

checkDatabase();
