const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createAdmin() {
  const client = new Client({
    host: 'postgres',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'telegram_shop',
  });

  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');
    console.log('');

    const email = 'admin@shop.com';
    const password = 'admin123';
    const firstName = 'Админ';
    const lastName = 'Админ';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Создаем запись в таблице admins
    console.log('1️⃣ Создание записи в таблице admins...');
    await client.query('DELETE FROM admins WHERE email = $1', [email]);
    
    const adminResult = await client.query(
      `INSERT INTO admins (email, password, name, role, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [email, hashedPassword, `${firstName} ${lastName}`, 'admin']
    );
    const adminId = adminResult.rows[0].id;
    console.log(`  ✅ Админ создан с ID: ${adminId}`);
    console.log('');

    // 2. Создаем пользователя с тем же ID для доступа к финансам
    console.log('2️⃣ Создание пользователя для доступа к финансам...');
    await client.query('DELETE FROM users WHERE email = $1', [email]);
    
    // Используем тот же ID что и у админа
    await client.query(
      `INSERT INTO users (id, "firstName", "lastName", email, password, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [adminId, firstName, lastName, email, hashedPassword]
    );
    console.log(`  ✅ Пользователь создан с ID: ${adminId}`);
    console.log('');

    // 3. Создаем кошелек для админа
    console.log('3️⃣ Создание кошелька...');
    await client.query('DELETE FROM wallets WHERE "userId" = $1', [adminId]);
    
    await client.query(
      `INSERT INTO wallets ("userId", balance, "totalDeposited", "totalSpent", "isActive", "createdAt", "updatedAt") 
       VALUES ($1, 0, 0, 0, true, NOW(), NOW())`,
      [adminId]
    );
    console.log('  ✅ Кошелек создан');
    console.log('');

    console.log('================================');
    console.log('✅ АДМИН УСПЕШНО СОЗДАН!');
    console.log('================================');
    console.log('');
    console.log('📧 Email:', email);
    console.log('🔑 Пароль:', password);
    console.log('👤 Имя:', `${firstName} ${lastName}`);
    console.log('🆔 ID:', adminId);
    console.log('');
    console.log('Теперь админ может:');
    console.log('  ✅ Войти в админ-панель');
    console.log('  ✅ Пополнять баланс в разделе Финансы');
    console.log('  ✅ Делать заказы как обычный пользователь');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

createAdmin();
