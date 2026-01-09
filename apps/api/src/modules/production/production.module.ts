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
import { PrismaModule } from '../database/prisma.module';
import { EventsModule } from '../events/events.module';
import { PlanningService } from './services/planning.service';
import { ConversionService } from './services/conversion.service';
import { PreorderService } from './services/preorder.service';
import { ProductionController } from './controllers/production.controller';

/**
 * ProductionModule - Production Planning & Management
 *
 * Full production planning functionality with submodules:
 * - PRODUCTION.PLANNING - Daily production plan aggregation from orders
 * - PRODUCTION.CONVERSION - Unit conversion (kg↔szt, etc.)
 * - PRODUCTION.PREORDER - 60-day preorder calendar with slots
 * - PRODUCTION.RECIPES - Production recipes (optional)
 *
 * Based on analysis of wedlinyodkaroliny.pl
 */
@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [ProductionController],
  providers: [PlanningService, ConversionService, PreorderService],
  exports: [PlanningService, ConversionService, PreorderService],
})
export class ProductionModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Register module in Module Registry with submodules
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@production',
        name: 'Planowanie Produkcji',
        description: 'Planowanie produkcji, konwersja jednostek i kalendarz pre-orderów',
        version: '1.0.0',
        category: ModuleCategory.INVENTORY,
        moduleClass: ProductionModule,
        dependencies: ['@products', '@orders'],
        defaultEnabled: false,
        isCore: false,
        icon: 'factory',
        requiredPlan: TenantPlan.STARTER,
        features: [
          {
            code: 'PRODUCTION.PLANNING',
            name: 'Plany produkcji',
            description: 'Agregacja zamówień i tworzenie planów produkcji na dzień',
            defaultEnabled: true,
          },
          {
            code: 'PRODUCTION.CONVERSION',
            name: 'Konwersja jednostek',
            description: 'Przeliczanie między jednostkami (kg↔szt, l↔ml, etc.)',
            defaultEnabled: true,
          },
          {
            code: 'PRODUCTION.PREORDER',
            name: 'Kalendarz pre-orderów',
            description: 'System slotów z limitami zamówień na 60 dni wprzód',
            defaultEnabled: false,
          },
          {
            code: 'PRODUCTION.RECIPES',
            name: 'Receptury produkcyjne',
            description: 'Definicje receptur z listą składników',
            defaultEnabled: false,
          },
        ],
        defaultConfig: {
          autoGeneratePlanFromOrders: false,
          preorderDaysAhead: 60,
          defaultCloseBeforeDays: 2,
          defaultMaxOrdersPerSlot: 50,
        },
      }),
    );

    // 2. Extend Product entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'product',
        moduleCode: '@production',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'defaultUnit',
            type: 'string',
            defaultValue: 'szt',
            ui: {
              label: 'Domyślna jednostka',
              placeholder: 'szt, kg, l, op',
              helpText: 'Jednostka używana w produkcji',
              group: 'Produkcja',
              order: 1,
            },
            addedBy: '@production',
          }),
          EntityDefinitionFactory.createField({
            name: 'productionUnit',
            type: 'string',
            ui: {
              label: 'Jednostka produkcji',
              placeholder: 'kg',
              helpText: 'Jednostka w jakiej mierzona jest produkcja',
              group: 'Produkcja',
              order: 2,
            },
            addedBy: '@production',
          }),
          EntityDefinitionFactory.createField({
            name: 'productionLeadTime',
            type: 'number',
            defaultValue: 0,
            ui: {
              label: 'Czas realizacji (dni)',
              placeholder: '1',
              helpText: 'Ile dni przed potrzeba rozpocząć produkcję',
              group: 'Produkcja',
              order: 3,
            },
            addedBy: '@production',
          }),
          EntityDefinitionFactory.createField({
            name: 'avgWeightPerUnit',
            type: 'number',
            ui: {
              label: 'Średnia waga sztuki (kg)',
              placeholder: '0.25',
              helpText: 'Używana do przeliczania kg↔szt',
              group: 'Produkcja',
              order: 4,
            },
            addedBy: '@production',
          }),
          EntityDefinitionFactory.createField({
            name: 'isProducible',
            type: 'boolean',
            defaultValue: true,
            ui: {
              label: 'Produkt produkowany',
              helpText: 'Czy produkt jest wytwarzany (nie kupowany)',
              group: 'Produkcja',
              order: 5,
            },
            addedBy: '@production',
          }),
        ],
        tabs: [
          {
            code: 'production_history',
            label: 'Historia produkcji',
            dataEndpoint: '/api/production/products/{id}/history',
            icon: 'history',
            order: 1,
            addedBy: '@production',
          },
          {
            code: 'product_conversions',
            label: 'Konwersje jednostek',
            dataEndpoint: '/api/production/conversions?productId={id}',
            icon: 'repeat',
            order: 2,
            addedBy: '@production',
          },
        ],
      }),
    );

    // 3. Extend Order entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'order',
        moduleCode: '@production',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'productionPlanId',
            type: 'string',
            ui: {
              label: 'Plan produkcji',
              widget: 'select',
              helpText: 'Powiązany plan produkcji',
              group: 'Produkcja',
              order: 1,
            },
            addedBy: '@production',
          }),
          EntityDefinitionFactory.createField({
            name: 'isPreorder',
            type: 'boolean',
            defaultValue: false,
            ui: {
              label: 'Pre-order',
              helpText: 'Czy zamówienie jest pre-orderem',
              group: 'Produkcja',
              order: 2,
            },
            addedBy: '@production',
          }),
          EntityDefinitionFactory.createField({
            name: 'preorderSlotId',
            type: 'string',
            ui: {
              label: 'Slot pre-order',
              widget: 'select',
              helpText: 'Wybrany slot pre-orderu',
              group: 'Produkcja',
              order: 3,
            },
            addedBy: '@production',
          }),
          EntityDefinitionFactory.createField({
            name: 'preorderSlotDate',
            type: 'date',
            ui: {
              label: 'Data pre-orderu',
              helpText: 'Data odbioru/dostawy pre-orderu',
              group: 'Produkcja',
              order: 4,
            },
            addedBy: '@production',
          }),
        ],
      }),
    );

    // 4. Register ProductionPlan entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'production_plan',
        name: 'Plan produkcji',
        description: 'Dzienny plan produkcji agregujący zamówienia',
        ownerModule: '@production',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'planNumber',
            type: 'string',
            required: true,
            ui: { label: 'Numer planu' },
          }),
          EntityDefinitionFactory.createField({
            name: 'planDate',
            type: 'date',
            required: true,
            ui: { label: 'Data produkcji' },
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            required: true,
            validation: {
              enum: ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            },
            ui: { label: 'Status' },
          }),
          EntityDefinitionFactory.createField({
            name: 'totalItems',
            type: 'number',
            ui: { label: 'Liczba pozycji' },
          }),
          EntityDefinitionFactory.createField({
            name: 'completedItems',
            type: 'number',
            ui: { label: 'Ukończone pozycje' },
          }),
        ],
      }),
    );

    // 5. Register PreorderSlot entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'preorder_slot',
        name: 'Slot pre-orderu',
        description: 'Slot czasowy z limitem zamówień',
        ownerModule: '@production',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'slotDate',
            type: 'date',
            required: true,
            ui: { label: 'Data' },
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            required: true,
            validation: {
              enum: ['OPEN', 'FULL', 'CLOSED', 'COMPLETED'],
            },
            ui: { label: 'Status' },
          }),
          EntityDefinitionFactory.createField({
            name: 'maxOrders',
            type: 'number',
            ui: { label: 'Max zamówień' },
          }),
          EntityDefinitionFactory.createField({
            name: 'currentOrders',
            type: 'number',
            ui: { label: 'Aktualne zamówienia' },
          }),
        ],
      }),
    );

    // 6. Register UnitConversion entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'unit_conversion',
        name: 'Konwersja jednostek',
        description: 'Definicja przelicznika między jednostkami',
        ownerModule: '@production',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'fromUnit',
            type: 'string',
            required: true,
            ui: { label: 'Z jednostki' },
          }),
          EntityDefinitionFactory.createField({
            name: 'toUnit',
            type: 'string',
            required: true,
            ui: { label: 'Na jednostkę' },
          }),
          EntityDefinitionFactory.createField({
            name: 'conversionRate',
            type: 'number',
            required: true,
            ui: { label: 'Przelicznik' },
          }),
        ],
      }),
    );

    console.log('[ProductionModule] Registered @production module with 4 submodules');
  }
}
