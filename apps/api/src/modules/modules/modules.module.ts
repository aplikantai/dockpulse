import { Module } from '@nestjs/common';
import { SubmodulesService } from './submodules.service';
import { SubmodulesController } from './submodules.controller';
import { SubmoduleGuard } from './guards/submodule.guard';
import { PrismaModule } from '../database/prisma.module';

/**
 * ModulesModule - Module for managing modules and submodules
 *
 * This module provides:
 * - SubmodulesService for business logic
 * - SubmodulesController for REST API
 * - SubmoduleGuard for authorization
 *
 * Usage:
 * Import this module in app.module.ts to enable submodule management
 */
@Module({
  imports: [PrismaModule],
  controllers: [SubmodulesController],
  providers: [SubmodulesService, SubmoduleGuard],
  exports: [SubmodulesService, SubmoduleGuard],
})
export class ModulesModule {}
