import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;

  async onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    console.log('✅ Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
  }

  async setUserOnline(userId: string): Promise<void> {
    const key = `user:online:${userId}`;
    await this.client.setex(key, 300, '1'); // 5 minutes TTL
  }

  async setUserOffline(userId: string): Promise<void> {
    const onlineKey = `user:online:${userId}`;
    const lastSeenKey = `user:lastSeen:${userId}`;
    
    await this.client.del(onlineKey);
    await this.client.set(lastSeenKey, Date.now());
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const key = `user:online:${userId}`;
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  async getLastSeen(userId: string): Promise<Date | null> {
    const key = `user:lastSeen:${userId}`;
    const timestamp = await this.client.get(key);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          console.error(`Error parsing message from ${channel}:`, error);
        }
      }
    });
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.client.publish(channel, JSON.stringify(message));
  }

  getClient(): Redis {
    return this.client;
  }
}
