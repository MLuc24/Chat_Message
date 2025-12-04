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
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto, UpdateConversationDto, AddMemberDto } from './dto';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async getConversations(@Headers('x-user-id') userId: string) {
    return this.conversationService.getUserConversations(userId);
  }

  @Get(':id')
  async getConversation(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.conversationService.getConversation(conversationId, userId);
  }

  @Post()
  async createConversation(
    @Headers('x-user-id') userId: string,
    @Body() createDto: CreateConversationDto,
  ) {
    return this.conversationService.createConversation(userId, createDto);
  }

  @Put(':id')
  async updateConversation(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
    @Body() updateDto: UpdateConversationDto,
  ) {
    return this.conversationService.updateConversation(conversationId, userId, updateDto);
  }

  @Delete(':id')
  async deleteConversation(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.conversationService.deleteConversation(conversationId, userId);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.conversationService.addMember(conversationId, userId, addMemberDto.userId);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') conversationId: string,
    @Param('memberId') memberId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.conversationService.removeMember(conversationId, userId, memberId);
  }
}
