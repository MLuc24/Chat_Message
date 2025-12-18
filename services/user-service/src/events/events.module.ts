import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [RedisModule, PrismaModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
