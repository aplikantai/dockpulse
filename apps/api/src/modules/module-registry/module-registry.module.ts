import { Module, Global } from '@nestjs/common';
import { ModuleRegistryService } from './module-registry.service';
import { ModuleRegistry } from './registry/module-registry';
import { PrismaModule } from '../database/prisma.module';

/**
 * ModuleRegistryModule - Global module for managing DockPulse modules
 *
 * This module provides:
 * - ModuleRegistryService for module registration and management
 * - ModuleRegistry for module storage
 * - Per-tenant module enablement/disablement
 * - Dependency validation
 * - Feature flag management
 *
 * Usage in other modules:
 *
 * ```typescript
 * @DockPulseModule({
 *   code: '@stock',
 *   name: 'Stock Management',
 *   version: '1.0.0',
 *   category: ModuleCategory.INVENTORY,
 *   dependencies: ['@products'],
 * })
 * @Module({
 *   imports: [DataBusModule],
 * })
 * export class StockModule implements OnModuleInit {
 *   constructor(
 *     private moduleRegistry: ModuleRegistryService,
 *     private dataBus: DataBusService,
 *   ) {}
 *
 *   async onModuleInit() {
 *     // Register module
 *     this.moduleRegistry.register({
 *       code: '@stock',
 *       name: 'Stock Management',
 *       version: '1.0.0',
 *       category: ModuleCategory.INVENTORY,
 *       moduleClass: StockModule,
 *       dependencies: ['@products'],
 *     });
 *
 *     // Extend Product entity
 *     this.dataBus.extend({
 *       targetEntity: 'product',
 *       moduleCode: '@stock',
 *       fields: [
 *         { name: 'stockQuantity', type: 'number', required: true },
 *       ],
 *     });
 *   }
 * }
 * ```
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [ModuleRegistry, ModuleRegistryService],
  exports: [ModuleRegistryService],
})
export class ModuleRegistryModule {}
