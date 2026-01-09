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
import { PointsService } from './services/points.service';
import { DiscountCodeService } from './services/discount-code.service';
import { TierService } from './services/tier.service';
import { LoyaltyController } from './controllers/loyalty.controller';

/**
 * LoyaltyModule - Program Lojalnościowy
 *
 * Full loyalty functionality with submodules:
 * - LOYALTY.POINTS - Points earning and redemption system
 * - LOYALTY.DISCOUNTS - Discount codes management
 * - LOYALTY.TIERS - Loyalty tiers (Bronze, Silver, Gold, Platinum)
 *
 * Based on analysis of eBukieteria loyalty system
 */
@Module({
  imports: [PrismaModule],
  controllers: [LoyaltyController],
  providers: [
    PointsService,
    DiscountCodeService,
    TierService,
  ],
  exports: [
    PointsService,
    DiscountCodeService,
    TierService,
  ],
})
export class LoyaltyModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Register module in Module Registry with submodules
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@loyalty',
        name: 'Program Lojalnościowy',
        description: 'System punktów, kodów rabatowych i poziomów lojalnościowych',
        version: '1.0.0',
        category: ModuleCategory.SALES,
        moduleClass: LoyaltyModule,
        dependencies: ['@customers'],
        defaultEnabled: false,
        isCore: false,
        icon: 'star',
        requiredPlan: TenantPlan.STARTER,
        features: [
          {
            code: 'LOYALTY.POINTS',
            name: 'System punktów',
            description: 'Naliczanie i wymiana punktów za zakupy',
            defaultEnabled: true,
          },
          {
            code: 'LOYALTY.DISCOUNTS',
            name: 'Kody rabatowe',
            description: 'Zarządzanie kodami rabatowymi i promocjami',
            defaultEnabled: true,
          },
          {
            code: 'LOYALTY.TIERS',
            name: 'Poziomy lojalnościowe',
            description: 'System poziomów (Brązowy, Srebrny, Złoty, Platynowy)',
            defaultEnabled: false,
          },
        ],
        defaultConfig: {
          pointsPerPln: 1,
          pointValue: 0.01,
          minRedeemPoints: 100,
          maxRedeemPercent: 50,
          pointsExpiryMonths: null,
          earnOnDiscountedOrders: true,
          allowPartialRedeem: true,
        },
      }),
    );

    // 2. Extend Customer entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'customer',
        moduleCode: '@loyalty',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'loyaltyPoints',
            type: 'number',
            ui: {
              label: 'Punkty lojalnościowe',
              helpText: 'Aktualna liczba punktów klienta',
              group: 'Lojalność',
              order: 1,
            },
            addedBy: '@loyalty',
          }),
          EntityDefinitionFactory.createField({
            name: 'lifetimePoints',
            type: 'number',
            ui: {
              label: 'Punkty łącznie',
              helpText: 'Wszystkie zdobyte punkty (historycznie)',
              group: 'Lojalność',
              order: 2,
            },
            addedBy: '@loyalty',
          }),
          EntityDefinitionFactory.createField({
            name: 'loyaltyTierId',
            type: 'string',
            ui: {
              label: 'Poziom lojalnościowy',
              widget: 'select',
              helpText: 'Aktualny poziom w programie lojalnościowym',
              group: 'Lojalność',
              order: 3,
            },
            addedBy: '@loyalty',
          }),
          EntityDefinitionFactory.createField({
            name: 'loyaltyTierName',
            type: 'string',
            ui: {
              label: 'Nazwa poziomu',
              helpText: 'Nazwa aktualnego poziomu (Brązowy, Srebrny, Złoty, Platynowy)',
              group: 'Lojalność',
              order: 4,
            },
            addedBy: '@loyalty',
          }),
          EntityDefinitionFactory.createField({
            name: 'loyaltyEnrolledAt',
            type: 'date',
            ui: {
              label: 'Data dołączenia',
              helpText: 'Data dołączenia do programu lojalnościowego',
              group: 'Lojalność',
              order: 5,
            },
            addedBy: '@loyalty',
          }),
        ],
        tabs: [
          {
            code: 'loyalty_status',
            label: 'Lojalność',
            dataEndpoint: '/api/loyalty/customers/{id}',
            icon: 'star',
            order: 1,
            addedBy: '@loyalty',
          },
          {
            code: 'points_history',
            label: 'Historia punktów',
            dataEndpoint: '/api/loyalty/customers/{id}/transactions',
            icon: 'history',
            order: 2,
            addedBy: '@loyalty',
          },
        ],
      }),
    );

    // 3. Extend Order entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'order',
        moduleCode: '@loyalty',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'pointsEarned',
            type: 'number',
            ui: {
              label: 'Punkty zdobyte',
              helpText: 'Liczba punktów zdobytych za to zamówienie',
              group: 'Lojalność',
              order: 1,
            },
            addedBy: '@loyalty',
          }),
          EntityDefinitionFactory.createField({
            name: 'pointsRedeemed',
            type: 'number',
            ui: {
              label: 'Punkty wykorzystane',
              helpText: 'Liczba punktów wykorzystanych w tym zamówieniu',
              group: 'Lojalność',
              order: 2,
            },
            addedBy: '@loyalty',
          }),
          EntityDefinitionFactory.createField({
            name: 'pointsRedemptionValue',
            type: 'number',
            ui: {
              label: 'Wartość punktów',
              helpText: 'Wartość rabatu z punktów',
              group: 'Lojalność',
              order: 3,
            },
            addedBy: '@loyalty',
          }),
          EntityDefinitionFactory.createField({
            name: 'discountCodeId',
            type: 'string',
            ui: {
              label: 'Kod rabatowy',
              widget: 'select',
              helpText: 'Użyty kod rabatowy',
              group: 'Rabaty',
              order: 1,
            },
            addedBy: '@loyalty',
          }),
          EntityDefinitionFactory.createField({
            name: 'discountCode',
            type: 'string',
            ui: {
              label: 'Kod',
              helpText: 'Użyty kod rabatowy (tekst)',
              group: 'Rabaty',
              order: 2,
            },
            addedBy: '@loyalty',
          }),
          EntityDefinitionFactory.createField({
            name: 'discountAmount',
            type: 'number',
            ui: {
              label: 'Wartość rabatu',
              helpText: 'Kwota rabatu z kodu',
              group: 'Rabaty',
              order: 3,
            },
            addedBy: '@loyalty',
          }),
        ],
      }),
    );

    // 4. Register LoyaltyProgram entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'loyalty_program',
        name: 'Program lojalnościowy',
        description: 'Konfiguracja programu lojalnościowego dla tenanta',
        ownerModule: '@loyalty',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'name',
            type: 'string',
            required: true,
            ui: { label: 'Nazwa programu' },
          }),
          EntityDefinitionFactory.createField({
            name: 'isActive',
            type: 'boolean',
            ui: { label: 'Aktywny' },
          }),
          EntityDefinitionFactory.createField({
            name: 'pointsPerPln',
            type: 'number',
            ui: { label: 'Punkty za 1 PLN' },
          }),
          EntityDefinitionFactory.createField({
            name: 'pointValue',
            type: 'number',
            ui: { label: 'Wartość punktu (PLN)' },
          }),
        ],
      }),
    );

    // 5. Register LoyaltyTier entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'loyalty_tier',
        name: 'Poziom lojalnościowy',
        description: 'Poziom w programie lojalnościowym (Bronze, Silver, Gold, Platinum)',
        ownerModule: '@loyalty',
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
            name: 'minPoints',
            type: 'number',
            required: true,
            ui: { label: 'Minimalna liczba punktów' },
          }),
          EntityDefinitionFactory.createField({
            name: 'discountPercent',
            type: 'number',
            ui: { label: 'Rabat %' },
          }),
          EntityDefinitionFactory.createField({
            name: 'pointsMultiplier',
            type: 'number',
            ui: { label: 'Mnożnik punktów' },
          }),
          EntityDefinitionFactory.createField({
            name: 'color',
            type: 'string',
            ui: { label: 'Kolor' },
          }),
        ],
      }),
    );

    // 6. Register DiscountCode entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'discount_code',
        name: 'Kod rabatowy',
        description: 'Kod promocyjny/rabatowy',
        ownerModule: '@loyalty',
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
              enum: ['PERCENT', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'FREE_PRODUCT', 'POINTS_BONUS'],
            },
            ui: { label: 'Typ' },
          }),
          EntityDefinitionFactory.createField({
            name: 'value',
            type: 'number',
            required: true,
            ui: { label: 'Wartość' },
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            validation: {
              enum: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'USED_UP'],
            },
            ui: { label: 'Status' },
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
        ],
      }),
    );

    // 7. Register PointsTransaction entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'points_transaction',
        name: 'Transakcja punktowa',
        description: 'Historia transakcji punktów lojalnościowych',
        ownerModule: '@loyalty',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'customerId',
            type: 'string',
            required: true,
            ui: { label: 'Klient' },
          }),
          EntityDefinitionFactory.createField({
            name: 'type',
            type: 'enum',
            required: true,
            validation: {
              enum: ['EARNED', 'REDEEMED', 'BONUS', 'ADJUSTMENT', 'EXPIRED', 'REFUND'],
            },
            ui: { label: 'Typ' },
          }),
          EntityDefinitionFactory.createField({
            name: 'points',
            type: 'number',
            required: true,
            ui: { label: 'Punkty' },
          }),
          EntityDefinitionFactory.createField({
            name: 'orderId',
            type: 'string',
            ui: { label: 'Zamówienie' },
          }),
          EntityDefinitionFactory.createField({
            name: 'description',
            type: 'string',
            ui: { label: 'Opis' },
          }),
        ],
      }),
    );

    console.log('[LoyaltyModule] Registered @loyalty module with 3 submodules');
  }
}
