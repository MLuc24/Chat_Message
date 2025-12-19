import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { SendMessageDto, UpdateMessageDto } from './dto';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    before?: string,
  ) {
    // Check if user is member
    await this.checkMembership(conversationId, userId);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        ...(before && {
          createdAt: {
            lt: (
              await this.prisma.message.findUnique({
                where: { id: before },
                select: { createdAt: true },
              })
            )?.createdAt,
          },
        }),
      },
      include: {
        statuses: {
          select: {
            userId: true,
            status: true,
            timestamp: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      messages: messages.reverse(),
      hasMore: messages.length === limit,
    };
  }

  async sendMessage(conversationId: string, userId: string, sendDto: SendMessageDto) {
    await this.checkMembership(conversationId, userId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        type: sendDto.type,
        text: sendDto.text,
      },
      include: {
        statuses: true,
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Create 'sent' status for sender
    await this.createMessageStatus(message.id, userId, 'sent');

    // Publish to Redis for realtime delivery
    await this.redis.publishMessage(conversationId, message);

    return message;
  }

  async sendFileMessage(conversationId: string, userId: string, file: Express.Multer.File) {
    await this.checkMembership(conversationId, userId);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Upload file to Cloudinary
    const { url, size, publicId } = await this.storage.uploadFile(file, 'messages');

    // Determine message type based on mime type
    let messageType = 'file';
    if (file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      messageType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      messageType = 'audio';
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        type: messageType,
        fileUrl: url,
        fileName: file.originalname,
        fileSize: size,
      },
      include: {
        statuses: true,
      },
    });

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Create status
    await this.createMessageStatus(message.id, userId, 'sent');

    // Publish to Redis
    await this.redis.publishMessage(conversationId, message);

    return message;
  }

  async updateMessage(messageId: string, userId: string, updateDto: UpdateMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Can only edit your own messages');
    }

    if (message.type !== 'text') {
      throw new BadRequestException('Can only edit text messages');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        text: updateDto.text,
        isEdited: true,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Can only delete your own messages');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    return { message: 'Message deleted' };
  }

  async markAsDelivered(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.checkMembership(message.conversationId, userId);

    await this.createMessageStatus(messageId, userId, 'delivered');
    await this.redis.publishMessageStatus(messageId, userId, 'delivered');

    return { status: 'delivered' };
  }

  async markAsSeen(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.checkMembership(message.conversationId, userId);

    // Mark this and all previous messages as seen
    await this.createMessageStatus(messageId, userId, 'seen');
    await this.redis.publishMessageStatus(messageId, userId, 'seen');

    return { status: 'seen' };
  }

  private async checkMembership(conversationId: string, userId: string): Promise<void> {
    const member = await this.prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this conversation');
    }
  }

  async markConversationAsRead(conversationId: string, userId: string) {
    // Check membership
    await this.checkMembership(conversationId, userId);

    // Get all unread messages in this conversation
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId }, // Don't mark own messages
        isDeleted: false,
      },
      select: { id: true },
    });

    // Mark all as seen
    for (const message of messages) {
      await this.createMessageStatus(message.id, userId, 'seen');
    }

    return { success: true, markedCount: messages.length };
  }

  private async createMessageStatus(
    messageId: string,
    userId: string,
    status: string,
  ): Promise<void> {
    await this.prisma.messageStatus.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
        status,
      },
      update: {
        status,
        timestamp: new Date(),
      },
    });
  }
}
