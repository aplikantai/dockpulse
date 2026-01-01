import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { TenantMiddleware } from './tenant.middleware';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [],
  exports: [],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        'health',
        'api/health',
        'api/docs',
        'api/docs/(.*)',
        'branding/preview',
        'branding/health',
        { path: 'branding/:tenantSlug', method: RequestMethod.GET },
        { path: 'platform/tenants/register', method: RequestMethod.POST },
        { path: 'platform/tenants/check/:slug', method: RequestMethod.GET },
        { path: 'platform/auth/login', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
