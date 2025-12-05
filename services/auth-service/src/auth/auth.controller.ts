import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IUserPayload } from '../common/interfaces/user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(
      `[${requestId}] POST /auth/login - Email: ${loginDto.email} - IP: ${ip} - UserAgent: ${userAgent}`,
    );

    try {
      const result = await this.authService.login(loginDto);
      this.logger.log(`[${requestId}] Login successful for: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[${requestId}] Login failed for: ${loginDto.email} - Error: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  async logout(
    @CurrentUser() user: IUserPayload,
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(user.sub, refreshTokenDto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: IUserPayload): Promise<UserResponseDto> {
    return this.authService.getMe(user.sub);
  }

  @Post('validate-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate JWT token (internal use)' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateToken(@Body() dto: ValidateTokenDto) {
    return this.authService.validateToken(dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser() user: IUserPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(user.sub, dto);
    return { message: 'Password changed successfully' };
  }
}
