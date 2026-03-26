import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../../entities/transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { User } from '../../entities/user.entity';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly yookassaShopId = process.env.YOOKASSA_SHOP_ID || 'test_shop_id';
  private readonly yookassaSecretKey = process.env.YOOKASSA_SECRET_KEY || 'test_secret_key';
  private readonly yookassaApiUrl = 'https://api.yookassa.ru/v3';

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Получить или создать кошелек пользователя
  async getOrCreateWallet(userId: number): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({ where: { userId } });
    
    if (!wallet) {
      wallet = this.walletRepository.create({ userId, balance: 0 });
      await this.walletRepository.save(wallet);
    }
    
    return wallet;
  }

  // Получить баланс
  async getBalance(userId: number): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return Number(wallet.balance);
  }

  // Получить все транзакции пользователя
  async getTransactions(userId: number): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Пополнение баланса через ЮKassa
  async createDepositPayment(userId: number, amount: number, paymentMethod: 'card' | 'sbp'): Promise<any> {
    if (amount <= 0) {
      throw new BadRequestException('Сумма должна быть больше 0');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем, настроена ли ЮKassa
    const isYookassaConfigured = 
      this.yookassaShopId !== 'test_shop_id' && 
      this.yookassaSecretKey !== 'test_secret_key';

    if (!isYookassaConfigured) {
      // Если ЮKassa не настроена, создаем транзакцию и сразу пополняем баланс
      const transaction = this.transactionRepository.create({
        userId,
        amount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        paymentMethod: 'instant_payment',
        description: `Пополнение баланса на ${amount} ₽`,
      });
      await this.transactionRepository.save(transaction);
      
      // Сразу пополняем баланс
      await this.addToBalance(userId, amount);

      return {
        transactionId: transaction.id,
        paymentId: 'payment_' + transaction.id,
        confirmationUrl: null,
        status: 'succeeded',
        message: 'Баланс успешно пополнен',
      };
    }

    // Создаем транзакцию
    const transaction = this.transactionRepository.create({
      userId,
      amount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      paymentMethod: paymentMethod === 'card' ? 'yookassa_card' : 'yookassa_sbp',
      description: `Пополнение баланса на ${amount} ₽`,
    });
    await this.transactionRepository.save(transaction);

    // Создаем платеж в ЮKassa
    try {
      const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3001';
      const paymentData = {
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB',
        },
        confirmation: {
          type: 'redirect',
          return_url: `${websiteUrl}/finance?payment=success`,
        },
        capture: true,
        description: `Пополнение баланса`,
        metadata: {
          transactionId: transaction.id,
          userId: userId,
        },
      };

      // Добавляем метод оплаты
      if (paymentMethod === 'sbp') {
        paymentData['payment_method_data'] = {
          type: 'sbp',
        };
      }

      const response = await axios.post(
        `${this.yookassaApiUrl}/payments`,
        paymentData,
        {
          auth: {
            username: this.yookassaShopId,
            password: this.yookassaSecretKey,
          },
          headers: {
            'Idempotence-Key': `deposit_${transaction.id}_${Date.now()}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Обновляем транзакцию с ID платежа
      transaction.externalId = response.data.id;
      transaction.metadata = response.data;
      await this.transactionRepository.save(transaction);

      return {
        transactionId: transaction.id,
        paymentId: response.data.id,
        confirmationUrl: response.data.confirmation.confirmation_url,
        status: response.data.status,
      };
    } catch (error) {
      console.error('Payment error:', error.response?.data || error.message);
      transaction.status = TransactionStatus.FAILED;
      await this.transactionRepository.save(transaction);
      throw new BadRequestException('Ошибка создания платежа. Попробуйте другой способ оплаты');
    }
  }

  // Обработка callback от ЮKassa
  async handleYookassaCallback(paymentId: string): Promise<void> {
    try {
      console.log('Checking payment status:', paymentId);
      
      // Получаем информацию о платеже
      const response = await axios.get(
        `${this.yookassaApiUrl}/payments/${paymentId}`,
        {
          auth: {
            username: this.yookassaShopId,
            password: this.yookassaSecretKey,
          },
        },
      );

      const payment = response.data;
      console.log('Payment status:', payment.status);
      
      // Ищем транзакцию по externalId
      const transaction = await this.transactionRepository.findOne({
        where: { externalId: paymentId },
      });

      if (!transaction) {
        console.error('Transaction not found for payment:', paymentId);
        return;
      }

      // Обновляем статус транзакции и пополняем баланс ТОЛЬКО если статус изменился
      if (payment.status === 'succeeded' && transaction.status === TransactionStatus.PENDING) {
        // Сначала обновляем статус
        transaction.status = TransactionStatus.COMPLETED;
        await this.transactionRepository.save(transaction);

        // Только после этого пополняем баланс
        await this.addToBalance(transaction.userId, transaction.amount);
        console.log('Balance updated for user:', transaction.userId, 'amount:', transaction.amount);
      } else if (payment.status === 'succeeded' && transaction.status === TransactionStatus.COMPLETED) {
        console.log('Payment already processed, skipping balance update');
      } else if (payment.status === 'canceled' && transaction.status !== TransactionStatus.CANCELLED) {
        transaction.status = TransactionStatus.CANCELLED;
        await this.transactionRepository.save(transaction);
      }
    } catch (error) {
      console.error('Callback processing error:', error.response?.data || error.message);
    }
  }

  // Добавить средства на баланс
  async addToBalance(userId: number, amount: number): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet(userId);
    // ВАЖНО: преобразуем в числа перед сложением
    wallet.balance = Number(wallet.balance) + Number(amount);
    wallet.totalDeposited = Number(wallet.totalDeposited) + Number(amount);
    return this.walletRepository.save(wallet);
  }

  // Списать средства с баланса
  async deductFromBalance(userId: number, amount: number, description: string, orderId?: number): Promise<void> {
    const wallet = await this.getOrCreateWallet(userId);
    
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Недостаточно средств на балансе');
    }

    wallet.balance = Number(wallet.balance) - amount;
    wallet.totalSpent = Number(wallet.totalSpent) + amount;
    await this.walletRepository.save(wallet);

    // Создаем транзакцию списания
    const transaction = this.transactionRepository.create({
      userId,
      amount,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      paymentMethod: 'wallet',
      description,
      orderId,
    });
    await this.transactionRepository.save(transaction);
  }

  // Оплата заказа с баланса
  async payOrderFromWallet(userId: number, orderId: number, amount: number): Promise<void> {
    await this.deductFromBalance(
      userId,
      amount,
      `Оплата заказа #${orderId}`,
      orderId,
    );
  }

  // Возврат средств
  async refund(userId: number, amount: number, description: string, orderId?: number): Promise<void> {
    const wallet = await this.getOrCreateWallet(userId);
    wallet.balance = Number(wallet.balance) + amount;
    await this.walletRepository.save(wallet);

    const transaction = this.transactionRepository.create({
      userId,
      amount,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      paymentMethod: 'wallet',
      description,
      orderId,
    });
    await this.transactionRepository.save(transaction);
  }
}
