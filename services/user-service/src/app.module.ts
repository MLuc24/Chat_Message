import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { EventsModule } from './events/events.module';
import { UploadModule } from './common/upload.module';
import { ThemeModule } from './theme/theme.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    StorageModule,
    EventsModule,
    UploadModule,
    UserModule,
    ThemeModule,
  ],
})
export class AppModule {}
