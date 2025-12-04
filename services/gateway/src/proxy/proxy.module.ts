import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

@Module({
  controllers: [ProxyController],
  providers: [AuthMiddleware],
})
export class ProxyModule {}
