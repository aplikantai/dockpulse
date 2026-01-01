import { Module, Global } from '@nestjs/common';
import { DataBusService } from './data-bus.service';
import { EntityRegistry } from './registry/entity-registry';

/**
 * DataBusModule - Global module for entity registration and management
 *
 * This module provides:
 * - DataBusService for entity registration and extension
 * - EntityRegistry for entity storage
 * - Support for dynamic entity schema
 * - Hook execution system
 * - Action execution system
 *
 * Usage in other modules:
 *
 * ```typescript
 * @Module({
 *   imports: [DataBusModule], // Already global, but can be imported for clarity
 * })
 * export class StockModule implements OnModuleInit {
 *   constructor(private dataBus: DataBusService) {}
 *
 *   async onModuleInit() {
 *     // Extend Product entity with stock fields
 *     this.dataBus.extend({
 *       targetEntity: 'product',
 *       moduleCode: '@stock',
 *       fields: [
 *         { name: 'stockQuantity', type: 'number', required: true },
 *         { name: 'reorderLevel', type: 'number' },
 *         { name: 'warehouseLocation', type: 'string' },
 *       ],
 *       tabs: [
 *         {
 *           code: 'stock_movements',
 *           label: 'Stock Movements',
 *           dataEndpoint: '/api/stock/movements',
 *           icon: 'warehouse',
 *         },
 *       ],
 *     });
 *   }
 * }
 * ```
 */
@Global()
@Module({
  providers: [EntityRegistry, DataBusService],
  exports: [DataBusService],
})
export class DataBusModule {}
