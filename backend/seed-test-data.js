const axios = require('axios');
const bcrypt = require('bcrypt');
const { DataSource } = require('typeorm');

const API_URL = 'http://localhost:3000';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'telegram_shop',
  synchronize: false,
});

async function seedData() {
  console.log('🌱 Начинаем добавление тестовых данных...\n');

  try {
    await AppDataSource.initialize();

    // 1. Создаём админа
    console.log('👤 Создаём админа...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await AppDataSource.query(
      `INSERT INTO admins (email, password, name, role, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      ['admin@shop.com', hashedPassword, 'Администратор', 'admin']
    );
    console.log('✅ Админ создан: admin@shop.com / admin123');

    // Ждём пока backend запустится
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Создаём категории
    console.log('\n📦 Создаём категории...');
    const categories = [
      { name: 'Электроника', description: 'Смартфоны, ноутбуки и гаджеты', isActive: true },
      { name: 'Одежда', description: 'Мужская и женская одежда', isActive: true },
      { name: 'Продукты', description: 'Продукты питания', isActive: true },
    ];

    const createdCategories = [];
    for (const cat of categories) {
      try {
        const response = await axios.post(`${API_URL}/categories`, cat);
        createdCategories.push(response.data);
        console.log(`✅ Создана категория: ${cat.name}`);
      } catch (error) {
        console.log(`⚠️  Категория ${cat.name} уже существует`);
      }
    }

    // 3. Создаём товары
    console.log('\n📱 Создаём товары...');
    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Флагманский смартфон от Apple с титановым корпусом',
        price: 89990,
        stock: 15,
        categoryId: 1,
        isActive: true,
      },
      {
        name: 'Samsung Galaxy S24',
        description: 'Мощный Android-смартфон с AI функциями',
        price: 74990,
        stock: 20,
        categoryId: 1,
        isActive: true,
      },
      {
        name: 'MacBook Pro 14',
        description: 'Ноутбук для профессионалов на чипе M3',
        price: 189990,
        stock: 8,
        categoryId: 1,
        isActive: true,
      },
      {
        name: 'Футболка базовая',
        description: 'Хлопковая футболка, размеры S-XXL',
        price: 1290,
        stock: 50,
        categoryId: 2,
        isActive: true,
      },
      {
        name: 'Джинсы классические',
        description: 'Прямой крой, синий деним',
        price: 3990,
        stock: 30,
        categoryId: 2,
        isActive: true,
      },
    ];

    for (const product of products) {
      try {
        await axios.post(`${API_URL}/products`, product);
        console.log(`✅ Создан товар: ${product.name} - ${product.price}₽`);
      } catch (error) {
        console.log(`⚠️  Товар ${product.name} уже существует`);
      }
    }

    console.log('\n✨ Готово! Тестовые данные добавлены.');
    console.log('\n📊 Данные для входа в админку:');
    console.log('   Email: admin@shop.com');
    console.log('   Пароль: admin123');
    console.log('\n🤖 Telegram бот: @andrey_diplom_shop_bot');
    console.log('   Отправь /start чтобы начать');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await AppDataSource.destroy();
  }
}

seedData();
