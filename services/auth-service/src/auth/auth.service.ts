import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { RegisterDto, LoginDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    // Hash password
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || "10");
    const passwordHash = await bcrypt.hash(password, rounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException("Refresh token is required");
    }

    // Verify refresh token
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Check if refresh token exists in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException("Refresh token expired");
    }

    // Generate new tokens
    const tokens = await this.generateTokens(payload.userId, payload.email);

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    return tokens;
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException("Refresh token is required");
    }

    // Delete refresh token from database
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: "Logged out successfully" };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { userId, email };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });

    // Store refresh token in database
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
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
      case "s":
        return time * 1000;
      case "m":
        return time * 60 * 1000;
      case "h":
        return time * 60 * 60 * 1000;
      case "d":
        return time * 24 * 60 * 60 * 1000;
      default:
        return time;
    }
  }
}
