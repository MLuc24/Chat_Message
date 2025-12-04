import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Headers,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from './message.service';
import { SendMessageDto, UpdateMessageDto } from './dto';

@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'chat-service' };
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Headers('x-user-id') userId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messageService.getMessages(
      conversationId,
      userId,
      parseInt(limit || '50'),
      before,
    );
  }

  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Headers('x-user-id') userId: string,
    @Body() sendDto: SendMessageDto,
  ) {
    return this.messageService.sendMessage(conversationId, userId, sendDto);
  }

  @Post('conversations/:conversationId/messages/file')
  @UseInterceptors(FileInterceptor('file'))
  async sendFileMessage(
    @Param('conversationId') conversationId: string,
    @Headers('x-user-id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.messageService.sendFileMessage(conversationId, userId, file);
  }

  @Put('messages/:id')
  async updateMessage(
    @Param('id') messageId: string,
    @Headers('x-user-id') userId: string,
    @Body() updateDto: UpdateMessageDto,
  ) {
    return this.messageService.updateMessage(messageId, userId, updateDto);
  }

  @Delete('messages/:id')
  async deleteMessage(
    @Param('id') messageId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.messageService.deleteMessage(messageId, userId);
  }

  @Post('messages/:id/delivered')
  async markDelivered(
    @Param('id') messageId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.messageService.markAsDelivered(messageId, userId);
  }

  @Post('messages/:id/seen')
  async markSeen(
    @Param('id') messageId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.messageService.markAsSeen(messageId, userId);
  }
}
