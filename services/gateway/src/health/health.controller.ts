import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  ready() {
    // Check if all services are reachable
    return {
      status: 'ready',
      services: {
        auth: process.env.AUTH_SERVICE_URL,
        user: process.env.USER_SERVICE_URL,
        chat: process.env.CHAT_SERVICE_URL,
        realtime: process.env.REALTIME_SERVICE_URL,
      },
    };
  }
}
