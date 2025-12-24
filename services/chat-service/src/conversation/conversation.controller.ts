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
import { CreateConversationDto, UpdateConversationDto, AddMemberDto, SetNicknameDto } from './dto';
import { UpdateConversationSettingsDto } from './dto/update-settings.dto';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async getConversations(
    @Headers('x-user-id') userId: string,
    @Query('populate') populate?: string,
  ) {
    return this.conversationService.getUserConversations(userId, populate);
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

  @Get(':id/settings')
  async getConversationSettings(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.conversationService.getConversationSettings(conversationId, userId);
  }

  @Put(':id/settings')
  async updateConversationSettings(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
    @Body() updateDto: UpdateConversationSettingsDto,
  ) {
    return this.conversationService.updateConversationSettings(conversationId, userId, updateDto);
  }

  @Get(':id/nicknames')
  async getNicknames(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.conversationService.getNicknames(conversationId, userId);
  }

  @Post(':id/nicknames')
  async setNickname(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
    @Body() setNicknameDto: SetNicknameDto,
  ) {
    return this.conversationService.setNickname(
      conversationId,
      userId,
      setNicknameDto.targetUserId,
      setNicknameDto.nickname,
    );
  }

  @Delete(':id/nicknames/:targetUserId')
  async deleteNickname(
    @Param('id') conversationId: string,
    @Param('targetUserId') targetUserId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.conversationService.deleteNickname(conversationId, userId, targetUserId);
  }
}
