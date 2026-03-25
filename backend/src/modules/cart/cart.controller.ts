import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  getCart(@Param('userId', ParseIntPipe) userId: number) {
    return this.cartService.getCart(userId);
  }

  @Get(':userId/total')
  getCartTotal(@Param('userId', ParseIntPipe) userId: number) {
    return this.cartService.getCartTotal(userId);
  }

  @Post(':userId/add')
  addToCart(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { productId: number; quantity?: number },
  ) {
    return this.cartService.addToCart(userId, body.productId, body.quantity);
  }

  @Patch(':userId/update')
  updateQuantity(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { productId: number; quantity: number },
  ) {
    return this.cartService.updateQuantity(userId, body.productId, body.quantity);
  }

  @Delete(':userId/remove/:productId')
  removeFromCart(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.cartService.removeFromCart(userId, productId);
  }

  @Delete(':userId/clear')
  clearCart(@Param('userId', ParseIntPipe) userId: number) {
    return this.cartService.clearCart(userId);
  }
}
