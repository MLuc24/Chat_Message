import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

// Handler types for different event types
type MessageHandler = (conversationId: string, message: any, memberIds: string[]) => void;
type GroupEventHandler = (event: {
  type: 'member_added' | 'member_removed' | 'group_updated';
  conversationId: string;
  data: any;
  memberIds: string[];
}) => void;
type ReactionEventHandler = (event: {
  messageId: string;
  conversationId: string;
  emoji: string;
  userId: string;
  action: 'add' | 'remove';
  createdAt: string;
  memberIds: string[];
}) => void;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private publisher: Redis;
  private subscriber: Redis;
  private messageHandler: MessageHandler | null = null;
  private groupEventHandler: GroupEventHandler | null = null;
  private reactionEventHandler: ReactionEventHandler | null = null;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new Redis(redisUrl);
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);

    // Subscribe to conversation pattern
    this.subscriber.psubscribe('conversation:*', (err) => {
      if (err) {
        console.error('❌ Failed to subscribe to conversation pattern:', err);
      } else {
        console.log('✅ Subscribed to conversation:* pattern');
      }
    });

    // Handle incoming messages
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const data = JSON.parse(message);
        const conversationId = channel.replace('conversation:', '');

        if (data.type === 'new_message' && this.messageHandler) {
          // Pass memberIds to handler for direct delivery to all participants
          this.messageHandler(conversationId, data.data, data.memberIds || []);
        }
        
        // Handle group events (member_added, member_removed, group_updated)
        if (['member_added', 'member_removed', 'group_updated'].includes(data.type) && this.groupEventHandler) {
          this.groupEventHandler({
            type: data.type,
            conversationId,
            data: data.data,
            memberIds: data.memberIds || [],
          });
        }

        // Handle reaction events
        if (data.type === 'message_reaction' && this.reactionEventHandler) {
          this.reactionEventHandler({
            messageId: data.data.messageId,
            conversationId: data.data.conversationId,
            emoji: data.data.emoji,
            userId: data.data.userId,
            action: data.data.action,
            createdAt: data.data.createdAt,
            memberIds: data.memberIds || [],
          });
        }
      } catch (error) {
        console.error('❌ Error processing Redis message:', error);
      }
    });

    console.log('✅ Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.publisher.quit();
    await this.subscriber.quit();
  }

  async setUserOnline(userId: string): Promise<void> {
    await this.client.setex(`user:online:${userId}`, 300, '1');
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.client.del(`user:online:${userId}`);
    await this.client.set(`user:lastSeen:${userId}`, Date.now());
  }

  async setSocketId(userId: string, socketId: string): Promise<void> {
    await this.client.setex(`socket:${userId}`, 3600, socketId); // 1 hour TTL
    console.log(`[Redis] Set socket ID for user ${userId}: ${socketId}`);
  }

  async getSocketId(userId: string): Promise<string | null> {
    const socketId = await this.client.get(`socket:${userId}`);
    console.log(`[Redis] Get socket ID for user ${userId}: ${socketId || 'NOT FOUND'}`);
    return socketId;
  }

  async removeSocketId(userId: string): Promise<void> {
    await this.client.del(`socket:${userId}`);
  }

  getClient(): Redis {
    return this.client;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  setMessageHandler(handler: (conversationId: string, message: any, memberIds: string[]) => void): void {
    this.messageHandler = handler;
  }

  setGroupEventHandler(handler: GroupEventHandler): void {
    this.groupEventHandler = handler;
  }

  setReactionEventHandler(handler: ReactionEventHandler): void {
    this.reactionEventHandler = handler;
  }
}
