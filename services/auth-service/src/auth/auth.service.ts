import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto';
import { IUserPayload } from '../common/interfaces/user.interface';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '../common/exceptions/business.exception';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password with bcrypt rounds 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    this.logger.log(`User registered: ${user.id} - ${user.email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.name);

    // Publish event: user.created
    await this.redis.publishJson('user.created', {
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const userResponse = new UserResponseDto(user);
    return new AuthResponseDto(userResponse, tokens);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    const startTime = Date.now();

    this.logger.debug(`[LOGIN] Starting login attempt for email: ${email}`);

    try {
      // Find user
      this.logger.debug(`[LOGIN] Querying database for user: ${email}`);
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        this.logger.warn(`[LOGIN] User not found: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.debug(`[LOGIN] User found: ${user.id} - ${user.email}`);

      // Check if account is active
      if (!user.isActive) {
        this.logger.warn(`[LOGIN] Account deactivated: ${user.id} - ${user.email}`);
        throw new UnauthorizedException('Account is deactivated');
      }

      this.logger.debug(`[LOGIN] Account is active, verifying password for user: ${user.id}`);

      // Verify password
      const passwordStartTime = Date.now();
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      const passwordDuration = Date.now() - passwordStartTime;

      this.logger.debug(`[LOGIN] Password verification took ${passwordDuration}ms`);

      if (!isPasswordValid) {
        this.logger.warn(`[LOGIN] Invalid password for user: ${user.id} - ${user.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.debug(`[LOGIN] Password verified successfully for user: ${user.id}`);

      // Generate tokens
      this.logger.debug(`[LOGIN] Generating tokens for user: ${user.id}`);
      const tokenStartTime = Date.now();
      const tokens = await this.generateTokens(user.id, user.email, user.name);
      const tokenDuration = Date.now() - tokenStartTime;

      this.logger.debug(`[LOGIN] Token generation took ${tokenDuration}ms`);

      // Publish event: user.logged_in
      this.logger.debug(`[LOGIN] Publishing user.logged_in event for user: ${user.id}`);
      await this.redis.publishJson('user.logged_in', { 
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      const totalDuration = Date.now() - startTime;
      this.logger.log(`[LOGIN] ✅ User logged in successfully: ${user.id} - ${user.email} (${totalDuration}ms)`);

      const userResponse = new UserResponseDto(user);
      return new AuthResponseDto(userResponse, tokens);

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`[LOGIN] ❌ Login failed for ${email}: ${error.message} (${totalDuration}ms)`);
      } else {
        this.logger.error(
          `[LOGIN] ❌ Unexpected error during login for ${email} (${totalDuration}ms)`,
          error.stack,
        );
      }
      
      throw error;
    }
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    const { refreshToken } = dto;

    // Verify refresh token
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token exists and not revoked
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email, user.name);

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Token refreshed for user: ${user.id}`);

    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Revoke specific refresh token
      await this.prisma.refreshToken.updateMany({
        where: {
          token: refreshToken,
          userId,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });
    }

    // Publish event: user.logged_out
    await this.redis.publishJson('user.logged_out', { userId });

    this.logger.log(`User logged out: ${userId}`);
  }

  async validateToken(dto: ValidateTokenDto): Promise<{ valid: boolean; user?: IUserPayload }> {
    try {
      const payload = this.jwtService.verify(dto.token, {
        secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      });

      // Check if user is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        return { valid: false };
      }

      return {
        valid: true,
        user: {
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
        },
      };
    } catch {
      return { valid: false };
    }
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User');
    }

    return new UserResponseDto(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    // Update password and revoke all refresh tokens
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      }),
    ]);

    // Publish event: user.password_changed
    await this.redis.publishJson('user.password_changed', { userId });

    this.logger.log(`Password changed for user: ${userId}`);
  }

  private async generateTokens(userId: string, email: string, name: string): Promise<AuthTokensDto> {
    const payload: IUserPayload = {
      sub: userId,
      email,
      name,
    };

    // Generate access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    // Generate refresh token with unique jti (7 days)
    const jti = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const refreshToken = this.jwtService.sign(
      { ...payload, jti },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }
    );

    // Store refresh token in database
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const expiresInMs = this.parseExpiresIn(refreshExpiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const time = parseInt(expiresIn.slice(0, -1));
    const unit = expiresIn.slice(-1);

    switch (unit) {
      case 's':
        return time * 1000;
      case 'm':
        return time * 60 * 1000;
      case 'h':
        return time * 60 * 60 * 1000;
      case 'd':
        return time * 24 * 60 * 60 * 1000;
      default:
        return time;
    }
  }
}
