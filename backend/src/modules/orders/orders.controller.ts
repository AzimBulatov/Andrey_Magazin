import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../../entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  @Post()
  create(@Body() body: { 
    userId: number; 
    items: any[]; 
    totalAmount: number;
    deliveryAddress?: string;
    paymentMethod?: string;
    paymentTiming?: string;
    phone?: string;
    notes?: string;
  }) {
    return this.ordersService.create(
      body.userId, 
      body.items, 
      body.totalAmount,
      body.deliveryAddress,
      body.paymentMethod,
      body.phone,
      body.notes
    );
  }
}
