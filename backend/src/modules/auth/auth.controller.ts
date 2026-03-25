import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin/login')
  async adminLogin(@Body() body: { email: string; password: string }) {
    return this.authService.loginAdmin(body.email, body.password);
  }

  @Post('user/register')
  async userRegister(@Body() body: { email: string; password: string; firstName: string; lastName?: string }) {
    return this.authService.registerUser(body.email, body.password, body.firstName, body.lastName);
  }

  @Post('user/login')
  async userLogin(@Body() body: { email: string; password: string }) {
    return this.authService.loginUser(body.email, body.password);
  }

  @Post('admin/register')
  async adminRegister(@Body() body: { email: string; password: string; name: string }) {
    // Этот endpoint должен быть защищен или удален в продакшене
    return this.authService.registerAdmin(body.email, body.password, body.name);
  }

  @Post('telegram/login')
  async telegramLogin(@Body() body: { telegramId: number; userData: any }) {
    return this.authService.loginTelegram(body.telegramId, body.userData);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post('telegram/generate-token')
  async generateTelegramToken(@Body() body: { telegramId: string }) {
    const token = await this.authService.generateTelegramAuthToken(body.telegramId);
    return { token };
  }

  @Post('telegram/validate-token')
  async validateTelegramToken(@Body() body: { token: string }) {
    return this.authService.validateTelegramAuthToken(body.token);
  }
}
