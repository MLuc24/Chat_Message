import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto';
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
}
