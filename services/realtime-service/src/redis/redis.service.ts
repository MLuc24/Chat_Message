import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private publisher: Redis;
  private subscriber: Redis;
  private messageHandler: ((conversationId: string, message: any) => void) | null = null;

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
          this.messageHandler(conversationId, data.data);
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
    await this.client.setex(`socket:${userId}`, 300, socketId);
  }

  async getSocketId(userId: string): Promise<string | null> {
    return await this.client.get(`socket:${userId}`);
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

  setMessageHandler(handler: (conversationId: string, message: any) => void): void {
    this.messageHandler = handler;
  }
}
