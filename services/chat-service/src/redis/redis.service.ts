import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private publisher: Redis;
  private subscriber: Redis;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl);
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    
    console.log('✅ Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.publisher.quit();
    await this.subscriber.quit();
  }

  async publishMessage(conversationId: string, message: any): Promise<void> {
    await this.publisher.publish(
      `conversation:${conversationId}`,
      JSON.stringify({ type: 'new_message', data: message }),
    );
  }

  async publishTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    await this.publisher.publish(
      `conversation:${conversationId}`,
      JSON.stringify({ type: 'typing', userId, isTyping }),
    );
  }

  async publishMessageStatus(messageId: string, userId: string, status: string): Promise<void> {
    await this.publisher.publish(
      `message:${messageId}`,
      JSON.stringify({ type: 'status', userId, status }),
    );
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
}
