import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  Headers,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Headers('x-user-id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.uploadAvatar(userId, file);
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
