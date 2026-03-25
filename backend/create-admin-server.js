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
    console.log('Connected to database');

    const email = 'admin@shop.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Generated hash:', hashedPassword);

    // Удаляем если существует
    await client.query('DELETE FROM admins WHERE email = $1', [email]);

    // Создаем нового
    await client.query(
      `INSERT INTO admins (email, password, name, role, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [email, hashedPassword, 'Admin', 'admin']
    );

    console.log('✅ Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createAdmin();
