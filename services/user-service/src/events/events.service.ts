import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Subscribe to user.created events from auth-service
    await this.redis.subscribe('user.created', async (message) => {
      await this.handleUserCreated(message);
    });

    this.logger.log('✅ Subscribed to user.created events');
  }

  private async handleUserCreated(data: any) {
    try {
      this.logger.log(`Received user.created event: ${JSON.stringify(data)}`);
      
      const { userId, email, name } = data;

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (existingUser) {
        this.logger.warn(`User already exists: ${userId}`);
        return;
      }

      // Create user in user-service database
      await this.prisma.user.create({
        data: {
          id: userId,
          email,
          name,
        },
      });

      this.logger.log(`✅ User created successfully in user-service: ${userId} - ${email}`);
    } catch (error) {
      this.logger.error('Error handling user.created event:', error);
    }
  }
}
