import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, RefreshTokenDto } from "./dto";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("health")
  health() {
    return {
      status: "ok",
      service: "auth-service",
      timestamp: new Date().toISOString(),
    };
  }

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }
}
