import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotUpdate } from './bot.update';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { AuthModule } from '../auth/auth.module';
import { Product } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';
import { User } from '../../entities/user.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';

const botToken = process.env.TELEGRAM_BOT_TOKEN;

@Module({
  imports: [
    ...(botToken
      ? [
          TelegrafModule.forRoot({
            token: botToken,
          }),
        ]
      : []),
    TypeOrmModule.forFeature([Product, Category, User, CartItem, Order, OrderItem]),
    ProductsModule,
    CategoriesModule,
    AuthModule,
  ],
  providers: botToken ? [BotUpdate] : [],
})
export class BotModule {}
