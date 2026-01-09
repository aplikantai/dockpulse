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
import { PriceTableService } from './services/price-table.service';
import { SurchargeService } from './services/surcharge.service';
import { MarginCalculatorService } from './services/margin-calculator.service';
import { PriceResolverService } from './services/price-resolver.service';
import { PricingController } from './controllers/pricing.controller';

/**
 * PricingModule - Advanced Pricing & Margin Management
 *
 * Full pricing functionality with submodules:
 * - PRICING.TABLES - Multi-level price tables with validity periods
 * - PRICING.DUAL - Dual pricing (hidden purchase price / sale price)
 * - PRICING.SURCHARGES - Surcharges (FIXED, PERCENT, PER_M2, PER_MB, etc.)
 * - PRICING.MARGINS - Margin calculation and monitoring
 *
 * Based on analysis of tapparella.pl and inconcept.pl
 */
@Module({
  imports: [PrismaModule],
  controllers: [PricingController],
  providers: [
    PriceTableService,
    SurchargeService,
    MarginCalculatorService,
    PriceResolverService,
  ],
  exports: [
    PriceTableService,
    SurchargeService,
    MarginCalculatorService,
    PriceResolverService,
  ],
})
export class PricingModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Register module in Module Registry with submodules
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@pricing',
        name: 'System Cenników',
        description: 'Zaawansowane cenniki, dopłaty i kalkulacja marży',
        version: '1.0.0',
        category: ModuleCategory.SALES,
        moduleClass: PricingModule,
        dependencies: ['@products'],
        defaultEnabled: false,
        isCore: false,
        icon: 'currency-dollar',
        requiredPlan: TenantPlan.STARTER,
        features: [
          {
            code: 'PRICING.TABLES',
            name: 'Cenniki',
            description: 'Wielopoziomowe cenniki z datami ważności',
            defaultEnabled: true,
          },
          {
            code: 'PRICING.DUAL',
            name: 'Dual pricing',
            description: 'Ukryte ceny zakupu i ceny sprzedaży',
            defaultEnabled: true,
          },
          {
            code: 'PRICING.SURCHARGES',
            name: 'Dopłaty',
            description: 'System dopłat (stałe, procentowe, za m², mb, kg)',
            defaultEnabled: false,
          },
          {
            code: 'PRICING.MARGINS',
            name: 'Kalkulacja marży',
            description: 'Monitoring i kalkulacja marży na produktach',
            defaultEnabled: false,
          },
        ],
        defaultConfig: {
          defaultVatRate: 23,
          defaultCurrency: 'PLN',
          roundPricesToNearest: 0.01,
          showPurchasePriceToRoles: ['ADMIN', 'OWNER'],
          lowMarginThreshold: 10,
        },
      }),
    );

    // 2. Extend Product entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'product',
        moduleCode: '@pricing',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'purchasePrice',
            type: 'number',
            ui: {
              label: 'Cena zakupu',
              placeholder: '0.00',
              helpText: 'Cena netto zakupu od dostawcy (widoczna tylko dla Admin/Owner)',
              group: 'Ceny',
              order: 1,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'targetMarginPercent',
            type: 'number',
            ui: {
              label: 'Docelowa marża %',
              placeholder: '30',
              helpText: 'Docelowa marża procentowa (widoczna tylko dla Admin/Owner)',
              group: 'Ceny',
              order: 2,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'minSalePrice',
            type: 'number',
            ui: {
              label: 'Cena minimalna',
              placeholder: '0.00',
              helpText: 'Minimalna cena sprzedaży (nie sprzedawać poniżej)',
              group: 'Ceny',
              order: 3,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'priceCategoryId',
            type: 'string',
            ui: {
              label: 'Kategoria cenowa',
              widget: 'select',
              helpText: 'Przypisana kategoria cenowa',
              group: 'Ceny',
              order: 4,
            },
            addedBy: '@pricing',
          }),
        ],
        tabs: [
          {
            code: 'price_history',
            label: 'Historia cen',
            dataEndpoint: '/api/pricing/resolve/history/{id}',
            icon: 'chart-line',
            order: 1,
            addedBy: '@pricing',
          },
          {
            code: 'margin_analysis',
            label: 'Analiza marży',
            dataEndpoint: '/api/pricing/margin/calculate?productId={id}',
            icon: 'calculator',
            order: 2,
            addedBy: '@pricing',
          },
        ],
      }),
    );

    // 3. Extend Customer entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'customer',
        moduleCode: '@pricing',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'priceTableId',
            type: 'string',
            ui: {
              label: 'Cennik',
              widget: 'select',
              helpText: 'Przypisany cennik dla klienta',
              group: 'Ceny',
              order: 1,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'priceCategoryCode',
            type: 'string',
            ui: {
              label: 'Kategoria cenowa',
              widget: 'select',
              helpText: 'Kategoria cenowa (RETAIL, WHOLESALE, VIP)',
              group: 'Ceny',
              order: 2,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'discountPercent',
            type: 'number',
            ui: {
              label: 'Rabat stały %',
              placeholder: '0',
              helpText: 'Stały rabat procentowy dla klienta',
              group: 'Ceny',
              order: 3,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'creditLimit',
            type: 'number',
            ui: {
              label: 'Limit kredytowy',
              placeholder: '0.00',
              helpText: 'Maksymalny kredyt kupiecki',
              group: 'Finanse',
              order: 4,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'paymentTerms',
            type: 'number',
            ui: {
              label: 'Termin płatności (dni)',
              placeholder: '14',
              helpText: 'Domyślny termin płatności',
              group: 'Finanse',
              order: 5,
            },
            addedBy: '@pricing',
          }),
        ],
      }),
    );

    // 4. Extend Order entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'order',
        moduleCode: '@pricing',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'priceTableId',
            type: 'string',
            ui: {
              label: 'Cennik',
              widget: 'select',
              helpText: 'Użyty cennik',
              group: 'Ceny',
              order: 1,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'discountPercent',
            type: 'number',
            ui: {
              label: 'Rabat %',
              placeholder: '0',
              helpText: 'Zastosowany rabat procentowy',
              group: 'Ceny',
              order: 2,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'discountValue',
            type: 'number',
            ui: {
              label: 'Wartość rabatu',
              placeholder: '0.00',
              helpText: 'Wartość kwotowa rabatu',
              group: 'Ceny',
              order: 3,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'surchargesTotal',
            type: 'number',
            ui: {
              label: 'Suma dopłat',
              placeholder: '0.00',
              helpText: 'Łączna wartość dopłat',
              group: 'Ceny',
              order: 4,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'marginPercent',
            type: 'number',
            ui: {
              label: 'Marża %',
              helpText: 'Obliczona marża procentowa zamówienia (widoczna tylko dla Admin/Owner)',
              group: 'Ceny',
              order: 5,
            },
            addedBy: '@pricing',
          }),
          EntityDefinitionFactory.createField({
            name: 'marginValue',
            type: 'number',
            ui: {
              label: 'Wartość marży',
              helpText: 'Obliczona wartość marży (widoczna tylko dla Admin/Owner)',
              group: 'Ceny',
              order: 6,
            },
            addedBy: '@pricing',
          }),
        ],
      }),
    );

    // 5. Register PriceCategory entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'price_category',
        name: 'Kategoria cenowa',
        description: 'Hierarchiczna kategoria cenowa (RETAIL, WHOLESALE, VIP)',
        ownerModule: '@pricing',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'code',
            type: 'string',
            required: true,
            ui: { label: 'Kod' },
          }),
          EntityDefinitionFactory.createField({
            name: 'name',
            type: 'string',
            required: true,
            ui: { label: 'Nazwa' },
          }),
          EntityDefinitionFactory.createField({
            name: 'defaultDiscountPercent',
            type: 'number',
            ui: { label: 'Domyślny rabat %' },
          }),
        ],
      }),
    );

    // 6. Register PriceTable entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'price_table',
        name: 'Cennik',
        description: 'Cennik z datami ważności',
        ownerModule: '@pricing',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'code',
            type: 'string',
            required: true,
            ui: { label: 'Kod' },
          }),
          EntityDefinitionFactory.createField({
            name: 'name',
            type: 'string',
            required: true,
            ui: { label: 'Nazwa' },
          }),
          EntityDefinitionFactory.createField({
            name: 'validFrom',
            type: 'date',
            ui: { label: 'Ważny od' },
          }),
          EntityDefinitionFactory.createField({
            name: 'validTo',
            type: 'date',
            ui: { label: 'Ważny do' },
          }),
          EntityDefinitionFactory.createField({
            name: 'priceType',
            type: 'enum',
            validation: {
              enum: ['STANDARD', 'PROMOTION', 'CONTRACT', 'SEASONAL', 'CLEARANCE'],
            },
            ui: { label: 'Typ cennika' },
          }),
        ],
      }),
    );

    // 7. Register Surcharge entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'surcharge',
        name: 'Dopłata',
        description: 'Definicja dopłaty (transport, montaż, etc.)',
        ownerModule: '@pricing',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'code',
            type: 'string',
            required: true,
            ui: { label: 'Kod' },
          }),
          EntityDefinitionFactory.createField({
            name: 'name',
            type: 'string',
            required: true,
            ui: { label: 'Nazwa' },
          }),
          EntityDefinitionFactory.createField({
            name: 'type',
            type: 'enum',
            required: true,
            validation: {
              enum: ['FIXED', 'PERCENT', 'PER_M2', 'PER_MB', 'PER_UNIT', 'PER_KG', 'TIERED'],
            },
            ui: { label: 'Typ' },
          }),
          EntityDefinitionFactory.createField({
            name: 'value',
            type: 'number',
            required: true,
            ui: { label: 'Wartość' },
          }),
        ],
      }),
    );

    console.log('[PricingModule] Registered @pricing module with 4 submodules');
  }
}
