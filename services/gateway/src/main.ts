import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`🚀 Gateway is running on: http://localhost:${port}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Routes:`);
  console.log(`   /api/auth/*  → ${process.env.AUTH_SERVICE_URL}`);
  console.log(`   /api/users/* → ${process.env.USER_SERVICE_URL}`);
  console.log(`   /api/chat/*  → ${process.env.CHAT_SERVICE_URL}`);
  console.log(`   /ws          → ${process.env.REALTIME_SERVICE_URL}`);
}

bootstrap();
