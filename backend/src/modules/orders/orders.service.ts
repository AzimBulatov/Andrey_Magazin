import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Product } from '../../entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll() {
    return this.orderRepository.find({
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Заказ с ID ${id} не найден`);
    }

    return order;
  }

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.findOne(id);
    order.status = status;
    return this.orderRepository.save(order);
  }

  async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const count = await this.orderRepository.count();
    const orderNum = (count + 1).toString().padStart(6, '0');
    
    return `${year}${month}${day}-${orderNum}`;
  }

  async create(
    userId: number, 
    items: any[], 
    totalAmount: number,
    deliveryAddress?: string,
    paymentMethod?: string,
    phone?: string,
    notes?: string
  ) {
    // Проверяем наличие товаров на складе
    for (const item of items) {
      const product = await this.productRepository.findOne({ 
        where: { id: item.productId } 
      });

      if (!product) {
        throw new NotFoundException(`Товар с ID ${item.productId} не найден`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Недостаточно товара "${product.name}" на складе. Доступно: ${product.stock}, запрошено: ${item.quantity}`
        );
      }
    }

    const orderNumber = await this.generateOrderNumber();
    
    const order = this.orderRepository.create({
      userId,
      orderNumber,
      totalAmount,
      status: OrderStatus.PENDING,
      deliveryAddress,
      paymentMethod,
      phone,
      notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Создаем элементы заказа и уменьшаем количество товара на складе
    for (const item of items) {
      const orderItem = this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
      await this.orderItemRepository.save(orderItem);

      // Уменьшаем количество товара на складе
      const product = await this.productRepository.findOne({ 
        where: { id: item.productId } 
      });
      
      if (product) {
        product.stock -= item.quantity;
        product.salesCount += item.quantity;
        await this.productRepository.save(product);
      }
    }

    return this.findOne(savedOrder.id);
  }
}
