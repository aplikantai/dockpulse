import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './modules/database/prisma.module';
import { StorageModule } from './modules/storage/storage.module';
import { BrandingModule } from './modules/branding/branding.module';
import { CacheModule } from './modules/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { TenantModule } from './modules/tenant/tenant.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ProductsModule } from './modules/products/products.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PlatformModule } from './modules/platform/platform.module';
import { HealthController } from './health.controller';
import { EventsModule } from './modules/events/events.module';
import { DataBusModule } from './modules/data-bus/data-bus.module';
import { ModuleRegistryModule } from './modules/module-registry/module-registry.module';
import { StockModule } from './modules/stock/stock.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests
      },
      {
        name: 'strict',
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests (for heavy endpoints)
      },
    ]),
    CacheModule,
    PrismaModule,
    EventsModule, // EVENT BUS - Must be imported early
    DataBusModule, // DATA BUS - Must be imported early
    ModuleRegistryModule, // MODULE REGISTRY - Must be imported early
    StorageModule,
    BrandingModule,
    AuthModule,
    TenantModule,
    PlatformModule,
    UsersModule,
    CustomersModule,
    OrdersModule,
    QuotesModule,
    ProductsModule,
    SettingsModule,
    StockModule, // @stock module - extends Product entity
    AdminModule, // Platform Admin Panel
  ],
  controllers: [HealthController],
  providers: [
    // Apply throttler guard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply JWT auth guard globally (use @Public() for open endpoints)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply roles guard globally (use @Roles() to restrict access)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
