import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto, imagePath?: string) {
    const category = this.categoryRepository.create({
      ...dto,
      image: imagePath,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.categoryRepository.find({
      where,
      relations: ['products'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Категория с ID ${id} не найдена`);
    }

    return category;
  }

  async update(id: number, dto: UpdateCategoryDto, imagePath?: string) {
    await this.findOne(id);

    const updateData: any = { ...dto };
    if (imagePath) updateData.image = imagePath;

    await this.categoryRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.categoryRepository.delete(id);
  }
}
