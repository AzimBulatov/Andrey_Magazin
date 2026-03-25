const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'telegram_shop',
  entities: ['src/entities/*.entity.ts'],
  synchronize: false,
});

async function createAdmin() {
  await AppDataSource.initialize();

  const email = 'admin@shop.com';
  const password = 'admin123';
  const name = 'Администратор';

  const hashedPassword = await bcrypt.hash(password, 10);

  await AppDataSource.query(
    `INSERT INTO admins (email, password, name, role, "createdAt", "updatedAt") 
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (email) DO NOTHING`,
    [email, hashedPassword, name, 'admin']
  );

  console.log('✅ Админ создан!');
  console.log('📧 Email:', email);
  console.log('🔑 Пароль:', password);
  console.log('\nИспользуйте эти данные для входа в админ-панель');

  await AppDataSource.destroy();
}

createAdmin().catch(console.error);
