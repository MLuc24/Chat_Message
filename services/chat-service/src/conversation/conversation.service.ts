import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateConversationDto, UpdateConversationDto } from './dto';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getUserConversations(userId: string, populate?: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            text: true,
            type: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate unread count and populate participants if requested
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.getUnreadCount(conv.id, userId);
        
        let participants = undefined;
        
        // If populate=participants, fetch user details from user-service
        if (populate?.includes('participants')) {
          const otherUserIds = conv.members
            .filter(m => m.userId !== userId)
            .map(m => m.userId);
          
          if (otherUserIds.length > 0) {
            try {
              // Fetch user details from user-service via HTTP
              const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
              const url = `${userServiceUrl}/batch`;
              
              const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: otherUserIds }),
              });
              
              if (response.ok) {
                const users = await response.json();
                participants = users;
              }
            } catch (error) {
              console.error('Failed to fetch user details:', error);
            }
          }
        }
        
        return {
          ...conv,
          lastMessage: conv.messages[0] || null,
          messages: undefined,
          unreadCount,
          participants,
        };
      }),
    );

    return { conversations: conversationsWithUnread };
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is member
    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    return conversation;
  }

  async createConversation(userId: string, createDto: CreateConversationDto) {
    const { type, participantIds, name } = createDto;

    // Validate type
    if (type === 'direct' && participantIds.length !== 2) {
      throw new BadRequestException('Direct conversation must have exactly 2 participants');
    }

    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }

    // For direct conversation, check if already exists
    if (type === 'direct') {
      const existingConversation = await this.findDirectConversation(
        participantIds[0],
        participantIds[1],
      );

      if (existingConversation) {
        return existingConversation;
      }
    }

    // Create conversation with members
    const conversation = await this.prisma.conversation.create({
      data: {
        type,
        name,
        createdBy: userId,
        members: {
          create: participantIds.map((participantId, index) => ({
            userId: participantId,
            role: participantId === userId ? 'admin' : 'member',
          })),
        },
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    return conversation;
  }

  async updateConversation(
    conversationId: string,
    userId: string,
    updateDto: UpdateConversationDto,
  ) {
    const conversation = await this.getConversation(conversationId, userId);

    // For direct conversations, allow theme changes without admin check
    // For group conversations, check if user is admin
    if (conversation.type === 'group') {
      const member = conversation.members.find((m) => m.userId === userId);
      if (member?.role !== 'admin') {
        throw new ForbiddenException('Only admins can update conversation');
      }
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: updateDto,
    });

    // Publish update event via Redis to all members (both direct and group)
    const memberIds = conversation.members.map((m) => m.userId);
    await this.redis.publishGroupUpdated(conversationId, memberIds, {
      name: updateDto.name,
      avatarUrl: updateDto.avatarUrl,
      themeId: updateDto.themeId,
      updatedBy: userId,
    });

    return updated;
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.getConversation(conversationId, userId);

    // Check if user is creator
    if (conversation.createdBy !== userId) {
      throw new ForbiddenException('Only creator can delete conversation');
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { message: 'Conversation deleted' };
  }

  async addMember(conversationId: string, userId: string, newMemberId: string) {
    const conversation = await this.getConversation(conversationId, userId);

    if (conversation.type === 'direct') {
      throw new BadRequestException('Cannot add members to direct conversation');
    }

    // Check if user is admin
    const member = conversation.members.find((m) => m.userId === userId);
    if (member?.role !== 'admin') {
      throw new ForbiddenException('Only admins can add members');
    }

    // Check if member already exists
    const existingMember = conversation.members.find((m) => m.userId === newMemberId);
    if (existingMember) {
      throw new BadRequestException('User is already a member');
    }

    const newMember = await this.prisma.conversationMember.create({
      data: {
        conversationId,
        userId: newMemberId,
        role: 'member',
      },
    });

    // Get all member IDs including the new member for real-time notification
    const allMemberIds = [...conversation.members.map((m) => m.userId), newMemberId];

    // Publish member_added event via Redis
    await this.redis.publishMemberAdded(conversationId, allMemberIds, {
      userId: newMemberId,
      addedBy: userId,
      role: 'member',
    });

    return newMember;
  }

  async removeMember(conversationId: string, userId: string, memberIdToRemove: string) {
    const conversation = await this.getConversation(conversationId, userId);

    if (conversation.type === 'direct') {
      throw new BadRequestException('Cannot remove members from direct conversation');
    }

    // Check if user is admin or removing themselves
    const member = conversation.members.find((m) => m.userId === userId);
    if (member?.role !== 'admin' && userId !== memberIdToRemove) {
      throw new ForbiddenException('Only admins can remove other members');
    }

    // Get all member IDs including the one being removed for notification
    const allMemberIds = conversation.members.map((m) => m.userId);

    await this.prisma.conversationMember.deleteMany({
      where: {
        conversationId,
        userId: memberIdToRemove,
      },
    });

    // Publish member_removed event via Redis
    await this.redis.publishMemberRemoved(conversationId, allMemberIds, {
      userId: memberIdToRemove,
      removedBy: userId,
    });

    return { message: 'Member removed' };
  }

  private async findDirectConversation(userId1: string, userId2: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        type: 'direct',
        members: {
          every: {
            userId: { in: [userId1, userId2] },
          },
        },
      },
      include: {
        members: true,
      },
    });

    return conversations.find((conv) => conv.members.length === 2) || null;
  }

  private async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    // Count messages that don't have 'seen' status for this user
    const count = await this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        isDeleted: false,
        statuses: {
          none: {
            userId,
            status: 'seen',
          },
        },
      },
    });

    return count;
  }

  async getConversationSettings(conversationId: string, userId: string) {
    // Check membership
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    // Get or create settings
    let settings = await this.prisma.conversationSettings.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!settings) {
      settings = await this.prisma.conversationSettings.create({
        data: {
          conversationId,
          userId,
        },
      });
    }

    return settings;
  }

  async updateConversationSettings(
    conversationId: string,
    userId: string,
    updateData: {
      mute?: boolean;
      sound?: boolean;
      popups?: boolean;
      hide?: boolean;
    },
  ) {
    // Check membership
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    // Upsert settings
    const settings = await this.prisma.conversationSettings.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      create: {
        conversationId,
        userId,
        ...updateData,
      },
      update: updateData,
    });

    return settings;
  }
}
