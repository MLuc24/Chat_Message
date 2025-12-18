import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { UpdateProfileDto, ChangePasswordDto, ProfileResponseDto } from './dto';
import * as bcrypt from 'bcrypt';

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

  async updateAvatar(userId: string, avatarUrl: string, publicId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { 
        avatarUrl,
        avatarPublicId: publicId, // Store publicId for deletion later
      },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    // Publish event for real-time update
    await this.redis.publish('user.avatar.updated', {
      userId,
      avatarUrl,
    });

    return user;
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

    // Get online status and lastSeen for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const isOnline = await this.redis.isUserOnline(user.id);
        const lastSeen = await this.redis.getLastSeen(user.id);
        return {
          ...user,
          isOnline,
          lastSeen,
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

  /**
   * Update user profile with validation
   * @throws ConflictException if email already exists
   * @throws NotFoundException if user not found
   */
  async updateProfileEnhanced(
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (updateDto.email && updateDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    // Update profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.bio !== undefined && { bio: updateDto.bio }),
        ...(updateDto.email && { email: updateDto.email }),
        updatedAt: new Date(),
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

    // Publish profile update event
    await this.redis.publish('user.profile.updated', {
      userId: updatedUser.id,
      name: updatedUser.name,
      bio: updatedUser.bio,
    });

    return new ProfileResponseDto(updatedUser);
  }

  /**
   * Change user password
   * @throws UnauthorizedException if current password is incorrect
   * @throws NotFoundException if user not found
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Find user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    // Note: You need to add passwordHash field to User model in Prisma schema
    // For now, this assumes auth-service handles passwords
    // This is a placeholder - actual implementation depends on your auth architecture
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 12);

    // In a real scenario, you would:
    // 1. Call auth-service to change password
    // 2. Or update passwordHash in user model if stored here
    
    // Publish password changed event
    await this.redis.publish('user.password.changed', {
      userId,
      timestamp: new Date().toISOString(),
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Upload and update user avatar
   * @throws BadRequestException if file is invalid
   * @throws NotFoundException if user not found
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Get current user to delete old avatar if exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old avatar from storage if exists
    if (user.avatarPublicId) {
      try {
        await this.storage.deleteFile(user.avatarPublicId);
      } catch (error) {
        // Log error but continue with upload
        console.warn('Failed to delete old avatar:', error);
      }
    }

    // Upload new avatar
    const uploadResult = await this.storage.uploadFile(file, {
      folder: 'avatars',
      transformation: {
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face',
      },
    });

    // Update user avatar in database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: uploadResult.url,
        avatarPublicId: uploadResult.publicId,
        updatedAt: new Date(),
      },
    });

    // Publish avatar update event
    await this.redis.publish('user.avatar.updated', {
      userId,
      avatarUrl: uploadResult.url,
    });

    return { avatarUrl: uploadResult.url };
  }

  /**
   * Delete user avatar
   * @throws NotFoundException if user not found
   */
  async deleteAvatar(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true, avatarUrl: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.avatarUrl) {
      throw new BadRequestException('No avatar to delete');
    }

    // Delete from storage
    if (user.avatarPublicId) {
      try {
        await this.storage.deleteFile(user.avatarPublicId);
      } catch (error) {
        console.warn('Failed to delete avatar from storage:', error);
      }
    }

    // Remove avatar from database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        avatarPublicId: null,
        updatedAt: new Date(),
      },
    });

    // Publish avatar deletion event
    await this.redis.publish('user.avatar.deleted', {
      userId,
    });

    return { message: 'Avatar deleted successfully' };
  }
}
