import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Admin } from '../../entities/admin.entity';
import { User } from '../../entities/user.entity';
import { TelegramAuthToken } from '../../entities/telegram-auth-token.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TelegramAuthToken)
    private telegramAuthTokenRepository: Repository<TelegramAuthToken>,
    private jwtService: JwtService,
  ) {}

  // Регистрация обычного пользователя
  async registerUser(email: string, password: string, firstName: string, lastName?: string) {
    const existingUser = await this.userRepository.findOne({ where: { email } });

    if (existingUser) {
      throw new UnauthorizedException('Пользователь с таким email уже существует');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    await this.userRepository.save(user);

    const payload = { sub: user.id, email: user.email, role: 'user' };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'user',
      },
    };
  }

  // Авторизация обычного пользователя
  async loginUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.password) {
      throw new UnauthorizedException('Пользователь не имеет пароля. Используйте Telegram для входа.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const payload = { sub: user.id, email: user.email, role: 'user' };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'user',
      },
    };
  }

  // Авторизация админа по email/password
  async loginAdmin(email: string, password: string) {
    const admin = await this.adminRepository.findOne({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const payload = { sub: admin.id, email: admin.email, role: 'admin' };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  // Регистрация админа
  async registerAdmin(email: string, password: string, name: string) {
    const existingAdmin = await this.adminRepository.findOne({ where: { email } });

    if (existingAdmin) {
      throw new UnauthorizedException('Админ с таким email уже существует');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = this.adminRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    await this.adminRepository.save(admin);

    const payload = { sub: admin.id, email: admin.email, role: 'admin' };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  // Авторизация через Telegram (для клиентов и админов)
  async loginTelegram(telegramId: number, userData: any) {
    // Сначала проверяем, есть ли админ с таким telegramId
    const admin = await this.adminRepository.findOne({
      where: { telegramId: telegramId.toString() },
    });

    if (admin) {
      // Если это админ - возвращаем админский токен
      const payload = { sub: admin.id, email: admin.email, role: 'admin' };
      const token = this.jwtService.sign(payload);

      return {
        access_token: token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin',
          telegramId: admin.telegramId,
        },
      };
    }

    // Если не админ - работаем с обычным пользователем
    let user = await this.userRepository.findOne({
      where: { telegramId: telegramId.toString() },
    });

    if (!user) {
      user = this.userRepository.create({
        telegramId: telegramId.toString(),
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      await this.userRepository.save(user);
    }

    const payload = { sub: user.id, telegramId: user.telegramId, role: 'user' };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'user',
      },
    };
  }

  // Проверка токена
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Невалидный токен');
    }
  }

  // Генерация magic link токена для Telegram пользователя или админа
  async generateTelegramAuthToken(telegramId: string): Promise<string> {
    // Очищаем старые токены этого пользователя
    await this.telegramAuthTokenRepository.delete({
      telegramId,
      used: false,
    });

    // Очищаем истекшие токены
    await this.telegramAuthTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    // Сначала проверяем, есть ли админ с таким telegramId
    const admin = await this.adminRepository.findOne({
      where: { telegramId },
    });

    let userId: number;

    if (admin) {
      userId = admin.id;
    } else {
      // Находим обычного пользователя
      const user = await this.userRepository.findOne({
        where: { telegramId },
      });

      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      userId = user.id;
    }

    // Генерируем уникальный токен
    const token = randomBytes(32).toString('hex');
    
    // Токен действителен 10 минут
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const authToken = this.telegramAuthTokenRepository.create({
      token,
      userId,
      telegramId,
      expiresAt,
    });

    await this.telegramAuthTokenRepository.save(authToken);

    return token;
  }

  // Валидация magic link токена и авторизация
  async validateTelegramAuthToken(token: string) {
    const authToken = await this.telegramAuthTokenRepository.findOne({
      where: { token },
    });

    if (!authToken) {
      throw new UnauthorizedException('Токен не найден');
    }

    if (authToken.used) {
      throw new UnauthorizedException('Токен уже использован');
    }

    if (new Date() > authToken.expiresAt) {
      throw new UnauthorizedException('Токен истек');
    }

    // Помечаем токен как использованный
    authToken.used = true;
    await this.telegramAuthTokenRepository.save(authToken);

    // Получаем пользователя
    const user = await this.userRepository.findOne({
      where: { id: authToken.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Генерируем JWT токен
    const payload = { sub: user.id, telegramId: user.telegramId, role: 'user' };
    const jwtToken = this.jwtService.sign(payload);

    return {
      access_token: jwtToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: 'user',
      },
    };
  }
}
