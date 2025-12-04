import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SocketModule } from './socket/socket.module';
import { RedisModule } from './redis/redis.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    SocketModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
