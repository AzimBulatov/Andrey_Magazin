import { Controller, Get, Param, ParseIntPipe, Patch, Body, Post, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get(':id/stats')
  getUserStats(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserStats(id);
  }

  @Patch(':id/profile')
  updateProfile(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.usersService.updateProfile(id, updateData);
  }

  @Post(':id/addresses')
  addAddress(@Param('id', ParseIntPipe) id: number, @Body() address: any) {
    return this.usersService.addAddress(id, address);
  }

  @Patch(':id/addresses/:addressId')
  updateAddress(
    @Param('id', ParseIntPipe) id: number,
    @Param('addressId', ParseIntPipe) addressId: number,
    @Body() addressData: any,
  ) {
    return this.usersService.updateAddress(id, addressId, addressData);
  }

  @Delete(':id/addresses/:addressId')
  deleteAddress(
    @Param('id', ParseIntPipe) id: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ) {
    return this.usersService.deleteAddress(id, addressId);
  }

  @Patch(':id/notifications')
  updateNotificationSettings(@Param('id', ParseIntPipe) id: number, @Body() settings: any) {
    return this.usersService.updateNotificationSettings(id, settings);
  }
}
