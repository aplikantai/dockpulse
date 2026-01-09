import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './controllers/admin.controller';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminService } from './services/admin.service';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminGuard } from './guards/admin.guard';
import { PrismaModule } from '../database/prisma.module';
import { ModuleRegistryModule } from '../module-registry/module-registry.module';

/**
 * AdminModule - Platform Administration
 *
 * Provides:
 * - Platform-wide statistics
 * - Tenant management
 * - Module catalog & installation
 * - User management
 * - Admin authentication
 *
 * Access restricted to Platform Admins only
 */
@Module({
  imports: [
    PrismaModule,
    ModuleRegistryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService, AdminGuard],
  exports: [AdminService, AdminAuthService],
})
export class AdminModule {}
