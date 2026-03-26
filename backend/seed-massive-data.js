// Мощный скрипт для посева данных в базу
// Создает категории, товары, пользователей и заказы

require('dotenv').config();
const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

// Подключение к базе данных
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_URL?.includes('postgres://') 
    ? new URL(process.env.DATABASE_URL).hostname 
    : process.env.DATABASE_HOST || 'postgres',
  port: 5432,
  username: 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: 'telegram_shop',
  entities: ['dist/entities/*.entity.js'],
  synchronize: false,
});

// ============================================
// ДАННЫЕ ДЛЯ ПОСЕВА
// ============================================

// Категории товаров
const categories = [
  {
    name: 'Электроника',
    description: 'Смартфоны, ноутбуки, планшеты и аксессуары',
    isActive: true
  },
  {
    name: 'Одежда',
    description: 'Мужская и женская одежда на любой сезон',
    isActive: true
  },
  {
    name: 'Обувь',
    description: 'Кроссовки, ботинки, туфли и сандалии',
    isActive: true
  },
  {
    name: 'Книги',
    description: 'Художественная литература, учебники, комиксы',
    isActive: true
  },
  {
    name: 'Спорт и отдых',
    description: 'Спортивный инвентарь и товары для активного отдыха',
    isActive: true
  },
  {
    name: 'Дом и сад',
    description: 'Товары для дома, мебель, декор',
    isActive: true
  },
  {
    name: 'Красота и здоровье',
    description: 'Косметика, парфюмерия, средства по уходу',
    isActive: true
  },
  {
    name: 'Игрушки',
    description: 'Игрушки для детей всех возрастов',
    isActive: true
  },
  {
    name: 'Продукты питания',
    description: 'Продукты, напитки, деликатесы',
    isActive: true
  },
  {
    name: 'Автотовары',
    description: 'Аксессуары и запчасти для автомобилей',
    isActive: true
  }
];

// Товары для каждой категории
const productsData = {
  'Электроника': [
    { name: 'iPhone 15 Pro Max', description: 'Флагманский смартфон Apple с титановым корпусом, чипом A17 Pro и камерой 48MP', price: 129990, stock: 25 },
    { name: 'Samsung Galaxy S24 Ultra', description: 'Премиальный Android-смартфон с S Pen, 200MP камерой и AI функциями', price: 119990, stock: 30 },
    { name: 'MacBook Pro 16"', description: 'Мощный ноутбук для профессионалов с чипом M3 Max, 36GB RAM', price: 289990, stock: 15 },
    { name: 'iPad Air M2', description: 'Универсальный планшет с чипом M2, поддержкой Apple Pencil Pro', price: 74990, stock: 40 },
    { name: 'AirPods Pro 2', description: 'Беспроводные наушники с активным шумоподавлением и пространственным звуком', price: 24990, stock: 100 },
    { name: 'Sony WH-1000XM5', description: 'Премиальные накладные наушники с лучшим шумоподавлением', price: 34990, stock: 50 },
    { name: 'Apple Watch Series 9', description: 'Умные часы с датчиком температуры и двойным тапом', price: 44990, stock: 60 },
    { name: 'PlayStation 5', description: 'Игровая консоль нового поколения с SSD и поддержкой 4K 120fps', price: 54990, stock: 20 },
    { name: 'Nintendo Switch OLED', description: 'Портативная игровая консоль с OLED экраном 7 дюймов', price: 34990, stock: 35 },
    { name: 'GoPro Hero 12', description: 'Экшн-камера 5.3K с улучшенной стабилизацией', price: 44990, stock: 25 }
  ],
  'Одежда': [
    { name: 'Куртка Nike Sportswear', description: 'Утепленная куртка с капюшоном, водоотталкивающая ткань', price: 8990, stock: 50 },
    { name: 'Джинсы Levi\'s 501', description: 'Классические прямые джинсы из денима премиум качества', price: 6990, stock: 80 },
    { name: 'Худи Adidas Originals', description: 'Толстовка с капюшоном из хлопка, культовый логотип трилистника', price: 5490, stock: 100 },
    { name: 'Футболка Uniqlo', description: 'Базовая футболка из 100% хлопка, различные цвета', price: 990, stock: 200 },
    { name: 'Пальто Zara', description: 'Шерстяное пальто классического кроя, осень-зима', price: 12990, stock: 30 },
    { name: 'Платье H&M', description: 'Летнее платье из легкой ткани с цветочным принтом', price: 2990, stock: 60 },
    { name: 'Рубашка Tommy Hilfiger', description: 'Классическая рубашка из хлопка с длинным рукавом', price: 7990, stock: 45 },
    { name: 'Свитер Massimo Dutti', description: 'Кашемировый свитер с V-образным вырезом', price: 9990, stock: 35 },
    { name: 'Брюки Mango', description: 'Классические брюки со стрелками, офисный стиль', price: 4990, stock: 55 },
    { name: 'Пуховик The North Face', description: 'Теплый пуховик с защитой от ветра и влаги', price: 24990, stock: 25 }
  ],
  'Обувь': [
    { name: 'Nike Air Max 270', description: 'Кроссовки с воздушной подушкой для максимального комфорта', price: 12990, stock: 70 },
    { name: 'Adidas Ultraboost', description: 'Беговые кроссовки с технологией Boost для возврата энергии', price: 14990, stock: 60 },
    { name: 'Converse Chuck Taylor', description: 'Классические высокие кеды, икона стиля', price: 5990, stock: 100 },
    { name: 'Timberland 6-Inch', description: 'Легендарные ботинки из нубука, водонепроницаемые', price: 16990, stock: 40 },
    { name: 'Dr. Martens 1460', description: 'Культовые ботинки с 8 парами люверсов', price: 13990, stock: 50 },
    { name: 'New Balance 574', description: 'Ретро-кроссовки с замшевыми вставками', price: 8990, stock: 80 },
    { name: 'Vans Old Skool', description: 'Скейтерские кеды с фирменной полоской', price: 6490, stock: 90 },
    { name: 'Puma Suede Classic', description: 'Замшевые кроссовки в винтажном стиле', price: 7490, stock: 75 },
    { name: 'Reebok Classic Leather', description: 'Классические кожаные кроссовки', price: 6990, stock: 85 },
    { name: 'UGG Classic Mini', description: 'Угги из натуральной овчины, теплые и уютные', price: 18990, stock: 35 }
  ]
};

// Продолжение товаров
const moreProductsData = {
  'Книги': [
    { name: '1984 - Джордж Оруэлл', description: 'Культовая антиутопия о тоталитарном обществе', price: 590, stock: 150 },
    { name: 'Мастер и Маргарита', description: 'Роман Михаила Булгакова, шедевр русской литературы', price: 690, stock: 120 },
    { name: 'Гарри Поттер. Полное собрание', description: 'Все 7 книг о юном волшебнике в подарочном издании', price: 4990, stock: 40 },
    { name: 'Атлант расправил плечи', description: 'Философский роман Айн Рэнд об индивидуализме', price: 1290, stock: 80 },
    { name: 'Сапиенс', description: 'Юваль Харари о краткой истории человечества', price: 890, stock: 100 },
    { name: 'Тонкое искусство пофигизма', description: 'Марк Мэнсон о том, как жить счастливо', price: 690, stock: 130 },
    { name: 'Война и мир', description: 'Эпопея Льва Толстого в 4 томах', price: 1490, stock: 60 },
    { name: 'Преступление и наказание', description: 'Психологический роман Достоевского', price: 590, stock: 110 },
    { name: 'Маленький принц', description: 'Философская сказка Антуана де Сент-Экзюпери', price: 490, stock: 140 },
    { name: 'Алхимик', description: 'Пауло Коэльо о поиске своего предназначения', price: 590, stock: 95 }
  ],
  'Спорт и отдых': [
    { name: 'Гантели 2x10 кг', description: 'Разборные гантели с неопреновым покрытием', price: 3990, stock: 50 },
    { name: 'Коврик для йоги', description: 'Нескользящий коврик 183x61 см, толщина 6 мм', price: 1490, stock: 80 },
    { name: 'Велосипед горный', description: 'MTB 27.5", алюминиевая рама, 21 скорость', price: 34990, stock: 15 },
    { name: 'Палатка 4-местная', description: 'Кемпинговая палатка с тамбуром, водостойкая', price: 8990, stock: 25 },
    { name: 'Спальный мешок', description: 'Трехсезонный спальник, комфорт до -5°C', price: 3490, stock: 40 },
    { name: 'Ракетка для тенниса', description: 'Wilson Pro Staff, профессиональный уровень', price: 12990, stock: 20 },
    { name: 'Мяч футбольный', description: 'Adidas Tango, размер 5, официальный мяч', price: 2990, stock: 60 },
    { name: 'Скейтборд', description: 'Полный комплект для начинающих, клен 7 слоев', price: 4990, stock: 35 },
    { name: 'Ролики раздвижные', description: 'Роликовые коньки с регулировкой размера', price: 5990, stock: 30 },
    { name: 'Самокат трюковой', description: 'Профессиональный самокат для паркового катания', price: 7990, stock: 25 }
  ],
  'Дом и сад': [
    { name: 'Пылесос робот Xiaomi', description: 'Умный робот-пылесос с влажной уборкой и картографией', price: 24990, stock: 30 },
    { name: 'Кофемашина DeLonghi', description: 'Автоматическая кофемашина с капучинатором', price: 54990, stock: 15 },
    { name: 'Мультиварка Redmond', description: '5 литров, 45 программ, отложенный старт', price: 6990, stock: 45 },
    { name: 'Постельное белье сатин', description: 'Комплект евро, 100% хлопок, плотность 120 г/м²', price: 3990, stock: 70 },
    { name: 'Подушка ортопедическая', description: 'Memory foam, поддержка шеи, гипоаллергенная', price: 2490, stock: 60 },
    { name: 'Одеяло пуховое', description: 'Гусиный пух 90%, 200x220 см, зимнее', price: 8990, stock: 35 },
    { name: 'Набор посуды', description: '12 предметов, нержавеющая сталь, индукция', price: 9990, stock: 40 },
    { name: 'Увлажнитель воздуха', description: 'Ультразвуковой, 4 литра, ароматизация', price: 3490, stock: 55 },
    { name: 'Торшер LED', description: 'Напольный светильник с диммером, 3 режима', price: 5990, stock: 30 },
    { name: 'Шторы блэкаут', description: 'Светонепроницаемые шторы 2x2.7 м', price: 4990, stock: 45 }
  ]
};

// Еще больше товаров
const evenMoreProductsData = {
  'Красота и здоровье': [
    { name: 'Крем для лица Nivea', description: 'Увлажняющий крем с витамином E, 50 мл', price: 490, stock: 150 },
    { name: 'Шампунь L\'Oreal', description: 'Профессиональный шампунь для окрашенных волос', price: 890, stock: 120 },
    { name: 'Духи Chanel No.5', description: 'Легендарный аромат, 100 мл, оригинал', price: 12990, stock: 25 },
    { name: 'Электробритва Philips', description: 'Роторная бритва с 3 головками, влажное бритье', price: 8990, stock: 40 },
    { name: 'Фен Dyson', description: 'Профессиональный фен с технологией Air Multiplier', price: 34990, stock: 15 },
    { name: 'Тональный крем MAC', description: 'Стойкий тональный крем с матовым финишем', price: 3490, stock: 80 },
    { name: 'Помада Dior', description: 'Увлажняющая помада с насыщенным цветом', price: 2990, stock: 90 },
    { name: 'Массажер для лица', description: 'Ультразвуковой массажер с LED-терапией', price: 4990, stock: 50 },
    { name: 'Набор кистей для макияжа', description: '12 профессиональных кистей в чехле', price: 2490, stock: 70 },
    { name: 'Электрическая зубная щетка', description: 'Oral-B с датчиком давления и таймером', price: 5990, stock: 60 }
  ],
  'Игрушки': [
    { name: 'LEGO Star Wars', description: 'Конструктор Тысячелетний Сокол, 7541 деталь', price: 54990, stock: 20 },
    { name: 'Кукла Barbie', description: 'Барби Модница с аксессуарами', price: 2490, stock: 80 },
    { name: 'Hot Wheels трек', description: 'Мега-трек с мертвой петлей и 5 машинками', price: 4990, stock: 45 },
    { name: 'Мягкая игрушка Мишка', description: 'Плюшевый медведь 80 см, гипоаллергенный', price: 3490, stock: 60 },
    { name: 'Настольная игра Монополия', description: 'Классическая версия для всей семьи', price: 2990, stock: 70 },
    { name: 'Пазл 1000 элементов', description: 'Красивый пейзаж, размер 68x48 см', price: 890, stock: 100 },
    { name: 'Радиоуправляемая машина', description: 'Внедорожник 4WD, масштаб 1:16, до 20 км/ч', price: 5990, stock: 35 },
    { name: 'Кинетический песок', description: '3 кг цветного песка с формочками', price: 1490, stock: 90 },
    { name: 'Детский синтезатор', description: '54 клавиши, 100 тембров, микрофон', price: 6990, stock: 30 },
    { name: 'Набор для рисования', description: '150 предметов: карандаши, фломастеры, краски', price: 2990, stock: 65 }
  ],
  'Продукты питания': [
    { name: 'Кофе Lavazza', description: 'Зерновой кофе Qualità Rossa, 1 кг', price: 1990, stock: 100 },
    { name: 'Чай Greenfield', description: 'Набор из 12 вкусов, 120 пакетиков', price: 890, stock: 120 },
    { name: 'Шоколад Lindt', description: 'Швейцарский молочный шоколад, 300 г', price: 690, stock: 150 },
    { name: 'Оливковое масло', description: 'Extra Virgin, первый холодный отжим, 1 л', price: 1290, stock: 80 },
    { name: 'Мед натуральный', description: 'Цветочный мед, 1 кг, с пасеки', price: 890, stock: 70 },
    { name: 'Орехи микс', description: 'Кешью, миндаль, фундук, 500 г', price: 990, stock: 90 },
    { name: 'Паста De Cecco', description: 'Спагетти из твердых сортов пшеницы, 500 г', price: 290, stock: 200 },
    { name: 'Соус Pesto', description: 'Песто с базиликом и пармезаном, 190 г', price: 490, stock: 110 },
    { name: 'Сыр Пармезан', description: 'Выдержанный 24 месяца, 200 г', price: 1490, stock: 60 },
    { name: 'Вино красное', description: 'Каберне Совиньон, сухое, 0.75 л', price: 1990, stock: 50 }
  ],
  'Автотовары': [
    { name: 'Видеорегистратор', description: 'Full HD 1080p, угол обзора 170°, ночная съемка', price: 4990, stock: 50 },
    { name: 'Автомобильный пылесос', description: 'Беспроводной, мощность 120W, HEPA фильтр', price: 2990, stock: 60 },
    { name: 'Коврики в салон', description: 'Универсальные резиновые коврики, 4 шт', price: 1990, stock: 80 },
    { name: 'Ароматизатор', description: 'Автомобильный освежитель воздуха, новая машина', price: 290, stock: 200 },
    { name: 'Зарядка USB', description: 'Автомобильная зарядка 2 порта, Quick Charge 3.0', price: 890, stock: 100 },
    { name: 'Держатель для телефона', description: 'Магнитный держатель на дефлектор', price: 590, stock: 120 },
    { name: 'Компрессор автомобильный', description: 'Портативный насос для шин, 12V', price: 2490, stock: 45 },
    { name: 'Огнетушитель', description: 'Порошковый ОП-2, для автомобиля', price: 890, stock: 70 },
    { name: 'Аптечка автомобильная', description: 'Полный комплект по ГОСТ, срок 4.5 года', price: 490, stock: 90 },
    { name: 'Щетки стеклоочистителя', description: 'Бескаркасные дворники 60 см, пара', price: 1490, stock: 65 }
  ]
};

// Объединяем все товары
const allProductsData = { ...productsData, ...moreProductsData, ...evenMoreProductsData };

// Данные пользователей
const usersData = [
  {
    firstName: 'Александр',
    lastName: 'Иванов',
    middleName: 'Сергеевич',
    email: 'alex.ivanov@example.com',
    password: 'password123',
    phone: '+7 (999) 123-45-67',
    birthDate: '1990-05-15',
    gender: 'male',
    bio: 'Люблю технологии и спорт',
    telegramId: '123456789',
    addresses: [
      { city: 'Москва', street: 'Тверская', house: '12', apartment: '45', isDefault: true }
    ]
  },
  {
    firstName: 'Мария',
    lastName: 'Петрова',
    middleName: 'Александровна',
    email: 'maria.petrova@example.com',
    password: 'password123',
    phone: '+7 (999) 234-56-78',
    birthDate: '1995-08-22',
    gender: 'female',
    bio: 'Модница и книголюб',
    telegramId: '234567890',
    addresses: [
      { city: 'Санкт-Петербург', street: 'Невский проспект', house: '28', apartment: '12', isDefault: true }
    ]
  },
  {
    firstName: 'Дмитрий',
    lastName: 'Смирнов',
    middleName: 'Владимирович',
    email: 'dmitry.smirnov@example.com',
    password: 'password123',
    phone: '+7 (999) 345-67-89',
    birthDate: '1988-03-10',
    gender: 'male',
    bio: 'Автолюбитель и путешественник',
    telegramId: '345678901',
    addresses: [
      { city: 'Казань', street: 'Баумана', house: '56', apartment: '78', isDefault: true }
    ]
  },
  {
    firstName: 'Елена',
    lastName: 'Козлова',
    middleName: 'Игоревна',
    email: 'elena.kozlova@example.com',
    password: 'password123',
    phone: '+7 (999) 456-78-90',
    birthDate: '1992-11-30',
    gender: 'female',
    bio: 'Мама двоих детей, люблю готовить',
    telegramId: '456789012',
    addresses: [
      { city: 'Екатеринбург', street: 'Ленина', house: '34', apartment: '90', isDefault: true }
    ]
  },
  {
    firstName: 'Андрей',
    lastName: 'Новиков',
    middleName: 'Петрович',
    email: 'andrey.novikov@example.com',
    password: 'password123',
    phone: '+7 (999) 567-89-01',
    birthDate: '1985-07-18',
    gender: 'male',
    bio: 'Программист и геймер',
    telegramId: '567890123',
    addresses: [
      { city: 'Новосибирск', street: 'Красный проспект', house: '78', apartment: '23', isDefault: true }
    ]
  },
  {
    firstName: 'Ольга',
    lastName: 'Волкова',
    middleName: 'Дмитриевна',
    email: 'olga.volkova@example.com',
    password: 'password123',
    phone: '+7 (999) 678-90-12',
    birthDate: '1993-02-14',
    gender: 'female',
    bio: 'Фитнес-тренер и нутрициолог',
    telegramId: '678901234',
    addresses: [
      { city: 'Краснодар', street: 'Красная', house: '123', apartment: '45', isDefault: true }
    ]
  },
  {
    firstName: 'Сергей',
    lastName: 'Морозов',
    middleName: 'Андреевич',
    email: 'sergey.morozov@example.com',
    password: 'password123',
    phone: '+7 (999) 789-01-23',
    birthDate: '1991-09-05',
    gender: 'male',
    bio: 'Фотограф и видеограф',
    telegramId: '789012345',
    addresses: [
      { city: 'Владивосток', street: 'Светланская', house: '67', apartment: '12', isDefault: true }
    ]
  },
  {
    firstName: 'Анна',
    lastName: 'Соколова',
    middleName: 'Викторовна',
    email: 'anna.sokolova@example.com',
    password: 'password123',
    phone: '+7 (999) 890-12-34',
    birthDate: '1994-12-25',
    gender: 'female',
    bio: 'Дизайнер интерьеров',
    telegramId: '890123456',
    addresses: [
      { city: 'Ростов-на-Дону', street: 'Большая Садовая', house: '89', apartment: '34', isDefault: true }
    ]
  },
  {
    firstName: 'Максим',
    lastName: 'Лебедев',
    middleName: 'Олегович',
    email: 'maxim.lebedev@example.com',
    password: 'password123',
    phone: '+7 (999) 901-23-45',
    birthDate: '1987-04-20',
    gender: 'male',
    bio: 'Предприниматель',
    telegramId: '901234567',
    addresses: [
      { city: 'Уфа', street: 'Ленина', house: '45', apartment: '67', isDefault: true }
    ]
  },
  {
    firstName: 'Татьяна',
    lastName: 'Федорова',
    middleName: 'Сергеевна',
    email: 'tatyana.fedorova@example.com',
    password: 'password123',
    phone: '+7 (999) 012-34-56',
    birthDate: '1996-06-08',
    gender: 'female',
    bio: 'Учитель английского языка',
    telegramId: '012345678',
    addresses: [
      { city: 'Воронеж', street: 'Революции', house: '23', apartment: '56', isDefault: true }
    ]
  }
];

// ============================================
// ФУНКЦИИ ДЛЯ ПОСЕВА
// ============================================

// Генерация номера заказа
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
  return `${year}${month}${day}-${random}`;
}

// Случайный элемент из массива
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Случайное число в диапазоне
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Случайная дата в прошлом (последние N дней)
function randomPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(1, daysAgo));
  return date;
}

// Основная функция посева
async function seed() {
  try {
    console.log('🌱 Начинаем посев данных...\n');

    await AppDataSource.initialize();
    console.log('✅ Подключение к базе данных установлено\n');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // ============================================
    // 1. СОЗДАНИЕ КАТЕГОРИЙ
    // ============================================
    console.log('📦 Создаем категории...');
    const createdCategories = [];
    
    for (const category of categories) {
      // Проверяем существует ли категория
      const existing = await queryRunner.query(
        `SELECT id, name FROM categories WHERE name = $1`,
        [category.name]
      );
      
      if (existing.length > 0) {
        createdCategories.push(existing[0]);
        console.log(`  ⚠️  ${existing[0].name} (уже существует)`);
      } else {
        const result = await queryRunner.query(
          `INSERT INTO categories (name, description, "isActive", "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, NOW(), NOW()) 
           RETURNING id, name`,
          [category.name, category.description, category.isActive]
        );
        createdCategories.push(result[0]);
        console.log(`  ✓ ${result[0].name}`);
      }
    }
    console.log(`✅ Категорий в базе: ${createdCategories.length}\n`);

    // ============================================
    // 2. СОЗДАНИЕ ТОВАРОВ
    // ============================================
    console.log('🛍️  Создаем товары...');
    const createdProducts = [];
    
    for (const category of createdCategories) {
      const products = allProductsData[category.name] || [];
      let newCount = 0;
      
      for (const product of products) {
        // Проверяем существует ли товар
        const existing = await queryRunner.query(
          `SELECT id, name, price FROM products WHERE name = $1 AND "categoryId" = $2`,
          [product.name, category.id]
        );
        
        if (existing.length > 0) {
          createdProducts.push({ ...existing[0], categoryId: category.id });
        } else {
          const result = await queryRunner.query(
            `INSERT INTO products (name, description, price, stock, "categoryId", "isActive", 
             "viewCount", "salesCount", "averageRating", "reviewCount", "createdAt", "updatedAt") 
             VALUES ($1, $2, $3, $4, $5, true, $6, 0, 0, 0, NOW(), NOW()) 
             RETURNING id, name, price`,
            [
              product.name,
              product.description,
              product.price,
              product.stock,
              category.id,
              randomInt(10, 500)
            ]
          );
          createdProducts.push({ ...result[0], categoryId: category.id });
          newCount++;
        }
      }
      console.log(`  ✓ ${category.name}: ${products.length} товаров (новых: ${newCount})`);
    }
    console.log(`✅ Товаров в базе: ${createdProducts.length}\n`);

    // ============================================
    // 3. СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ
    // ============================================
    console.log('👥 Создаем пользователей...');
    const createdUsers = [];
    
    for (const user of usersData) {
      // Проверяем существует ли пользователь
      const existing = await queryRunner.query(
        `SELECT id, "firstName", "lastName", email, phone FROM users WHERE "telegramId" = $1 OR email = $2`,
        [user.telegramId, user.email]
      );
      
      if (existing.length > 0) {
        createdUsers.push({ ...existing[0], addresses: user.addresses });
        console.log(`  ⚠️  ${existing[0].firstName} ${existing[0].lastName} (уже существует)`);
      } else {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        const result = await queryRunner.query(
          `INSERT INTO users ("telegramId", username, "firstName", "lastName", "middleName", 
           email, password, phone, "birthDate", gender, bio, addresses, "isBlocked", 
           "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, NOW(), NOW()) 
           RETURNING id, "firstName", "lastName", email`,
          [
            user.telegramId,
            user.email.split('@')[0],
            user.firstName,
            user.lastName,
            user.middleName,
            user.email,
            hashedPassword,
            user.phone,
            user.birthDate,
            user.gender,
            user.bio,
            JSON.stringify(user.addresses)
          ]
        );
        createdUsers.push({ ...result[0], phone: user.phone, addresses: user.addresses });
        console.log(`  ✓ ${result[0].firstName} ${result[0].lastName} (${result[0].email})`);
      }
    }
    console.log(`✅ Пользователей в базе: ${createdUsers.length}\n`);

    // ============================================
    // 4. СОЗДАНИЕ КОШЕЛЬКОВ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ
    // ============================================
    console.log('💰 Создаем кошельки...');
    let newWallets = 0;
    
    for (const user of createdUsers) {
      // Проверяем существует ли кошелек
      const existing = await queryRunner.query(
        `SELECT id FROM wallets WHERE "userId" = $1`,
        [user.id]
      );
      
      if (existing.length > 0) {
        console.log(`  ⚠️  Кошелек для ${user.firstName} уже существует`);
      } else {
        const initialBalance = randomInt(0, 50000);
        
        await queryRunner.query(
          `INSERT INTO wallets ("userId", balance, "totalDeposited", "totalSpent", 
           "isActive", "createdAt", "updatedAt") 
           VALUES ($1, $2, $2, 0, true, NOW(), NOW())`,
          [user.id, initialBalance]
        );
        console.log(`  ✓ Кошелек для ${user.firstName}: ${initialBalance} ₽`);
        newWallets++;
      }
    }
    console.log(`✅ Кошельков в базе: ${createdUsers.length} (новых: ${newWallets})\n`);

    // ============================================
    // 5. СОЗДАНИЕ ЗАКАЗОВ
    // ============================================
    console.log('📋 Создаем заказы...');
    let totalOrders = 0;
    const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
    const paymentMethods = ['cash_on_delivery', 'card_on_delivery', 'wallet', 'yookassa_card', 'yookassa_sbp'];
    
    for (const user of createdUsers) {
      // Каждый пользователь делает от 1 до 5 заказов
      const ordersCount = randomInt(1, 5);
      
      for (let i = 0; i < ordersCount; i++) {
        const orderNumber = generateOrderNumber();
        const status = randomItem(orderStatuses);
        const paymentMethod = randomItem(paymentMethods);
        const paymentStatus = ['DELIVERED', 'COMPLETED'].includes(status) ? 'PAID' : 
                             status === 'CANCELLED' ? 'FAILED' : 'PENDING';
        
        // Выбираем случайные товары для заказа (от 1 до 4 товаров)
        const itemsCount = randomInt(1, 4);
        const orderProducts = [];
        const usedProductIds = new Set();
        
        for (let j = 0; j < itemsCount; j++) {
          let product;
          do {
            product = randomItem(createdProducts);
          } while (usedProductIds.has(product.id));
          
          usedProductIds.add(product.id);
          orderProducts.push({
            ...product,
            quantity: randomInt(1, 3)
          });
        }
        
        // Рассчитываем общую сумму
        const totalAmount = orderProducts.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
        
        // Создаем заказ
        const orderResult = await queryRunner.query(
          `INSERT INTO orders ("orderNumber", "userId", "totalAmount", status, 
           "paymentMethod", "paymentStatus", "deliveryAddress", phone, notes, 
           "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) 
           RETURNING id`,
          [
            orderNumber,
            user.id,
            totalAmount,
            status,
            paymentMethod,
            paymentStatus,
            `${user.addresses[0].city}, ${user.addresses[0].street}, д. ${user.addresses[0].house}, кв. ${user.addresses[0].apartment}`,
            user.phone,
            randomInt(0, 10) > 7 ? 'Позвоните за час до доставки' : null,
            randomPastDate(60) // заказ сделан в последние 60 дней
          ]
        );
        
        const orderId = orderResult[0].id;
        
        // Создаем позиции заказа
        for (const item of orderProducts) {
          await queryRunner.query(
            `INSERT INTO order_items ("orderId", "productId", quantity, price) 
             VALUES ($1, $2, $3, $4)`,
            [orderId, item.id, item.quantity, item.price]
          );
          
          // Обновляем статистику продаж товара
          await queryRunner.query(
            `UPDATE products 
             SET "salesCount" = "salesCount" + $1 
             WHERE id = $2`,
            [item.quantity, item.id]
          );
        }
        
        totalOrders++;
        console.log(`  ✓ Заказ #${orderNumber} для ${user.firstName}: ${totalAmount} ₽ (${orderProducts.length} товаров)`);
      }
    }
    console.log(`✅ Создано ${totalOrders} заказов\n`);

    // ============================================
    // 6. СОЗДАНИЕ ОТЗЫВОВ
    // ============================================
    console.log('⭐ Создаем отзывы...');
    let totalReviews = 0;
    
    const reviewTexts = [
      'Отличный товар! Полностью соответствует описанию.',
      'Очень доволен покупкой, рекомендую!',
      'Качество на высоте, доставка быстрая.',
      'Хороший товар за свои деньги.',
      'Превзошел все ожидания!',
      'Товар хороший, но доставка задержалась.',
      'Нормально, но ожидал большего.',
      'За эту цену отличный вариант.',
      'Пользуюсь уже месяц - все отлично!',
      'Рекомендую к покупке, не пожалеете.'
    ];
    
    // Создаем отзывы для случайных товаров
    for (let i = 0; i < 50; i++) {
      const product = randomItem(createdProducts);
      const user = randomItem(createdUsers);
      const rating = randomInt(3, 5); // рейтинг от 3 до 5
      const comment = randomItem(reviewTexts);
      
      await queryRunner.query(
        `INSERT INTO reviews ("userId", "productId", rating, comment, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $5)`,
        [user.id, product.id, rating, comment, randomPastDate(30)]
      );
      
      totalReviews++;
    }
    
    // Обновляем средний рейтинг и количество отзывов для товаров
    await queryRunner.query(`
      UPDATE products p
      SET "averageRating" = COALESCE((
        SELECT AVG(rating)::numeric(3,2)
        FROM reviews r
        WHERE r."productId" = p.id
      ), 0),
      "reviewCount" = COALESCE((
        SELECT COUNT(*)
        FROM reviews r
        WHERE r."productId" = p.id
      ), 0)
    `);
    
    console.log(`✅ Создано ${totalReviews} отзывов\n`);

    // ============================================
    // 7. СОЗДАНИЕ ИЗБРАННОГО
    // ============================================
    console.log('❤️  Создаем избранное...');
    let totalWishlist = 0;
    
    for (const user of createdUsers) {
      // Каждый пользователь добавляет от 2 до 8 товаров в избранное
      const wishlistCount = randomInt(2, 8);
      const usedProductIds = new Set();
      
      for (let i = 0; i < wishlistCount; i++) {
        let product;
        do {
          product = randomItem(createdProducts);
        } while (usedProductIds.has(product.id));
        
        usedProductIds.add(product.id);
        
        await queryRunner.query(
          `INSERT INTO wishlist ("userId", "productId", "createdAt") 
           VALUES ($1, $2, $3)`,
          [user.id, product.id, randomPastDate(90)]
        );
        
        totalWishlist++;
      }
      
      console.log(`  ✓ ${user.firstName}: ${wishlistCount} товаров в избранном`);
    }
    console.log(`✅ Создано ${totalWishlist} записей в избранном\n`);

    // ============================================
    // 8. СОЗДАНИЕ КОРЗИН
    // ============================================
    console.log('🛒 Создаем корзины...');
    let totalCartItems = 0;
    
    // Половина пользователей имеет товары в корзине
    const usersWithCart = createdUsers.slice(0, Math.floor(createdUsers.length / 2));
    
    for (const user of usersWithCart) {
      const cartItemsCount = randomInt(1, 5);
      const usedProductIds = new Set();
      
      for (let i = 0; i < cartItemsCount; i++) {
        let product;
        do {
          product = randomItem(createdProducts);
        } while (usedProductIds.has(product.id));
        
        usedProductIds.add(product.id);
        
        await queryRunner.query(
          `INSERT INTO cart_items ("userId", "productId", quantity, "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [user.id, product.id, randomInt(1, 3)]
        );
        
        totalCartItems++;
      }
      
      console.log(`  ✓ ${user.firstName}: ${cartItemsCount} товаров в корзине`);
    }
    console.log(`✅ Создано ${totalCartItems} товаров в корзинах\n`);

    // ============================================
    // ЗАВЕРШЕНИЕ
    // ============================================
    await queryRunner.release();
    await AppDataSource.destroy();

    console.log('═══════════════════════════════════════');
    console.log('🎉 ПОСЕВ ДАННЫХ ЗАВЕРШЕН УСПЕШНО!');
    console.log('═══════════════════════════════════════');
    console.log(`📦 Категорий: ${createdCategories.length}`);
    console.log(`🛍️  Товаров: ${createdProducts.length}`);
    console.log(`👥 Пользователей: ${createdUsers.length}`);
    console.log(`💰 Кошельков: ${createdUsers.length}`);
    console.log(`📋 Заказов: ${totalOrders}`);
    console.log(`⭐ Отзывов: ${totalReviews}`);
    console.log(`❤️  Избранное: ${totalWishlist}`);
    console.log(`🛒 Корзины: ${totalCartItems}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Ошибка при посеве данных:', error);
    process.exit(1);
  }
}

// Запуск
seed();
