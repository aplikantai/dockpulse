import { Module, OnModuleInit } from '@nestjs/common';
import { DataBusService } from '../data-bus/data-bus.service';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import {
  ModuleCategory,
  ModuleDefinitionFactory,
  TenantPlan,
} from '../module-registry/interfaces/module-definition.interface';
import { EntityDefinitionFactory } from '../data-bus/interfaces/entity-definition.interface';
import { EntityExtensionFactory } from '../data-bus/interfaces/entity-extension.interface';
import { StockService } from './services/stock.service';
import { PrismaModule } from '../database/prisma.module';
import { OrderStockHandler } from './handlers/order-stock.handler';

/**
 * StockModule - Stock/Inventory management module
 *
 * This module demonstrates the plug & play architecture:
 * - Registers itself in Module Registry
 * - Extends Product entity via Data Bus
 * - Listens to order.created events via Event Bus
 * - Registers StockMovement entity via Data Bus
 */
@Module({
  imports: [PrismaModule],
  providers: [StockService, OrderStockHandler],
  exports: [StockService],
})
export class StockModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Register module in Module Registry
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@stock',
        name: 'Stock Management',
        description: 'Track inventory levels, stock movements, and warehouse locations',
        version: '1.0.0',
        category: ModuleCategory.INVENTORY,
        moduleClass: StockModule,
        dependencies: ['@products'],
        defaultEnabled: false,
        isCore: false,
        icon: 'warehouse',
        requiredPlan: TenantPlan.STARTER,
        features: [
          {
            code: 'stock_tracking',
            name: 'Stock Tracking',
            description: 'Track stock levels in real-time',
            defaultEnabled: true,
          },
          {
            code: 'stock_movements',
            name: 'Stock Movements',
            description: 'Record stock movements (in/out/adjustment)',
            defaultEnabled: true,
          },
          {
            code: 'reorder_alerts',
            name: 'Reorder Alerts',
            description: 'Automated alerts when stock is low',
            defaultEnabled: false,
          },
          {
            code: 'multi_warehouse',
            name: 'Multi-Warehouse',
            description: 'Manage stock across multiple warehouses',
            defaultEnabled: false,
          },
        ],
        defaultConfig: {
          autoDeductOnOrder: true,
          alertThreshold: 10,
          defaultWarehouse: 'main',
        },
      }),
    );

    // 2. Extend Product entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'product',
        moduleCode: '@stock',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'stockQuantity',
            type: 'number',
            required: true,
            defaultValue: 0,
            ui: {
              label: 'Stock Quantity',
              placeholder: '0',
              group: 'Stock',
              order: 1,
            },
            addedBy: '@stock',
          }),
          EntityDefinitionFactory.createField({
            name: 'reorderLevel',
            type: 'number',
            defaultValue: 10,
            ui: {
              label: 'Reorder Level',
              placeholder: '10',
              helpText: 'Alert when stock falls below this level',
              group: 'Stock',
              order: 2,
            },
            addedBy: '@stock',
          }),
          EntityDefinitionFactory.createField({
            name: 'warehouseLocation',
            type: 'string',
            ui: {
              label: 'Warehouse Location',
              placeholder: 'e.g., Aisle 3, Shelf B',
              group: 'Stock',
              order: 3,
            },
            addedBy: '@stock',
          }),
        ],
        relations: [
          EntityDefinitionFactory.createRelation({
            name: 'stockMovements',
            targetEntity: 'stock_movement',
            type: 'one-to-many',
            addedBy: '@stock',
          }),
        ],
        hooks: {
          afterUpdate: [
            {
              name: 'check_reorder_level',
              handler: async (context) => {
                const product = context.data;
                const stockQuantity = product.stockQuantity || 0;
                const reorderLevel = product.reorderLevel || 10;

                if (stockQuantity < reorderLevel) {
                  // TODO: Trigger reorder alert event
                  console.log(
                    `[Stock Alert] Product ${product.id} below reorder level: ${stockQuantity}/${reorderLevel}`,
                  );
                }
              },
              priority: 10,
              addedBy: '@stock',
            },
          ],
        },
        tabs: [
          {
            code: 'stock_movements',
            label: 'Stock Movements',
            dataEndpoint: '/api/stock/movements',
            icon: 'activity',
            order: 1,
            addedBy: '@stock',
          },
        ],
      }),
    );

    // 3. Register StockMovement entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'stock_movement',
        name: 'Stock Movement',
        description: 'Record of stock in/out/adjustment',
        ownerModule: '@stock',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'productId',
            type: 'string',
            required: true,
            ui: { label: 'Product' },
          }),
          EntityDefinitionFactory.createField({
            name: 'type',
            type: 'enum',
            required: true,
            validation: {
              enum: ['in', 'out', 'adjustment', 'return'],
            },
            ui: { label: 'Movement Type' },
          }),
          EntityDefinitionFactory.createField({
            name: 'quantity',
            type: 'number',
            required: true,
            ui: { label: 'Quantity' },
          }),
          EntityDefinitionFactory.createField({
            name: 'reason',
            type: 'string',
            ui: { label: 'Reason', widget: 'textarea' },
          }),
          EntityDefinitionFactory.createField({
            name: 'reference',
            type: 'string',
            ui: {
              label: 'Reference',
              helpText: 'Order ID, supplier invoice, etc.',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'createdAt',
            type: 'datetime',
            required: true,
            ui: { label: 'Date' },
          }),
        ],
      }),
    );
  }
}
