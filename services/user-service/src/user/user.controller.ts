import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiHeader,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { 
  UpdateProfileDto, 
  ChangePasswordDto, 
  ProfileResponseDto,
  UploadAvatarDto,
  SaveThemePreferenceDto,
  ThemePreferenceResponseDto,
} from './dto';
import { UploadService } from '../common/services/upload.service';
import {
  GenerateUploadSignatureDto,
  UploadSignatureResponseDto,
} from '../common/dto/upload.dto';

@ApiTags('Users')
@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'user-service' };
  }

  /**
   * Get current user profile (me endpoint)
   * IMPORTANT: This must come BEFORE profile/:userId to avoid route conflict
   */
  @Get('profile/me')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Get authenticated user profile',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiHeader({ 
    name: 'x-user-id', 
    required: true,
    description: 'User ID from JWT token',
  })
  async getCurrentUserProfile(
    @Headers('x-user-id') userId: string,
  ): Promise<any> {
    return this.userService.getProfile(userId);
  }

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Put('profile')
  async updateProfile(
    @Headers('x-user-id') userId: string,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, updateDto);
  }

  @Post('upload/signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate signed upload URL for direct client upload' })
  @ApiResponse({ status: 200, type: UploadSignatureResponseDto })
  @ApiHeader({ name: 'x-user-id', required: true })
  async generateUploadSignature(
    @Headers('x-user-id') userId: string,
    @Body() dto: GenerateUploadSignatureDto,
  ): Promise<UploadSignatureResponseDto> {
    return this.uploadService.generateUploadSignature(dto);
  }

  @Put('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user avatar URL after upload' })
  @ApiResponse({ status: 200, description: 'Avatar updated' })
  @ApiHeader({ name: 'x-user-id', required: true })
  async updateAvatar(
    @Headers('x-user-id') userId: string,
    @Body() body: { avatarUrl: string; publicId: string },
  ) {
    return this.userService.updateAvatar(userId, body.avatarUrl, body.publicId);
  }

  @Post('batch')
  async getBatchUsers(@Body() body: { userIds: string[] }) {
    return this.userService.getBatchUsers(body.userIds);
  }


  @Get('search')
  async searchUsers(@Query('q') query: string) {
    return this.userService.searchUsers(query);
  }

  @Post('presence/online')
  async setOnline(@Headers('x-user-id') userId: string) {
    return this.userService.setOnline(userId);
  }

  @Post('presence/offline')
  async setOffline(@Headers('x-user-id') userId: string) {
    return this.userService.setOffline(userId);
  }

  // ===== ENHANCED PROFILE MANAGEMENT ENDPOINTS =====

  /**
   * Update user profile (enhanced with validation)
   */
  @Put('profile/edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update user profile',
    description: 'Update user name, bio, and email with validation',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiHeader({ 
    name: 'x-user-id', 
    required: true,
    description: 'User ID from JWT token',
  })
  async updateProfileEnhanced(
    @Headers('x-user-id') userId: string,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.userService.updateProfileEnhanced(userId, updateDto);
  }

  /**
   * Change user password
   */
  @Put('profile/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Change user password',
    description: 'Change password with current password verification',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiHeader({ 
    name: 'x-user-id', 
    required: true,
    description: 'User ID from JWT token',
  })
  async changePassword(
    @Headers('x-user-id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.userService.changePassword(userId, changePasswordDto);
  }

  /**
   * Upload user avatar (multipart/form-data)
   */
  @Post('profile/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Upload user avatar',
    description: 'Upload avatar image (max 5MB, JPEG/PNG/WebP)',
  })
  @ApiBody({ type: UploadAvatarDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Avatar uploaded successfully',
    schema: {
      properties: {
        avatarUrl: { type: 'string', example: 'https://res.cloudinary.com/...' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or validation error' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiHeader({ 
    name: 'x-user-id', 
    required: true,
    description: 'User ID from JWT token',
  })
  async uploadAvatarFile(
    @Headers('x-user-id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    return this.userService.uploadAvatar(userId, file);
  }

  /**
   * Delete user avatar
   */
  @Delete('profile/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete user avatar',
    description: 'Remove current avatar and revert to default',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Avatar deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'No avatar to delete' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiHeader({ 
    name: 'x-user-id', 
    required: true,
    description: 'User ID from JWT token',
  })
  async deleteAvatar(
    @Headers('x-user-id') userId: string,
  ): Promise<{ message: string }> {
    return this.userService.deleteAvatar(userId);
  }

  // ===== THEME MANAGEMENT ENDPOINTS =====

  /**
   * Get user's theme preference
   */
  @Get('users/me/theme')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get user theme preference',
    description: 'Get current user\'s theme preference',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Theme preference retrieved',
    type: ThemePreferenceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found or no theme preference set' })
  @ApiHeader({ 
    name: 'x-user-id', 
    required: true,
    description: 'User ID from JWT token',
  })
  async getUserThemePreference(
    @Headers('x-user-id') userId: string,
  ): Promise<ThemePreferenceResponseDto> {
    return this.userService.getUserThemePreference(userId);
  }

  /**
   * Save user's theme preference
   */
  @Put('users/me/theme')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Save theme preference',
    description: 'Save user\'s theme preference',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Theme preference saved',
    type: ThemePreferenceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid theme ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiHeader({ 
    name: 'x-user-id', 
    required: true,
    description: 'User ID from JWT token',
  })
  async saveThemePreference(
    @Headers('x-user-id') userId: string,
    @Body() dto: SaveThemePreferenceDto,
  ): Promise<ThemePreferenceResponseDto> {
    return this.userService.saveThemePreference(userId, dto);
  }

  /**
   * Delete user's theme preference
   */
  @Delete('users/me/theme')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete theme preference',
    description: 'Reset theme to default',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Theme preference deleted',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiHeader({ 
    name: 'x-user-id', 
    required: true,
    description: 'User ID from JWT token',
  })
  async deleteThemePreference(
    @Headers('x-user-id') userId: string,
  ): Promise<{ message: string }> {
    return this.userService.deleteThemePreference(userId);
  }

}
