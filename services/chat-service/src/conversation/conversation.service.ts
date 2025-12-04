import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, UpdateConversationDto } from './dto';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserConversations(userId: string) {
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

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.getUnreadCount(conv.id, userId);
        return {
          ...conv,
          lastMessage: conv.messages[0] || null,
          messages: undefined,
          unreadCount,
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

    // Check if user is admin
    const member = conversation.members.find((m) => m.userId === userId);
    if (member?.role !== 'admin') {
      throw new ForbiddenException('Only admins can update conversation');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: updateDto,
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

    await this.prisma.conversationMember.deleteMany({
      where: {
        conversationId,
        userId: memberIdToRemove,
      },
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
}
