import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  add(@Body() body: { userId: number; productId: number }) {
    return this.wishlistService.add(body.userId, body.productId);
  }

  @Delete()
  remove(@Body() body: { userId: number; productId: number }) {
    return this.wishlistService.remove(body.userId, body.productId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.wishlistService.findByUser(userId);
  }

  @Get('check')
  isInWishlist(@Query('userId', ParseIntPipe) userId: number, @Query('productId', ParseIntPipe) productId: number) {
    return this.wishlistService.isInWishlist(userId, productId);
  }
}
