import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Получить баланс пользователя
  @Get('wallet/:userId')
  async getWallet(@Param('userId', ParseIntPipe) userId: number) {
    const balance = await this.paymentsService.getBalance(userId);
    const wallet = await this.paymentsService.getOrCreateWallet(userId);
    return {
      balance,
      totalDeposited: wallet.totalDeposited,
      totalSpent: wallet.totalSpent,
    };
  }

  // Получить транзакции пользователя
  @Get('transactions/:userId')
  async getTransactions(@Param('userId', ParseIntPipe) userId: number) {
    return this.paymentsService.getTransactions(userId);
  }

  // Создать платеж для пополнения
  @Post('deposit')
  async createDeposit(
    @Body() body: { userId: number; amount: number; paymentMethod: 'card' | 'sbp' },
  ) {
    return this.paymentsService.createDepositPayment(
      body.userId,
      body.amount,
      body.paymentMethod,
    );
  }

  // Оплатить заказ с баланса
  @Post('pay-order')
  async payOrder(
    @Body() body: { userId: number; orderId: number; amount: number },
  ) {
    await this.paymentsService.payOrderFromWallet(
      body.userId,
      body.orderId,
      body.amount,
    );
    return { success: true, message: 'Заказ оплачен' };
  }

  // Webhook от ЮKassa (POST)
  @Post('webhook')
  async yookassaWebhook(@Body() body: any) {
    console.log('ЮKassa webhook:', body);
    
    if (body.event === 'payment.succeeded' && body.object?.id) {
      await this.paymentsService.handleYookassaCallback(body.object.id);
    }
    
    return { success: true };
  }

  // Проверка статуса платежа (вызывается при возврате пользователя)
  @Get('check-payment/:paymentId')
  async checkPayment(@Param('paymentId') paymentId: string) {
    await this.paymentsService.handleYookassaCallback(paymentId);
    return { success: true, message: 'Платеж обработан' };
  }

  // Получить последний платеж пользователя
  @Get('last-payment/:userId')
  async getLastPayment(@Param('userId', ParseIntPipe) userId: number) {
    const transactions = await this.paymentsService.getTransactions(userId);
    const lastPending = transactions.find(t => t.status === 'PENDING' && t.type === 'DEPOSIT');
    
    if (lastPending && lastPending['externalId']) {
      // Проверяем статус этого платежа
      await this.paymentsService.handleYookassaCallback(lastPending['externalId']);
      
      // Получаем обновленную транзакцию
      const updated = await this.paymentsService.getTransactions(userId);
      return updated.find(t => t.id === lastPending.id);
    }
    
    return null;
  }
}
