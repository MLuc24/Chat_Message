import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = process.env.PORT || 9000;
  await app.listen(port);

  console.log(`⚡ Realtime Service is running on: http://localhost:${port}`);
  console.log(`🔌 WebSocket ready on ws://localhost:${port}`);
}

bootstrap();
