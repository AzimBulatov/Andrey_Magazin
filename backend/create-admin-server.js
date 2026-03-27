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

    // 2. Создаем или обновляем пользователя для доступа к финансам
    console.log('2️⃣ Создание пользователя для доступа к финансам...');
    
    // Проверяем есть ли уже пользователь с таким email
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      // Обновляем существующего пользователя
      const userId = existingUser.rows[0].id;
      await client.query(
        `UPDATE users 
         SET "firstName" = $1, "lastName" = $2, password = $3, "updatedAt" = NOW()
         WHERE email = $4`,
        [firstName, lastName, hashedPassword, email]
      );
      console.log(`  ✅ Пользователь обновлен с ID: ${userId}`);
    } else {
      // Создаем нового пользователя
      const userResult = await client.query(
        `INSERT INTO users ("firstName", "lastName", email, password, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [firstName, lastName, email, hashedPassword]
      );
      const userId = userResult.rows[0].id;
      console.log(`  ✅ Пользователь создан с ID: ${userId}`);
    }
    console.log('');

    // 3. Создаем кошелек для пользователя (если его нет)
    console.log('3️⃣ Создание кошелька...');
    const userForWallet = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    const walletUserId = userForWallet.rows[0].id;
    
    const existingWallet = await client.query('SELECT id FROM wallets WHERE "userId" = $1', [walletUserId]);
    
    if (existingWallet.rows.length > 0) {
      console.log('  ⚠️  Кошелек уже существует');
    } else {
      await client.query(
        `INSERT INTO wallets ("userId", balance, "totalDeposited", "totalSpent", "isActive", "createdAt", "updatedAt") 
         VALUES ($1, 0, 0, 0, true, NOW(), NOW())`,
        [walletUserId]
      );
      console.log('  ✅ Кошелек создан');
    }
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
