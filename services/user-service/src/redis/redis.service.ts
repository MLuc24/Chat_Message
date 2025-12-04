import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  async onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    console.log('✅ Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
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

  getClient(): Redis {
    return this.client;
  }
}
