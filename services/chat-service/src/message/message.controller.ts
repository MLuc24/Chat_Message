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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { SendMessageDto, UpdateMessageDto } from './dto';
import { UploadService } from '../common/services/upload.service';
import {
  GenerateUploadSignatureDto,
  UploadSignatureResponseDto,
} from '../common/dto/upload.dto';

@ApiTags('Messages')
@Controller()
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly uploadService: UploadService,
  ) {}

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

  @Post('upload/signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate signed upload URL for media messages' })
  @ApiResponse({ status: 200, type: UploadSignatureResponseDto })
  @ApiHeader({ name: 'x-user-id', required: true })
  async generateUploadSignature(
    @Headers('x-user-id') userId: string,
    @Body() dto: GenerateUploadSignatureDto,
  ): Promise<UploadSignatureResponseDto> {
    return this.uploadService.generateUploadSignature(dto);
  }

  @Put('messages/:id')
  async updateMessage(
    @Param('id') messageId: string,
    @Headers('x-user-id') userId: string,
    @Body() updateDto: UpdateMessageDto,
  ) {
    return this.messageService.updateMessage(messageId, userId, updateDto);
  }

  @Get('conversations/:conversationId/shared-media')
  async getSharedMedia(
    @Param('conversationId') conversationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.messageService.getSharedMedia(conversationId, userId);
  }

  @Get('conversations/:conversationId/shared-documents')
  async getSharedDocuments(
    @Param('conversationId') conversationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.messageService.getSharedDocuments(conversationId, userId);
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

  @Post('conversations/:conversationId/read')
  async markConversationAsRead(
    @Param('conversationId') conversationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.messageService.markConversationAsRead(conversationId, userId);
  }
}
