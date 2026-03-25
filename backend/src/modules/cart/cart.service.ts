import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../../entities/cart-item.entity';
import { Product } from '../../entities/product.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getCart(userId: number) {
    const items = await this.cartItemRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });

    // Автоматически корректируем количество, если товара стало меньше
    for (const item of items) {
      if (item.product && item.quantity > item.product.stock) {
        if (item.product.stock === 0) {
          // Удаляем товар из корзины, если его нет в наличии
          await this.cartItemRepository.remove(item);
        } else {
          // Уменьшаем количество до доступного
          item.quantity = item.product.stock;
          await this.cartItemRepository.save(item);
        }
      }
    }

    // Возвращаем обновленную корзину
    return this.cartItemRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async addToCart(userId: number, productId: number, quantity: number = 1) {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    const existingItem = await this.cartItemRepository.findOne({
      where: { userId, productId },
    });

    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (product.stock < newQuantity) {
      throw new Error(`Недостаточно товара на складе. Доступно: ${product.stock} шт.`);
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
      return this.cartItemRepository.save(existingItem);
    }

    const cartItem = this.cartItemRepository.create({
      userId,
      productId,
      quantity,
    });

    return this.cartItemRepository.save(cartItem);
  }

  async updateQuantity(userId: number, productId: number, quantity: number) {
    const cartItem = await this.cartItemRepository.findOne({
      where: { userId, productId },
      relations: ['product'],
    });

    if (!cartItem) {
      throw new NotFoundException('Товар не найден в корзине');
    }

    if (quantity <= 0) {
      return this.cartItemRepository.remove(cartItem);
    }

    // Проверка наличия товара на складе
    const product = await this.productRepository.findOne({ where: { id: productId } });
    
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    if (product.stock < quantity) {
      throw new Error(`Недостаточно товара на складе. Доступно: ${product.stock} шт.`);
    }

    cartItem.quantity = quantity;
    return this.cartItemRepository.save(cartItem);
  }

  async removeFromCart(userId: number, productId: number) {
    const cartItem = await this.cartItemRepository.findOne({
      where: { userId, productId },
    });

    if (!cartItem) {
      throw new NotFoundException('Товар не найден в корзине');
    }

    return this.cartItemRepository.remove(cartItem);
  }

  async clearCart(userId: number) {
    const items = await this.cartItemRepository.find({ where: { userId } });
    return this.cartItemRepository.remove(items);
  }

  async getCartTotal(userId: number) {
    const items = await this.getCart(userId);
    const total = items.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);

    return {
      items,
      total,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }
}
