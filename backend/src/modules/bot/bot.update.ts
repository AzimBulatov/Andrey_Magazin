import { Update, Ctx, Start, Help, Command, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { AuthService } from '../auth/auth.service';
import { User } from '../../entities/user.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Product } from '../../entities/product.entity';

interface TelegramContext extends Context {
  session?: any;
}

@Update()
@Injectable()
export class BotUpdate {
  // Хранилище для состояний пользователей
  private userStates = new Map<
    number,
    {
      awaitingPhone?: boolean;
      awaitingAddress?: boolean;
      phone?: string;
    }
  >();

  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Получить или создать пользователя
  private async getOrCreateUser(ctx: TelegramContext): Promise<User> {
    if (!ctx.from) {
      throw new Error('User information not available');
    }

    const telegramId = ctx.from.id.toString();
    
    let user = await this.userRepository.findOne({
      where: { telegramId },
    });

    if (!user) {
      user = this.userRepository.create({
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  // Главное меню с кнопкой корзины
  private getMainKeyboard(cartCount: number = 0) {
    return {
      keyboard: [
        [{ text: '📦 Категории' }, { text: `🛒 Корзина ${cartCount > 0 ? `(${cartCount})` : ''}` }],
        [{ text: '📋 Мои заказы' }, { text: '🌐 Войти на сайт' }],
        [{ text: 'ℹ️ Помощь' }],
      ],
      resize_keyboard: true,
    };
  }

  @Start()
  async start(@Ctx() ctx: TelegramContext) {
    const user = await this.getOrCreateUser(ctx);
    const cartCount = await this.cartRepository.count({ where: { userId: user.id } });

    await ctx.reply(
      `👋 Добро пожаловать, ${user.firstName}!\n\n` +
        '🛍 Наш магазин к вашим услугам!\n\n' +
        '📱 Выберите действие из меню ниже:',
      {
        reply_markup: this.getMainKeyboard(cartCount),
      },
    );
  }

  @Help()
  async help(@Ctx() ctx: TelegramContext) {
    await ctx.reply(
      '📖 Инструкция по использованию:\n\n' +
        '📦 Категории - товары по категориям\n' +
        '🛒 Корзина - ваши выбранные товары\n' +
        '📋 Мои заказы - история покупок\n\n' +
        '� Выберсите категорию, затем товар и добавьте в корзину!\n' +
        '� Оплата к урьеру при получении',
    );
  }

  @Command('catalog')
  async catalog(@Ctx() ctx: TelegramContext) {
    const user = await this.getOrCreateUser(ctx);
    const products = await this.productsService.findAll(undefined, true);

    if (products.length === 0) {
      await ctx.reply('😔 Товары пока не добавлены', {
        reply_markup: this.getMainKeyboard(),
      });
      return;
    }

    await ctx.reply(`🛍 Каталог товаров (${products.length}):\n\nПролистайте товары ниже:`);

    for (const product of products.slice(0, 20)) {
      await this.sendProduct(ctx, product, user.id);
    }
  }

  @Command('categories')
  async categories(@Ctx() ctx: TelegramContext) {

    await this.getOrCreateUser(ctx);
    const categories = await this.categoriesService.findAll(true);

    if (categories.length === 0) {
      await ctx.reply('😔 Категории пока не добавлены', {
        reply_markup: this.getMainKeyboard(),
      });
      return;
    }

    const buttons = categories.map((cat) => [
      {
        text: `${cat.name} (${cat.products?.length || 0} товаров)`,
        callback_data: `cat_${cat.id}`,
      },
    ]);

    buttons.push([{ text: '🔙 Главное меню', callback_data: 'main_menu' }]);

    await ctx.reply('📦 Выберите категорию:', {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  @Command('cart')
  async cart(@Ctx() ctx: TelegramContext) {
    await this.showCart(ctx);
  }

  private async showCart(ctx: TelegramContext) {
    const user = await this.getOrCreateUser(ctx);
    const cartItems = await this.cartRepository.find({
      where: { userId: user.id },
      relations: ['product', 'product.category'],
    });

    if (cartItems.length === 0) {
      await ctx.reply('🛒 Ваша корзина пуста\n\nДобавьте товары из каталога!', {
        reply_markup: this.getMainKeyboard(0),
      });
      return;
    }

    let total = 0;
    let message = '🛒 Ваша корзина:\n\n';

    cartItems.forEach((item, index) => {
      const itemTotal = item.product.price * item.quantity;
      total += itemTotal;
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   ${item.quantity} шт × ${item.product.price} ₽ = ${itemTotal} ₽\n\n`;
    });

    message += `💰 Итого: ${total} ₽`;

    const buttons = [
      [
        { text: '✅ Оформить заказ', callback_data: 'checkout' },
        { text: '🗑 Очистить корзину', callback_data: 'clear_cart' },
      ],
      [{ text: '🔙 Продолжить покупки', callback_data: 'main_menu' }],
    ];

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  @Command('orders')
  async orders(@Ctx() ctx: TelegramContext) {
    const user = await this.getOrCreateUser(ctx);
    const orders = await this.orderRepository.find({
      where: { userId: user.id },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    if (orders.length === 0) {
      await ctx.reply('📋 У вас пока нет заказов', {
        reply_markup: this.getMainKeyboard(),
      });
      return;
    }

    const statusNames = {
      PENDING: '⏳ Ожидает подтверждения',
      CONFIRMED: '✅ Подтвержден',
      PROCESSING: '📦 В обработке',
      SHIPPED: '🚚 Отправлен',
      DELIVERED: '✅ Доставлен',
      CANCELLED: '❌ Отменен',
      COMPLETED: '✅ Завершен',
    };

    // Разделяем на активные и завершенные
    const activeOrders = orders.filter(
      (o) => !['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status),
    );
    const completedOrders = orders.filter((o) =>
      ['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status),
    );

    let message = '📋 Ваши заказы:\n\n';

    if (activeOrders.length > 0) {
      message += '🔄 АКТИВНЫЕ ЗАКАЗЫ:\n\n';
      activeOrders.forEach((order) => {
        message += `📦 Заказ #${order.orderNumber}\n`;
        message += `💰 Сумма: ${order.totalAmount} ₽\n`;
        message += `📅 Дата: ${new Date(order.createdAt).toLocaleDateString('ru-RU')}\n`;
        message += `📊 Статус: ${statusNames[order.status]}\n\n`;
      });
    }

    if (completedOrders.length > 0) {
      message += '✅ ЗАВЕРШЕННЫЕ ЗАКАЗЫ:\n\n';
      completedOrders.slice(0, 5).forEach((order) => {
        message += `📦 Заказ #${order.orderNumber}\n`;
        message += `💰 Сумма: ${order.totalAmount} ₽\n`;
        message += `📅 Дата: ${new Date(order.createdAt).toLocaleDateString('ru-RU')}\n`;
        message += `📊 Статус: ${statusNames[order.status]}\n\n`;
      });
    }

    const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
    if (activeOrders.length > 0) {
      buttons.push([{ text: '🔄 Обновить статусы', callback_data: 'refresh_orders' }]);
    }
    buttons.push([{ text: '🔙 Главное меню', callback_data: 'main_menu' }]);

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  // Обработчик всех текстовых сообщений (кнопки меню)
  @On('text')
  async handleText(@Ctx() ctx: TelegramContext) {
    if (!ctx.message || !('text' in ctx.message)) return;
    if (!ctx.from) return;

    const text = ctx.message.text;
    const user = await this.getOrCreateUser(ctx);
    const userId = user.id;

    // Получаем состояние пользователя
    const userState = this.userStates.get(userId) || {};

    // Обработка ввода телефона
    if (userState.awaitingPhone) {
      userState.phone = text;
      userState.awaitingPhone = false;
      userState.awaitingAddress = true;
      this.userStates.set(userId, userState);

      await ctx.reply(
        '📍 Отлично! Теперь укажите адрес доставки:\n\n' +
          'Например: г. Москва, ул. Ленина, д. 10, кв. 5',
      );
      return;
    }

    // Обработка ввода адреса
    if (userState.awaitingAddress) {
      const phone = userState.phone || '';
      const address = text;

      // Проверяем что телефон был указан
      if (!phone) {
        await ctx.reply('❌ Ошибка: телефон не был указан. Попробуйте снова.');
        this.userStates.delete(userId);
        return;
      }

      // Очищаем состояние
      this.userStates.delete(userId);

      // Создаем заказ
      await this.createOrder(ctx, user, phone, address);
      return;
    }

    // Категории
    if (text === '📦 Категории') {
      await this.categories(ctx);
      return;
    }

    // Корзина
    if (text.startsWith('🛒 Корзина')) {
      await this.showCart(ctx);
      return;
    }

    // Мои заказы
    if (text === '📋 Мои заказы') {
      await this.orders(ctx);
      return;
    }

    // Помощь
    if (text === 'ℹ️ Помощь') {
      await this.help(ctx);
      return;
    }

    // Войти на сайт
    if (text === '🌐 Войти на сайт') {
      await this.generateWebsiteLink(ctx);
      return;
    }
  }

  private async sendProduct(ctx: TelegramContext, product: any, userId: number) {
    // Получаем количество этого товара в корзине
    const cartItem = await this.cartRepository.findOne({
      where: { userId, productId: product.id },
    });
    const inCartCount = cartItem ? cartItem.quantity : 0;

    const message =
      `📦 ${product.name}\n\n` +
      `${product.description || 'Описание отсутствует'}\n\n` +
      `💰 Цена: ${product.price} ₽\n` +
      `📊 В наличии: ${product.stock} шт.\n` +
      `📁 Категория: ${product.category?.name || 'Без категории'}`;

    const cartText = inCartCount > 0 ? `🛒 В корзине: ${inCartCount} шт` : '🛒 Перейти в корзину';

    const buttons = [
      [
        { text: '➕ 1 шт', callback_data: `add_${product.id}_1` },
        { text: '➕ 2 шт', callback_data: `add_${product.id}_2` },
        { text: '➕ 3 шт', callback_data: `add_${product.id}_3` },
      ],
      [{ text: cartText, callback_data: 'show_cart' }],
    ];

    if (product.image) {
      const imageUrl = `${process.env.API_URL}/${product.image}`;
      try {
        await ctx.replyWithPhoto(imageUrl, {
          caption: message,
          reply_markup: { inline_keyboard: buttons },
        });
      } catch (error) {
        await ctx.reply(message, {
          reply_markup: { inline_keyboard: buttons },
        });
      }
    } else {
      await ctx.reply(message, {
        reply_markup: { inline_keyboard: buttons },
      });
    }
  }

  @On('callback_query')
  async onCallback(@Ctx() ctx: TelegramContext) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const data = ctx.callbackQuery.data;
    const user = await this.getOrCreateUser(ctx);

    try {
      // Добавление в корзину
      if (data.startsWith('add_')) {
        const [, productId, quantity] = data.split('_');
        const cartCount = await this.addToCart(user.id, parseInt(productId), parseInt(quantity));
        await ctx.answerCbQuery(`✅ Добавлено ${quantity} шт. в корзину!`);

        // Получаем количество этого конкретного товара в корзине
        const cartItem = await this.cartRepository.findOne({
          where: { userId: user.id, productId: parseInt(productId) },
        });
        const thisProductCount = cartItem ? cartItem.quantity : 0;

        // Обновляем клавиатуру с количеством конкретного товара
        try {
          await ctx.editMessageReplyMarkup({
            inline_keyboard: [
              [
                { text: '➕ 1 шт', callback_data: `add_${productId}_1` },
                { text: '➕ 2 шт', callback_data: `add_${productId}_2` },
                { text: '➕ 3 шт', callback_data: `add_${productId}_3` },
              ],
              [
                {
                  text: `🛒 В корзине: ${thisProductCount} шт`,
                  callback_data: 'show_cart',
                },
              ],
            ],
          });
        } catch (e) {
          // Игнорируем ошибку если сообщение не изменилось
        }
        return;
      }

      // Обновить статусы заказов
      if (data === 'refresh_orders') {
        await ctx.answerCbQuery('🔄 Обновление...');
        await this.orders(ctx);
        return;
      }

      // Показать корзину
      if (data === 'show_cart') {
        await ctx.answerCbQuery();
        await this.showCart(ctx);
        return;
      }

      // Очистить корзину
      if (data === 'clear_cart') {
        await this.cartRepository.delete({ userId: user.id });
        await ctx.answerCbQuery('🗑 Корзина очищена');
        await ctx.editMessageText('🛒 Корзина очищена', {
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 Главное меню', callback_data: 'main_menu' }]],
          },
        });
        return;
      }

      // Оформление заказа
      if (data === 'checkout') {
        await ctx.answerCbQuery();

        // Устанавливаем состояние ожидания телефона
        this.userStates.set(user.id, { awaitingPhone: true });

        await ctx.reply(
          '📞 Для оформления заказа укажите номер телефона:\n\n' +
            'Например: +7 (999) 123-45-67',
        );
        return;
      }

      // Категория
      if (data.startsWith('cat_')) {
        const categoryId = parseInt(data.replace('cat_', ''));
        await ctx.answerCbQuery();
        const products = await this.productsService.findAll(categoryId, true);

        if (products.length === 0) {
          await ctx.reply('В этой категории пока нет товаров');
          return;
        }

        const category = await this.categoriesService.findOne(categoryId);
        await ctx.reply(`📦 ${category.name} (${products.length} товаров):`);

        for (const product of products.slice(0, 20)) {
          await this.sendProduct(ctx, product, user.id);
        }
        return;
      }

      // Главное меню
      if (data === 'main_menu') {
        await ctx.answerCbQuery();
        const cartCount = await this.cartRepository.count({ where: { userId: user.id } });
        await ctx.reply('🏠 Главное меню', {
          reply_markup: this.getMainKeyboard(cartCount),
        });
        return;
      }

      // FAQ обработчики
      if (data.startsWith('faq_')) {
        const topic = data.replace('faq_', '');
        await this.handleFAQ(ctx, topic);
        return;
      }

      // Назад к FAQ
      if (data === 'back_to_faq') {
        await this.help(ctx);
        return;
      }
    } catch (error) {
      console.error('Callback error:', error);
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  private async addToCart(userId: number, productId: number, quantity: number): Promise<number> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    
    if (!product || product.stock < quantity) {
      throw new Error('Недостаточно товара на складе');
    }

    let cartItem = await this.cartRepository.findOne({
      where: { userId, productId },
    });

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = this.cartRepository.create({
        userId,
        productId,
        quantity,
      });
    }

    await this.cartRepository.save(cartItem);

    // Возвращаем общее количество товаров в корзине
    const totalCount = await this.cartRepository
      .createQueryBuilder('cart')
      .select('SUM(cart.quantity)', 'total')
      .where('cart.userId = :userId', { userId })
      .getRawOne();

    return parseInt(totalCount.total) || 0;
  }

  private async createOrder(ctx: TelegramContext, user: User, phone: string, address: string) {
    const cartItems = await this.cartRepository.find({
      where: { userId: user.id },
      relations: ['product'],
    });

    if (cartItems.length === 0) {
      await ctx.reply('🛒 Корзина пуста');
      return;
    }

    // Проверка наличия
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        await ctx.reply(
          `❌ Недостаточно товара "${item.product.name}" на складе\n` +
            `Доступно: ${item.product.stock} шт., в корзине: ${item.quantity} шт.`,
        );
        return;
      }
    }

    // Создание заказа
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const orderNumber = await this.generateOrderNumber();
    const order = this.orderRepository.create({
      userId: user.id,
      orderNumber,
      totalAmount,
      status: OrderStatus.PENDING,
      paymentMethod: 'cash_on_delivery',
      phone,
      deliveryAddress: address,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Создание позиций заказа
    for (const item of cartItems) {
      const orderItem = this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      });
      await this.orderItemRepository.save(orderItem);

      // Уменьшение остатка
      item.product.stock -= item.quantity;
      item.product.salesCount += item.quantity;
      await this.productRepository.save(item.product);
    }

    // Очистка корзины
    await this.cartRepository.delete({ userId: user.id });

    await ctx.reply(
      `✅ Заказ #${orderNumber} успешно создан!\n\n` +
        `💰 Сумма: ${totalAmount} ₽\n` +
        `📦 Товаров: ${cartItems.length}\n\n` +
        `Товар будет доставлен по адресу ${address}, ` +
        `в случае необходимости с вами свяжутся по номеру ${phone}, ` +
        `оплата курьеру при получении.`,
      {
        reply_markup: this.getMainKeyboard(0),
      },
    );
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const count = await this.orderRepository.count();
    const orderNum = (count + 1).toString().padStart(6, '0');
    return `${year}${month}${day}-${orderNum}`;
  }

  // Генерация ссылки для входа на сайт
  @Command('website')
  async websiteLogin(@Ctx() ctx: TelegramContext) {
    await this.generateWebsiteLink(ctx);
  }

  private async generateWebsiteLink(ctx: TelegramContext) {
    try {
      const user = await this.getOrCreateUser(ctx);
      
      if (!user.telegramId) {
        await ctx.reply('❌ Ошибка: не удалось определить ваш Telegram ID');
        return;
      }

      console.log('Generating token for user:', user.telegramId);

      // Генерируем токен через AuthService
      const token = await this.authService.generateTelegramAuthToken(user.telegramId);
      
      console.log('Token generated successfully');

      // Формируем ссылку (замените на ваш реальный домен)
      const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:5173';
      const authLink = `${websiteUrl}/auth/telegram?token=${token}`;

      // Проверяем, является ли URL публичным (для inline кнопок)
      const isPublicUrl = websiteUrl.startsWith('https://') && !websiteUrl.includes('localhost');

      if (isPublicUrl) {
        // Если публичный URL - используем кнопку
        await ctx.reply(
          '🌐 Вход на сайт\n\n' +
            'Нажмите на кнопку ниже, чтобы войти на сайт.\n' +
            '⏱ Ссылка действительна 10 минут.',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔐 Войти на сайт', url: authLink }],
                [{ text: '🔙 Главное меню', callback_data: 'main_menu' }],
              ],
            },
          },
        );
      } else {
        // Если localhost - отправляем ссылку текстом
        await ctx.reply(
          '🌐 Вход на сайт\n\n' +
            '🔗 Скопируйте и откройте эту ссылку в браузере:\n\n' +
            `${authLink}\n\n` +
            '⏱ Ссылка действительна 10 минут.',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Главное меню', callback_data: 'main_menu' }],
              ],
            },
          },
        );
      }
    } catch (error) {
      console.error('Error generating website link:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      await ctx.reply(
        '❌ Произошла ошибка при генерации ссылки.\n\n' +
        `Детали: ${error.message || 'Неизвестная ошибка'}\n\n` +
        'Попробуйте позже или обратитесь в поддержку.'
      );
    }
  }

  // FAQ обработчики
  private async handleFAQ(ctx: TelegramContext, topic: string) {
    const faqContent: Record<string, { title: string; text: string }> = {
      order: {
        title: '❓ Как сделать заказ?',
        text:
          '1️⃣ Выберите "📦 Категории" в меню\n' +
          '2️⃣ Просмотрите товары и нажмите "➕" для добавления в корзину\n' +
          '3️⃣ Перейдите в "🛒 Корзину"\n' +
          '4️⃣ Нажмите "✅ Оформить заказ"\n' +
          '5️⃣ Укажите телефон и адрес доставки\n' +
          '6️⃣ Готово! Ожидайте звонка оператора',
      },
      payment: {
        title: '💳 Способы оплаты',
        text:
          '💵 Наличными курьеру при получении\n' +
          '💳 Картой курьеру при получении\n' +
          '🏦 Онлайн-оплата на сайте (скоро)\n\n' +
          'Оплата производится только после проверки товара!',
      },
      delivery: {
        title: '🚚 Доставка',
        text:
          '📍 Доставка по всему городу\n' +
          '⏱ Срок доставки: 1-3 рабочих дня\n' +
          '💰 Стоимость: рассчитывается индивидуально\n' +
          '📦 Бесплатная доставка при заказе от 5000 ₽\n\n' +
          'Курьер свяжется с вами для уточнения времени доставки.',
      },
      return: {
        title: '↩️ Возврат товара',
        text:
          '✅ Возврат в течение 14 дней\n' +
          '📦 Товар должен быть в оригинальной упаковке\n' +
          '🏷 С сохраненными бирками и этикетками\n' +
          '💰 Возврат денег в течение 3-5 рабочих дней\n\n' +
          'Для оформления возврата свяжитесь с поддержкой.',
      },
      account: {
        title: '👤 Мой аккаунт',
        text:
          '🌐 Войти на сайт - нажмите кнопку ниже\n' +
          '📋 Мои заказы - история всех покупок\n' +
          '🛒 Корзина - ваши выбранные товары\n' +
          '📞 Ваши данные сохраняются автоматически\n\n' +
          'Для входа на сайт используйте кнопку "🌐 Войти на сайт" в главном меню.',
      },
      contact: {
        title: '📞 Связаться с нами',
        text:
          '📧 Email: support@example.com\n' +
          '📱 Телефон: +7 (999) 123-45-67\n' +
          '⏰ Время работы: Пн-Пт 9:00-18:00\n' +
          '💬 Telegram: @support_bot\n\n' +
          'Мы всегда рады помочь вам!',
      },
    };

    const content = faqContent[topic];
    if (!content) {
      await ctx.answerCbQuery('❌ Раздел не найден');
      return;
    }

    await ctx.answerCbQuery();
    await ctx.reply(content.title + '\n\n' + content.text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Назад к FAQ', callback_data: 'back_to_faq' }],
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }],
        ],
      },
    });
  }
}

