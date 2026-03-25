import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Order, OrderStatus } from '../../entities/order.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async findAll() {
    const users = await this.userRepository.find({
      relations: ['orders'],
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      users.map(async (user) => {
        const stats = await this.getUserStats(user.id);
        return {
          ...user,
          ...stats,
        };
      }),
    );
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['orders', 'orders.items', 'orders.items.product'],
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    return user;
  }

  async updateProfile(id: number, updateData: Partial<User>) {
    const user = await this.findOne(id);
    
    Object.assign(user, updateData);
    
    return this.userRepository.save(user);
  }

  async addAddress(userId: number, address: any) {
    const user = await this.findOne(userId);
    
    const addresses = user.addresses || [];
    addresses.push({
      id: Date.now(),
      ...address,
      isDefault: addresses.length === 0,
    });
    
    user.addresses = addresses;
    return this.userRepository.save(user);
  }

  async updateAddress(userId: number, addressId: number, addressData: any) {
    const user = await this.findOne(userId);
    
    const addresses = user.addresses || [];
    const index = addresses.findIndex((a: any) => a.id === addressId);
    
    if (index !== -1) {
      addresses[index] = { ...addresses[index], ...addressData };
      user.addresses = addresses;
      return this.userRepository.save(user);
    }
    
    throw new NotFoundException('Адрес не найден');
  }

  async deleteAddress(userId: number, addressId: number) {
    const user = await this.findOne(userId);
    
    const addresses = user.addresses || [];
    user.addresses = addresses.filter((a: any) => a.id !== addressId);
    
    return this.userRepository.save(user);
  }

  async updateNotificationSettings(userId: number, settings: any) {
    const user = await this.findOne(userId);
    
    user.notificationSettings = {
      ...user.notificationSettings,
      ...settings,
    };
    
    return this.userRepository.save(user);
  }

  async getUserStats(userId: number) {
    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['items'],
    });

    const totalSpent = orders
      .filter((order) => order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);

    const activeOrders = orders.filter(
      (order) =>
        order.status !== OrderStatus.COMPLETED &&
        order.status !== OrderStatus.CANCELLED &&
        order.status !== OrderStatus.DELIVERED,
    ).length;

    return {
      totalSpent,
      totalOrders: orders.length,
      activeOrders,
      hasActiveOrders: activeOrders > 0,
    };
  }
}
