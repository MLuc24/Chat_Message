import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { UpdateProfileDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOnline = await this.redis.isUserOnline(userId);
    const lastSeen = await this.redis.getLastSeen(userId);

    return {
      ...user,
      isOnline,
      lastSeen,
    };
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
      },
    });

    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const avatarUrl = await this.storage.uploadFile(file, 'avatars');

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  async getBatchUsers(userIds: string[]) {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get online status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const isOnline = await this.redis.isUserOnline(user.id);
        return {
          ...user,
          isOnline,
        };
      }),
    );

    return usersWithStatus;
  }

  async searchUsers(query: string) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
      take: 20,
    });

    return { users };
  }

  async setOnline(userId: string) {
    await this.redis.setUserOnline(userId);
    return { status: 'online' };
  }

  async setOffline(userId: string) {
    await this.redis.setUserOffline(userId);
    return { status: 'offline' };
  }
}
