import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('DockPulse API')
    .setDescription(`
# DockPulse Auto-Branding API

Intelligent branding extraction system for multi-tenant SaaS platform.

## Features
- 🎨 **Auto-Branding** - Extract colors, logos, company data from any website
- 🤖 **AI-Powered** - Uses OpenRouter LLM for intelligent data extraction
- 🖼️ **Vision Analysis** - Analyzes logos to extract brand colors
- 💾 **S3 Storage** - Assets stored in S3/MinIO
- ⚡ **Redis Caching** - Fast cached responses

## Rate Limits
- Global: 100 requests/minute
- Extract/Preview: 10 requests/minute
    `)
    .setVersion('2.0.0')
    .addTag('branding', 'Auto-Branding endpoints')
    .addServer('http://localhost:4000', 'Development')
    .addServer('https://api.dockpulse.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'DockPulse API Docs',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 DockPulse API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
