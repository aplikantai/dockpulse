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
import { LocationService } from './services/location.service';
import { DocumentService } from './services/document.service';
import { ContainerService } from './services/container.service';
import { InventoryService } from './services/inventory.service';
import { WmsController } from './controllers/wms.controller';

/**
 * WmsModule - Warehouse Management System
 *
 * Full WMS functionality with submodules:
 * - WMS.LOCATIONS - Location hierarchy (warehouse-zone-rack-shelf-bin)
 * - WMS.BARCODE - Barcode scanning support
 * - WMS.DOCUMENTS - Warehouse documents (PZ, WZ, MM, INV)
 * - WMS.INVENTORY - Inventory counts
 * - WMS.CONTAINERS - Container/bin management
 *
 * Based on analysis of wms.ebukieteria.pl
 */
@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [WmsController],
  providers: [LocationService, DocumentService, ContainerService, InventoryService],
  exports: [LocationService, DocumentService, ContainerService, InventoryService],
})
export class WmsModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Register module in Module Registry with submodules
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@wms',
        name: 'Warehouse Management',
        description: 'Zaawansowane zarządzanie magazynem z lokalizacjami, dokumentami i inwentaryzacją',
        version: '1.0.0',
        category: ModuleCategory.INVENTORY,
        moduleClass: WmsModule,
        dependencies: ['@products', '@stock'],
        defaultEnabled: false,
        isCore: false,
        icon: 'warehouse',
        requiredPlan: TenantPlan.STARTER,
        features: [
          {
            code: 'WMS.LOCATIONS',
            name: 'Lokalizacje magazynowe',
            description: 'Hierarchia lokalizacji: magazyn → strefa → regał → półka → pozycja',
            defaultEnabled: true,
          },
          {
            code: 'WMS.BARCODE',
            name: 'Obsługa kodów kreskowych',
            description: 'Skanowanie kodów kreskowych dla lokalizacji, kontenerów i produktów',
            defaultEnabled: true,
          },
          {
            code: 'WMS.DOCUMENTS',
            name: 'Dokumenty magazynowe',
            description: 'Dokumenty: PZ (przyjęcie), WZ (wydanie), MM (przesunięcie), korekty',
            defaultEnabled: false,
          },
          {
            code: 'WMS.INVENTORY',
            name: 'Inwentaryzacja',
            description: 'Planowanie i przeprowadzanie inwentaryzacji z weryfikacją różnic',
            defaultEnabled: false,
          },
          {
            code: 'WMS.CONTAINERS',
            name: 'Zarządzanie kontenerami',
            description: 'Kuwety, palety i pojemniki z śledzeniem zawartości',
            defaultEnabled: false,
          },
        ],
        defaultConfig: {
          autoGenerateBarcode: true,
          requireBarcodeOnPick: false,
          defaultLocationType: 'BIN',
          documentNumberFormat: '{TYPE}/{YEAR}/{SEQ:4}',
        },
      }),
    );

    // 2. Extend Product entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'product',
        moduleCode: '@wms',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'barcode',
            type: 'string',
            ui: {
              label: 'Kod kreskowy',
              placeholder: 'EAN-13 lub dowolny kod',
              helpText: 'Kod kreskowy produktu do skanowania',
              group: 'WMS',
              order: 1,
            },
            addedBy: '@wms',
          }),
          EntityDefinitionFactory.createField({
            name: 'ean',
            type: 'string',
            ui: {
              label: 'EAN',
              placeholder: '5901234567890',
              helpText: 'Europejski numer artykułu',
              group: 'WMS',
              order: 2,
            },
            addedBy: '@wms',
          }),
          EntityDefinitionFactory.createField({
            name: 'warehouseLocationId',
            type: 'string',
            ui: {
              label: 'Domyślna lokalizacja',
              widget: 'select',
              helpText: 'Domyślna lokalizacja magazynowa produktu',
              group: 'WMS',
              order: 3,
            },
            addedBy: '@wms',
          }),
          EntityDefinitionFactory.createField({
            name: 'minStock',
            type: 'number',
            defaultValue: 0,
            ui: {
              label: 'Stan minimalny',
              placeholder: '0',
              helpText: 'Alert gdy stan spadnie poniżej',
              group: 'WMS',
              order: 4,
            },
            addedBy: '@wms',
          }),
          EntityDefinitionFactory.createField({
            name: 'maxStock',
            type: 'number',
            ui: {
              label: 'Stan maksymalny',
              placeholder: '100',
              helpText: 'Maksymalny zalecany stan magazynowy',
              group: 'WMS',
              order: 5,
            },
            addedBy: '@wms',
          }),
          EntityDefinitionFactory.createField({
            name: 'unitWeight',
            type: 'number',
            ui: {
              label: 'Waga jednostkowa (kg)',
              placeholder: '0.5',
              helpText: 'Waga pojedynczej sztuki w kg',
              group: 'WMS',
              order: 6,
            },
            addedBy: '@wms',
          }),
        ],
        relations: [
          EntityDefinitionFactory.createRelation({
            name: 'warehouseLocation',
            targetEntity: 'warehouse_location',
            type: 'many-to-one',
            addedBy: '@wms',
          }),
          EntityDefinitionFactory.createRelation({
            name: 'containerContents',
            targetEntity: 'container_content',
            type: 'one-to-many',
            addedBy: '@wms',
          }),
        ],
        hooks: {
          afterCreate: [
            {
              name: 'generate_barcode_if_empty',
              handler: async (context) => {
                const product = context.data;
                if (!product.barcode && !product.ean) {
                  console.log(`[WMS] Product ${product.id} created without barcode`);
                }
              },
              priority: 10,
              addedBy: '@wms',
            },
          ],
        },
        tabs: [
          {
            code: 'wms_stock',
            label: 'Lokalizacje',
            dataEndpoint: '/api/wms/products/{id}/locations',
            icon: 'map-pin',
            order: 1,
            addedBy: '@wms',
          },
          {
            code: 'wms_movements',
            label: 'Ruchy magazynowe',
            dataEndpoint: '/api/wms/products/{id}/movements',
            icon: 'activity',
            order: 2,
            addedBy: '@wms',
          },
        ],
      }),
    );

    // 3. Register WarehouseLocation entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'warehouse_location',
        name: 'Lokalizacja magazynowa',
        description: 'Lokalizacja w strukturze magazynu (magazyn/strefa/regał/półka/pozycja)',
        ownerModule: '@wms',
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
            ui: { label: 'Kod lokalizacji' },
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
              enum: ['WAREHOUSE', 'ZONE', 'RACK', 'SHELF', 'BIN'],
            },
            ui: { label: 'Typ lokalizacji' },
          }),
          EntityDefinitionFactory.createField({
            name: 'barcode',
            type: 'string',
            ui: { label: 'Kod kreskowy' },
          }),
          EntityDefinitionFactory.createField({
            name: 'parentId',
            type: 'string',
            ui: { label: 'Lokalizacja nadrzędna' },
          }),
        ],
      }),
    );

    // 4. Register WarehouseDocument entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'warehouse_document',
        name: 'Dokument magazynowy',
        description: 'Dokument magazynowy (PZ, WZ, MM, inwentaryzacja)',
        ownerModule: '@wms',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'documentNumber',
            type: 'string',
            required: true,
            ui: { label: 'Numer dokumentu' },
          }),
          EntityDefinitionFactory.createField({
            name: 'type',
            type: 'enum',
            required: true,
            validation: {
              enum: ['PZ', 'WZ', 'PW', 'RW', 'MM', 'INV', 'RETURN'],
            },
            ui: { label: 'Typ dokumentu' },
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            required: true,
            validation: {
              enum: ['DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            },
            ui: { label: 'Status' },
          }),
          EntityDefinitionFactory.createField({
            name: 'documentDate',
            type: 'datetime',
            required: true,
            ui: { label: 'Data dokumentu' },
          }),
        ],
      }),
    );

    // 5. Register Container entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'container',
        name: 'Kontener/Kuweta',
        description: 'Pojemnik magazynowy (kuweta, paleta, karton)',
        ownerModule: '@wms',
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
            ui: { label: 'Kod kontenera' },
          }),
          EntityDefinitionFactory.createField({
            name: 'barcode',
            type: 'string',
            ui: { label: 'Kod kreskowy' },
          }),
          EntityDefinitionFactory.createField({
            name: 'type',
            type: 'enum',
            required: true,
            validation: {
              enum: ['BOX', 'BIN', 'PALLET', 'TOTE', 'CRATE'],
            },
            ui: { label: 'Typ kontenera' },
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            required: true,
            validation: {
              enum: ['EMPTY', 'PARTIAL', 'FULL', 'IN_TRANSIT', 'RESERVED'],
            },
            ui: { label: 'Status' },
          }),
        ],
      }),
    );

    // 6. Register InventoryCount entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'inventory_count',
        name: 'Inwentaryzacja',
        description: 'Zliczanie stanów magazynowych',
        ownerModule: '@wms',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'countNumber',
            type: 'string',
            required: true,
            ui: { label: 'Numer inwentaryzacji' },
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            required: true,
            validation: {
              enum: ['DRAFT', 'IN_PROGRESS', 'REVIEW', 'APPROVED', 'CANCELLED'],
            },
            ui: { label: 'Status' },
          }),
          EntityDefinitionFactory.createField({
            name: 'totalVariance',
            type: 'number',
            ui: { label: 'Suma różnic' },
          }),
        ],
      }),
    );

    console.log('[WmsModule] Registered @wms module with 5 submodules');
  }
}
