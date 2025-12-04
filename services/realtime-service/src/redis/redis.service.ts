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
}
