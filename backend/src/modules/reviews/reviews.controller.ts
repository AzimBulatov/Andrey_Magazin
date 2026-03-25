import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() body: { userId: number; productId: number; rating: number; comment: string }) {
    return this.reviewsService.create(body.userId, body.productId, body.rating, body.comment);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviewsService.findByProduct(productId);
  }
}
