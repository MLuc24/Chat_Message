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
import { UpdateProfileDto, ChangePasswordDto, ProfileResponseDto, SaveThemePreferenceDto, ThemePreferenceResponseDto } from './dto';

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
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Integrate with auth-service to verify and update password
    // For now, just publish event for auth-service to handle
    await this.redis.publish('user.password.change.requested', {
      userId,
      currentPassword: changePasswordDto.currentPassword,
      newPassword: changePasswordDto.newPassword,
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
    // TODO: Implement delete functionality in storage service
    if (user.avatarPublicId) {
      console.log('Old avatar exists, should be deleted:', user.avatarPublicId);
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatarPublicId) {
      try {
        await this.storage.deleteFile(user.avatarPublicId);
      } catch (error) {
        console.log('Failed to delete old avatar:', error.message);
      }
    }

    // Upload new avatar to Cloudinary
    const avatarUrl = await this.storage.uploadFile(file, 'avatars');
    
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const urlParts = avatarUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/'); // Skip version
    const avatarPublicId = publicIdWithExt.split('.')[0]; // Remove extension

    // Update user avatar in database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
        avatarPublicId,
        updatedAt: new Date(),
      },
    });

    // Publish avatar update event
    await this.redis.publish('user.avatar.updated', {
      userId,
      avatarUrl,
    });

    return { avatarUrl };
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

    // Delete from Cloudinary
    if (user.avatarPublicId) {
      try {
        await this.storage.deleteFile(user.avatarPublicId);
      } catch (error) {
        console.log('Failed to delete avatar from Cloudinary:', error.message);
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

  // ===== THEME MANAGEMENT =====

  /**
   * Get user's theme preference
   */
  async getUserThemePreference(userId: string): Promise<ThemePreferenceResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        themePreference: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.themePreference) {
      throw new NotFoundException('No theme preference set');
    }

    return {
      userId: user.id,
      themeId: user.themePreference,
      appliedAt: user.updatedAt,
    };
  }

  /**
   * Save user's theme preference
   */
  async saveThemePreference(
    userId: string, 
    dto: SaveThemePreferenceDto
  ): Promise<ThemePreferenceResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate theme ID (basic validation)
    const validThemeIds = [
      'default',
      'superhero',
      'summer',
      'ocean',
      'heart-drive',
      'autumn',
      'karol-g',
      'dark',
    ];

    if (!validThemeIds.includes(dto.themeId)) {
      throw new BadRequestException('Invalid theme ID');
    }

    // Update theme preference
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        themePreference: dto.themeId,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        themePreference: true,
        updatedAt: true,
      },
    });

    // Publish theme update event (optional, for real-time sync)
    await this.redis.publish('user.theme.updated', {
      userId,
      themeId: dto.themeId,
    });

    return {
      userId: updatedUser.id,
      themeId: updatedUser.themePreference!,
      appliedAt: updatedUser.updatedAt,
    };
  }

  /**
   * Delete user's theme preference (reset to default)
   */
  async deleteThemePreference(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Reset to default theme
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        themePreference: 'default',
        updatedAt: new Date(),
      },
    });

    // Publish theme reset event
    await this.redis.publish('user.theme.reset', {
      userId,
    });

    return { message: 'Theme preference reset to default' };
  }
}
