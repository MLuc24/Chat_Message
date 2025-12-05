import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    this.publisher = new Redis(redisUrl);
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('✅ Redis connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Redis', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
    await this.publisher.quit();
    this.logger.log('Redis disconnected');
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<void> {
    await this.client.hdel(key, ...fields);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<void> {
    await this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<void> {
    await this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  async zrem(key: string, ...members: string[]): Promise<void> {
    await this.client.zrem(key, ...members);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrange(key, start, stop);
  }

  // Pub/Sub
  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
    this.logger.debug(`Published to ${channel}: ${message.substring(0, 100)}`);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
    this.logger.log(`Subscribed to channel: ${channel}`);
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
    this.logger.log(`Unsubscribed from channel: ${channel}`);
  }

  // JSON helpers
  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    const json = JSON.stringify(value);
    await this.set(key, json, ttl);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async publishJson<T>(channel: string, data: T): Promise<void> {
    const message = JSON.stringify(data);
    await this.publish(channel, message);
  }

  getClient(): Redis {
    return this.client;
  }
}
