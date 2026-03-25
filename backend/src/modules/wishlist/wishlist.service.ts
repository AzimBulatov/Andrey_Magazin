import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../../entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
  ) {}

  async add(userId: number, productId: number) {
    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      return existing;
    }

    const wishlist = this.wishlistRepository.create({ userId, productId });
    return this.wishlistRepository.save(wishlist);
  }

  async remove(userId: number, productId: number) {
    return this.wishlistRepository.delete({ userId, productId });
  }

  async findByUser(userId: number) {
    return this.wishlistRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async isInWishlist(userId: number, productId: number) {
    const item = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });
    return !!item;
  }
}
