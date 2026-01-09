# DockPulse - Architektura Systemu (Headless Data Bus)

## Spis treści

1. [Przegląd architektury](#przegląd-architektury)
2. [System szyny danych (DataBus)](#system-szyny-danych-databus)
3. [Rejestr modułów (ModuleRegistry)](#rejestr-modułów-moduleregistry)
4. [Mapa modułów - Co jest / Czego brakuje](#mapa-modułów)
5. [Graf zależności](#graf-zależności)
6. [Encje i rozszerzenia](#encje-i-rozszerzenia)

---

## Przegląd architektury

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DockPulse Platform                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CORE SERVICES                                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  DataBus   │  │  Module    │  │   Event     │  │   Prisma    │  │   │
│  │  │  Service   │←→│  Registry  │←→│   Bus       │←→│   Service   │  │   │
│  │  └────────────┘  └────────────┘  └─────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CORE MODULES (isCore: true)                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │@customers│  │ @orders  │  │@products │  │ @quotes  │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    OPTIONAL MODULES (toggleable)                     │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────────────┐  │   │
│  │  │ @stock │ │@calendar│ │@invoicing│ │  @wms   │ │  @production   │  │   │
│  │  └────────┘ └────────┘ └────────┘ └──────────┘ └────────────────┘  │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────────────┐  │   │
│  │  │@pricing│ │@loyalty │ │@webhooks│ │@branches│ │  @ai-branding  │  │   │
│  │  └────────┘ └────────┘ └────────┘ └──────────┘ └────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## System szyny danych (DataBus)

**Plik:** `apps/api/src/modules/data-bus/data-bus.service.ts`

DataBus to centralny serwis zarządzania encjami w architekturze Headless:

### Funkcje DataBus

| Funkcja | Opis |
|---------|------|
| `registerEntity()` | Rejestracja nowej encji (moduł może dodać własne encje) |
| `extend()` | Rozszerzenie istniejącej encji o nowe pola, relacje, hooki, akcje, zakładki |
| `getEntity()` | Pobranie definicji encji |
| `getAllEntities()` | Lista wszystkich encji |
| `getFields()` | Pobranie wszystkich pól encji (bazowych + rozszerzonych) |
| `executeHooks()` | Wykonanie hooków lifecycle (beforeCreate, afterCreate, etc.) |
| `executeAction()` | Wykonanie akcji niestandardowej |
| `getTabs()` | Pobranie zakładek UI dla encji |

### Core Entities (rejestrowane przez DataBus)

```typescript
// DataBus automatycznie rejestruje 4 encje bazowe:
- customer (Klient)
- order (Zamówienie)
- product (Produkt)
- quote (Oferta)
```

### Interfejs EntityExtension

```typescript
interface EntityExtension {
  targetEntity: string;          // np. 'product', 'order'
  moduleCode: string;            // np. '@wms', '@pricing'
  fields?: FieldDefinition[];    // Nowe pola
  relations?: RelationDefinition[]; // Nowe relacje
  hooks?: {                      // Hooki lifecycle
    beforeCreate?: EntityHook[];
    afterCreate?: EntityHook[];
    beforeUpdate?: EntityHook[];
    afterUpdate?: EntityHook[];
    beforeDelete?: EntityHook[];
    afterDelete?: EntityHook[];
  };
  actions?: EntityAction[];      // Akcje niestandardowe
  tabs?: EntityTab[];            // Zakładki w UI
}
```

---

## Rejestr modułów (ModuleRegistry)

**Plik:** `apps/api/src/modules/module-registry/module-registry.service.ts`

ModuleRegistry zarządza włączaniem/wyłączaniem modułów per-tenant:

### Funkcje ModuleRegistry

| Funkcja | Opis |
|---------|------|
| `register()` | Rejestracja modułu w systemie |
| `enableModule()` | Włączenie modułu dla tenanta |
| `disableModule()` | Wyłączenie modułu dla tenanta |
| `isModuleEnabled()` | Sprawdzenie czy moduł jest włączony |
| `getEnabledModules()` | Lista włączonych modułów tenanta |
| `initializeDefaultModules()` | Inicjalizacja domyślnych modułów dla nowego tenanta |

### Interfejs ModuleDefinition

```typescript
interface ModuleDefinition {
  code: string;                  // np. '@wms'
  name: string;                  // np. 'Warehouse Management'
  version: string;               // np. '1.0.0'
  category: ModuleCategory;      // CORE, INVENTORY, SALES, etc.
  dependencies?: string[];       // np. ['@products', '@stock']
  incompatibleWith?: string[];   // Moduły niekompatybilne
  defaultEnabled?: boolean;      // Domyślnie włączony?
  isCore?: boolean;              // Moduł core (nie można wyłączyć)
  requiredPlan?: TenantPlan;     // Wymagany plan (FREE, STARTER, etc.)
  features?: ModuleFeature[];    // Podmoduły/funkcje
  defaultConfig?: Record<string, any>;
}
```

### Kategorie modułów

```typescript
enum ModuleCategory {
  CORE = 'core',           // customers, orders, products, quotes
  INVENTORY = 'inventory', // stock, wms, production
  SALES = 'sales',         // pricing, invoicing, quotes
  SCHEDULING = 'scheduling', // calendar, appointments
  AUTOMATION = 'automation', // webhooks, workflows
  INTEGRATION = 'integration', // external APIs
  ANALYTICS = 'analytics', // reports, dashboards
  PLATFORM = 'platform',   // ai-branding, admin
  OTHER = 'other'
}
```

---

## Mapa modułów

### LEGENDA

| Symbol | Znaczenie |
|--------|-----------|
| ✅ | Zaimplementowane (moduł + serwisy + DTO + controller) |
| 🟡 | Częściowo (moduł istnieje, brak pełnej implementacji) |
| ❌ | Brak (do zrobienia) |
| 📁 | Folder istnieje |
| 🔗 | Zarejestrowane w app.module.ts |

---

### CORE MODULES (isCore: true)

| Moduł | Status | Folder | Zarejestrowany | Serwisy | Controller |
|-------|--------|--------|----------------|---------|------------|
| `@customers` | ✅ | 📁 `customers/` | 🔗 | ✅ CustomersService | ✅ |
| `@orders` | ✅ | 📁 `orders/` | 🔗 | ✅ OrdersService | ✅ |
| `@products` | ✅ | 📁 `products/` | 🔗 | ✅ ProductsService | ✅ |
| `@quotes` | ✅ | 📁 `quotes/` | 🔗 | ✅ QuotesService | ✅ |

---

### INVENTORY MODULES

| Moduł | Status | Folder | Zarejestrowany | Serwisy | Controller | Podmoduły |
|-------|--------|--------|----------------|---------|------------|-----------|
| `@stock` | ✅ | 📁 `stock/` | 🔗 | ✅ StockService | 🟡 | - |
| `@wms` | ✅ | 📁 `wms/` | 🔗 | ✅ LocationService, DocumentService, ContainerService, InventoryService | ✅ WmsController | WMS.LOCATIONS ✅, WMS.BARCODE ✅, WMS.DOCUMENTS ✅, WMS.INVENTORY ✅, WMS.CONTAINERS ✅ |
| `@production` | ✅ | 📁 `production/` | 🔗 | ✅ PlanningService, ConversionService, PreorderService | ✅ ProductionController | PRODUCTION.PLANNING ✅, PRODUCTION.CONVERSION ✅, PRODUCTION.PREORDER ✅, PRODUCTION.RECIPES 🟡 |

---

### SALES MODULES

| Moduł | Status | Folder | Zarejestrowany | Serwisy | Controller | Podmoduły |
|-------|--------|--------|----------------|---------|------------|-----------|
| `@pricing` | ✅ | 📁 `pricing/` | 🔗 | ✅ PriceTableService, SurchargeService, MarginCalculatorService, PriceResolverService | ✅ PricingController | PRICING.TABLES ✅, PRICING.DUAL ✅, PRICING.SURCHARGES ✅, PRICING.MARGINS ✅ |
| `@invoicing` | 🟡 | 📁 `invoicing/` | 🔗 | ✅ InvoicingService | 🟡 | - |
| `@loyalty` | ✅ | 📁 `loyalty/` | 🔗 | ✅ PointsService, DiscountCodeService, TierService | ✅ LoyaltyController | LOYALTY.POINTS ✅, LOYALTY.DISCOUNTS ✅, LOYALTY.TIERS ✅ |

---

### SCHEDULING MODULES

| Moduł | Status | Folder | Zarejestrowany | Serwisy | Controller | Podmoduły |
|-------|--------|--------|----------------|---------|------------|-----------|
| `@calendar` | 🟡 | 📁 `calendar/` | 🔗 | ✅ CalendarService | 🟡 | - |
| `@measurements` | 🟡 | 📁 `measurements/` | 🔗 | 🟡 | 🟡 | - |

---

### AUTOMATION MODULES

| Moduł | Status | Folder | Zarejestrowany | Serwisy |
|-------|--------|--------|----------------|---------|
| `@webhooks` | 🟡 | 📁 `webhooks/` | 🔗 | 🟡 |
| `@notifications` | 🟡 | 📁 `notifications/` | ❌ | 🟡 |

---

### PLATFORM MODULES

| Moduł | Status | Folder | Zarejestrowany | Serwisy | Controller |
|-------|--------|--------|----------------|---------|------------|
| `@ai-branding` | ✅ | 📁 `ai-branding/` | 🔗 | ✅ BrandExtractorService, TenantOnboardingService, WebScraperService, AiAnalyzerService | ✅ AiBrandingController |
| `@admin` | ✅ | 📁 `admin/` | 🔗 | ✅ | ✅ |
| `@portal` | ✅ | 📁 `portal/` | ❌ | ✅ PortalAuthService, PortalOrdersService, PortalQuotesService | ✅ PortalController |

---

### OTHER MODULES

| Moduł | Status | Folder | Zarejestrowany | Serwisy |
|-------|--------|--------|----------------|---------|
| `@branches` | 🟡 | 📁 `branches/` | 🔗 | 🟡 |
| `@locations` | 🟡 | 📁 `locations/` | 🔗 | 🟡 |
| `@dictionaries` | 🟡 | 📁 `dictionaries/` | 🔗 | 🟡 |

---

## Graf zależności

```
                    ┌──────────────────────────────────────────────┐
                    │              PLATFORM LAYER                   │
                    │  @ai-branding    @admin    @portal           │
                    └──────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                          │
        ┌───────────▼───────────┐              ┌──────────────▼──────────────┐
        │   INVENTORY LAYER     │              │      SALES LAYER            │
        │                       │              │                              │
        │  @wms ───────────┐    │              │  @pricing ──────────────┐   │
        │       │          │    │              │      │                  │   │
        │       ▼          │    │              │      ▼                  │   │
        │  @production ◄───┤    │              │  @loyalty              │   │
        │       │          │    │              │      │                  │   │
        │       ▼          │    │              │      ▼                  │   │
        │  @stock ◄────────┘    │              │  @invoicing ◄──────────┘   │
        │       │               │              │      │                      │
        └───────┼───────────────┘              └──────┼──────────────────────┘
                │                                      │
                └──────────────┬───────────────────────┘
                               │
        ┌──────────────────────▼──────────────────────┐
        │              CORE LAYER (isCore: true)       │
        │                                              │
        │   @products ◄──────── @orders               │
        │       ▲                   │                 │
        │       │                   ▼                 │
        │       └──────────── @customers              │
        │                          │                  │
        │                          ▼                  │
        │                     @quotes                 │
        │                                              │
        └──────────────────────────────────────────────┘
                               │
        ┌──────────────────────▼──────────────────────┐
        │              DATA LAYER                      │
        │                                              │
        │  ┌─────────────┐    ┌─────────────┐         │
        │  │  DataBus    │ ←→ │ ModuleReg   │         │
        │  └─────────────┘    └─────────────┘         │
        │         │                   │               │
        │         └────────┬──────────┘               │
        │                  ▼                          │
        │         ┌─────────────┐                     │
        │         │   Prisma    │                     │
        │         │  (PostgreSQL)│                    │
        │         └─────────────┘                     │
        │                                              │
        └──────────────────────────────────────────────┘
```

---

## Encje i rozszerzenia

### Jak moduły rozszerzają encje

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ENTITY: product                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ BASE FIELDS (DataBus core):                                                 │
│   id, sku, name, description, price, unit, category, stock, active          │
├─────────────────────────────────────────────────────────────────────────────┤
│ EXTENDED BY @wms:                                                           │
│   + barcode, ean, warehouseLocationId, minStock, maxStock, unitWeight       │
│   + TAB: "Lokalizacje" (/api/wms/products/{id}/locations)                   │
│   + TAB: "Ruchy magazynowe" (/api/wms/products/{id}/movements)              │
├─────────────────────────────────────────────────────────────────────────────┤
│ EXTENDED BY @production:                                                    │
│   + defaultUnit, productionUnit, productionLeadTime, avgWeightPerUnit       │
│   + isProducible                                                            │
│   + TAB: "Historia produkcji" (/api/production/products/{id}/history)       │
│   + TAB: "Konwersje jednostek" (/api/production/conversions?productId={id}) │
├─────────────────────────────────────────────────────────────────────────────┤
│ EXTENDED BY @pricing:                                                       │
│   + purchasePrice, targetMarginPercent, minSalePrice, priceCategoryId       │
│   + TAB: "Historia cen" (/api/pricing/resolve/history/{id})                 │
│   + TAB: "Analiza marży" (/api/pricing/margin/calculate?productId={id})     │
├─────────────────────────────────────────────────────────────────────────────┤
│ EXTENDED BY @stock:                                                         │
│   + stockQuantity, reorderLevel, reservedQuantity                           │
│   + TAB: "Ruchy stanów" (/api/stock/products/{id}/movements)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Tabela rozszerzeń encji

| Encja | Moduł | Dodane pola | Dodane zakładki |
|-------|-------|-------------|-----------------|
| **product** | @wms | barcode, ean, warehouseLocationId, minStock, maxStock, unitWeight | Lokalizacje, Ruchy magazynowe |
| **product** | @production | defaultUnit, productionUnit, productionLeadTime, avgWeightPerUnit, isProducible | Historia produkcji, Konwersje |
| **product** | @pricing | purchasePrice, targetMarginPercent, minSalePrice, priceCategoryId | Historia cen, Analiza marży |
| **product** | @stock | stockQuantity, reorderLevel, reservedQuantity | Ruchy stanów |
| **customer** | @pricing | priceTableId, priceCategoryCode, discountPercent, creditLimit, paymentTerms | - |
| **customer** | @loyalty | loyaltyProgramId, loyaltyTierId, currentPoints, lifetimePoints | Historia punktów |
| **order** | @production | productionPlanId, isPreorder, preorderSlotId, preorderSlotDate | - |
| **order** | @pricing | priceTableId, discountPercent, discountValue, surchargesTotal, marginPercent, marginValue | - |
| **order** | @loyalty | pointsEarned, pointsRedeemed, discountCodeId, discountAmount | - |

---

## Encje zarejestrowane przez moduły

### @wms

| Encja | Opis | Prisma Model |
|-------|------|--------------|
| warehouse_location | Lokalizacja magazynowa | WarehouseLocation ✅ |
| warehouse_document | Dokument magazynowy (PZ, WZ, MM) | WarehouseDocument ✅ |
| container | Kontener/Kuweta | Container ✅ |
| inventory_count | Inwentaryzacja | InventoryCount ✅ |

### @production

| Encja | Opis | Prisma Model |
|-------|------|--------------|
| production_plan | Plan produkcji | ProductionPlan ✅ |
| preorder_slot | Slot pre-orderu | PreorderSlot ✅ |
| unit_conversion | Konwersja jednostek | UnitConversion ✅ |
| production_recipe | Receptura | ProductionRecipe ✅ |

### @pricing

| Encja | Opis | Prisma Model |
|-------|------|--------------|
| price_category | Kategoria cenowa | PriceCategory ✅ |
| price_table | Cennik | PriceTable ✅ |
| surcharge | Dopłata | Surcharge ✅ |
| product_cost | Koszt produktu | ProductCost ✅ |

### @loyalty

| Encja | Opis | Prisma Model |
|-------|------|--------------|
| loyalty_program | Program lojalnościowy | LoyaltyProgram ✅ |
| loyalty_tier | Poziom lojalnościowy | LoyaltyTier ✅ |
| customer_loyalty | Lojalnośc klienta | CustomerLoyalty ✅ |
| points_transaction | Transakcja punktów | PointsTransaction ✅ |
| discount_code | Kod rabatowy | DiscountCode ✅ |

### @ai-branding

| Encja | Opis | Prisma Model |
|-------|------|--------------|
| ai_model_config | Konfiguracja AI | AiModelConfig ✅ |
| brand_extraction | Ekstrakcja brandingu | BrandExtraction ✅ |

---

## Co brakuje (do zrobienia)

### Priorytet WYSOKI

| Element | Status | Opis |
|---------|--------|------|
| @portal w app.module.ts | ❌ | Portal nie jest zarejestrowany w app.module.ts |
| @notifications w app.module.ts | ❌ | Powiadomienia nie są zarejestrowane |
| Controllery @stock, @calendar, @invoicing | 🟡 | Brak pełnych controllerów REST |

### Priorytet ŚREDNI

| Element | Status | Opis |
|---------|--------|------|
| PRODUCTION.RECIPES serwis | 🟡 | Tylko schemat, brak serwisu |
| @calendar-plus (Google Calendar) | ❌ | Brak integracji z Google Calendar |
| @audit moduł | ❌ | Historia zmian i raporty audytowe |

### Priorytet NISKI

| Element | Status | Opis |
|---------|--------|------|
| @reports moduł | 🟡 | Folder istnieje, nie zarejestrowany |
| Frontend components dla nowych modułów | ❌ | SubmoduleGate, formularze |

---

## Wzorzec implementacji modułu

Każdy nowy moduł powinien implementować pattern:

```typescript
@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [MyModuleController],
  providers: [MyService1, MyService2],
  exports: [MyService1, MyService2],
})
export class MyModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Rejestracja w ModuleRegistry
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@my-module',
        name: 'My Module',
        category: ModuleCategory.INVENTORY,
        dependencies: ['@products'],
        features: [
          { code: 'MY_MODULE.FEATURE1', name: 'Feature 1', defaultEnabled: true },
          { code: 'MY_MODULE.FEATURE2', name: 'Feature 2', defaultEnabled: false },
        ],
      }),
    );

    // 2. Rozszerzenie encji przez DataBus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'product',
        moduleCode: '@my-module',
        fields: [...],
        tabs: [...],
        hooks: {...},
      }),
    );

    // 3. Rejestracja własnych encji
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'my_entity',
        name: 'My Entity',
        ownerModule: '@my-module',
        baseFields: [...],
      }),
    );
  }
}
```

---

## Plany cenowe i moduły

| Plan | Moduły domyślnie włączone |
|------|---------------------------|
| FREE | @customers, @orders, @products, @quotes |
| STARTER | + @stock, @calendar, @wms, @production |
| PROFESSIONAL | + @pricing, @loyalty, @invoicing, @webhooks |
| ENTERPRISE | + @ai-branding, @audit, @branches, nieograniczone |

---

## Podsumowanie

DockPulse używa architektury **Headless Data Bus** gdzie:

1. **DataBus** - centralny punkt rejestracji i rozszerzania encji
2. **ModuleRegistry** - zarządzanie toggleowalnymi modułami per-tenant
3. **EventBus** - asynchroniczna komunikacja między modułami
4. **Prisma** - warstwa persystencji (PostgreSQL)

Moduły są **kompozycyjne** - każdy może:
- Rozszerzać istniejące encje o nowe pola
- Dodawać zakładki do UI
- Rejestrować hooki lifecycle
- Definiować własne encje
- Wystawiać własne endpointy API
