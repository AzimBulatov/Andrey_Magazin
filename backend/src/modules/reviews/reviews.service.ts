import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../entities/review.entity';
import { Product } from '../../entities/product.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(userId: number, productId: number, rating: number, comment: string) {
    const review = this.reviewRepository.create({
      userId,
      productId,
      rating,
      comment,
    });

    const saved = await this.reviewRepository.save(review);
    await this.updateProductRating(productId);
    
    return this.reviewRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
  }

  async findByProduct(productId: number) {
    return this.reviewRepository.find({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateProductRating(productId: number) {
    const reviews = await this.reviewRepository.find({ where: { productId } });
    
    if (reviews.length === 0) {
      await this.productRepository.update(productId, {
        averageRating: 0,
        reviewCount: 0,
      });
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await this.productRepository.update(productId, {
      averageRating: Number(avgRating.toFixed(2)),
      reviewCount: reviews.length,
    });
  }
}
