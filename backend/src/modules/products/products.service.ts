import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto, imagePath?: string) {
    const product = this.productRepository.create({
      ...dto,
      image: imagePath,
    });
    return this.productRepository.save(product);
  }

  async findAll(categoryId?: number, isActive?: boolean, search?: string, sortBy?: string) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    switch (sortBy) {
      case 'price_asc':
        queryBuilder.orderBy('product.price', 'ASC');
        break;
      case 'price_desc':
        queryBuilder.orderBy('product.price', 'DESC');
        break;
      case 'popular':
        queryBuilder.orderBy('product.salesCount', 'DESC');
        break;
      case 'rating':
        queryBuilder.orderBy('product.averageRating', 'DESC');
        break;
      case 'newest':
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
      default:
        queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Товар с ID ${id} не найден`);
    }

    return product;
  }

  async update(id: number, dto: UpdateProductDto, imagePath?: string) {
    await this.findOne(id);

    const updateData: any = { ...dto };
    if (imagePath) updateData.image = imagePath;

    await this.productRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.productRepository.delete(id);
  }

  async updateStock(id: number, quantity: number) {
    const product = await this.findOne(id);
    product.stock += quantity;
    return this.productRepository.save(product);
  }
}
