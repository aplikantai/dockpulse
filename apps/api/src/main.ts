import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

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
# DockPulse - Modular Multi-Tenant SaaS Platform

Next-generation modular SaaS platform with event-driven architecture, dynamic entity extensions, and plug & play modules.

## Architecture

### 🔌 Event Bus
- **Redis pub/sub** for distributed events
- **Local event emitter** for in-process handlers
- **EventLog** for audit trail
- **WorkflowTrigger** execution engine

### 📊 Data Bus
- **Dynamic entity extensions** - modules can add fields to existing entities
- **Relation management** - one-to-many, many-to-many
- **Entity hooks** - beforeCreate, afterUpdate, etc.
- **Custom tabs & actions** in UI

### 🧩 Module Registry
- **Plug & play modules** - dynamically loaded at runtime
- **Dependency management** - modules can depend on other modules
- **Per-tenant activation** - enable/disable modules per tenant
- **Feature flags** - granular feature control

## Available Modules

- **@stock** - Inventory & warehouse management
- **@calendar** - Events & scheduling
- **@invoicing** - Billing & payment tracking
- **@webhooks** - Outbound webhook integrations

## Authentication
- **JWT tokens** via Bearer authentication
- **Multi-tenant isolation** via X-Tenant-ID header
- **Role-based access control** (ADMIN, USER, PLATFORM_ADMIN)

## Rate Limits
- **Global**: 100 requests/minute per IP
- **Strict**: 10 requests/minute for heavy endpoints
- **Per-tenant**: Configurable limits

## Headers
- \`X-Tenant-ID\` - Required for tenant-scoped endpoints
- \`Authorization\` - Bearer JWT token
    `)
    .setVersion('2.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Authorization')
    .addTag('platform', 'Platform Administration')
    .addTag('tenants', 'Tenant Management')
    .addTag('customers', 'Customer Management')
    .addTag('orders', 'Order Management')
    .addTag('products', 'Product Management')
    .addTag('quotes', 'Quote Management')
    .addTag('users', 'User Management')
    .addTag('settings', 'Settings & Configuration')
    .addTag('modules', 'Module Management')
    .addTag('branding', 'Branding & Customization')
    .addServer('http://localhost:3003', 'Development')
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
