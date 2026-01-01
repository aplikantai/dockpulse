import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
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
 *
 * Access restricted to Platform Admins only
 */
@Module({
  imports: [PrismaModule, ModuleRegistryModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
