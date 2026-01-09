# DockPulse - Dokumentacja Modułów

> Kompletna dokumentacja wszystkich modułów platformy DockPulse

---

## Spis treści

1. [Architektura modułów](#architektura-modułów)
2. [Moduły Core](#moduły-core)
3. [Moduły Biznesowe](#moduły-biznesowe)
4. [Moduły Zaawansowane](#moduły-zaawansowane)
5. [Moduły AI](#moduły-ai)
6. [Rejestracja modułu](#rejestracja-modułu)

---

## Architektura modułów

### System ModuleRegistry

```
apps/api/src/modules/module-registry/
├── module-registry.module.ts
├── module-registry.service.ts
├── module-definition.factory.ts
├── constants/
│   ├── module-categories.ts
│   └── module-codes.ts
└── interfaces/
    └── module-definition.interface.ts
```

### Kategorie modułów

```typescript
export enum ModuleCategory {
  CORE = 'CORE',           // Podstawowe funkcje
  CRM = 'CRM',             // Zarządzanie klientami
  SALES = 'SALES',         // Sprzedaż i zamówienia
  INVENTORY = 'INVENTORY', // Magazyn i produkty
  FINANCE = 'FINANCE',     // Faktury i płatności
  OPERATIONS = 'OPERATIONS', // Produkcja, WMS
  MARKETING = 'MARKETING', // Loyalty, kampanie
  AI = 'AI',               // Funkcje AI
}
```

### Plany i dostępność

| Plan | Moduły |
|------|--------|
| **STARTER** | @customers, @products, @orders, @quotes |
| **PRO** | + @stock, @calendar, @invoicing, @notifications |
| **ENTERPRISE** | + @wms, @production, @pricing, @loyalty, @ai-branding |

---

## Moduły Core

### @auth - Autentykacja

**Lokalizacja**: `apps/api/src/modules/auth/`

**Funkcje**:
- JWT authentication (access + refresh tokens)
- Session management
- Password reset flow
- Multi-factor authentication (planned)

**Endpoints**:
```
POST /api/v1/auth/login          # Login
POST /api/v1/auth/logout         # Logout
POST /api/v1/auth/refresh        # Refresh token
POST /api/v1/auth/forgot-password # Reset hasła
POST /api/v1/auth/reset-password  # Nowe hasło
```

---

### @database - Baza danych

**Lokalizacja**: `apps/api/src/modules/database/`

**Funkcje**:
- PrismaService - wrapper na Prisma Client
- Multi-tenant connection management
- Transaction support
- Query logging (development)

**Użycie**:
```typescript
@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
    });
  }
}
```

---

### @tenant - Multi-tenancy

**Lokalizacja**: `apps/api/src/modules/tenant/`

**Funkcje**:
- Tenant resolution middleware
- Subdomain routing
- Tenant context injection
- Isolation validation

**Middleware**:
```typescript
// Automatycznie dostępne w req.tenant
@Get('customers')
findAll(@Req() req: Request) {
  const tenantId = req['tenant'].id;
  // ...
}
```

---

## Moduły Biznesowe

### @customers - Klienci

**Lokalizacja**: `apps/api/src/modules/customers/`

**Podmoduły**:
- `CUSTOMERS.BASIC` - Podstawowe dane klienta
- `CUSTOMERS.CONTACTS` - Kontakty i osoby
- `CUSTOMERS.ADDRESSES` - Adresy dostawy/faktury
- `CUSTOMERS.PORTAL` - Dostęp do portalu klienta
- `CUSTOMERS.HISTORY` - Historia interakcji

**Model**:
```prisma
model Customer {
  id          String   @id @default(uuid())
  tenantId    String
  phone       String   @unique
  email       String?
  name        String
  companyName String?
  nip         String?
  addresses   Json     @default("[]")
  tags        String[]
  metadata    Json     @default("{}")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Endpoints**:
```
GET    /api/v1/customers           # Lista klientów
GET    /api/v1/customers/:id       # Szczegóły klienta
POST   /api/v1/customers           # Nowy klient
PUT    /api/v1/customers/:id       # Aktualizacja
DELETE /api/v1/customers/:id       # Usunięcie
GET    /api/v1/customers/:id/orders # Zamówienia klienta
```

---

### @products - Produkty

**Lokalizacja**: `apps/api/src/modules/products/`

**Podmoduły**:
- `PRODUCTS.BASIC` - Podstawowe dane produktu
- `PRODUCTS.PRICING` - Ceny i rabaty
- `PRODUCTS.VARIANTS` - Warianty (rozmiar, kolor)
- `PRODUCTS.MEDIA` - Zdjęcia i pliki
- `PRODUCTS.CATEGORIES` - Kategorie i tagi

**Model**:
```prisma
model Product {
  id          String   @id @default(uuid())
  tenantId    String
  code        String   @unique
  name        String
  description String?
  category    String?
  price       Decimal  @db.Decimal(10, 2)
  unit        String   @default("szt")
  isActive    Boolean  @default(true)
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Endpoints**:
```
GET    /api/v1/products           # Lista produktów
GET    /api/v1/products/:id       # Szczegóły
POST   /api/v1/products           # Nowy produkt
PUT    /api/v1/products/:id       # Aktualizacja
DELETE /api/v1/products/:id       # Usunięcie
POST   /api/v1/products/import    # Import CSV
GET    /api/v1/products/export    # Eksport CSV
```

---

### @orders - Zamówienia

**Lokalizacja**: `apps/api/src/modules/orders/`

**Podmoduły**:
- `ORDERS.BASIC` - Podstawowe zamówienia
- `ORDERS.WORKFLOW` - Statusy i przepływy
- `ORDERS.DELIVERY` - Dostawa i śledzenie
- `ORDERS.PAYMENTS` - Płatności
- `ORDERS.PORTAL` - Zamówienia z portalu

**Statusy**:
```typescript
enum OrderStatus {
  DRAFT = 'DRAFT',
  NEW = 'NEW',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
```

**Events**:
```typescript
'order.created'      // Nowe zamówienie
'order.confirmed'    // Potwierdzone
'order.in_progress'  // W realizacji
'order.shipped'      // Wysłane
'order.delivered'    // Dostarczone
'order.cancelled'    // Anulowane
```

**Endpoints**:
```
GET    /api/v1/orders             # Lista zamówień
GET    /api/v1/orders/:id         # Szczegóły
POST   /api/v1/orders             # Nowe zamówienie
PUT    /api/v1/orders/:id         # Aktualizacja
POST   /api/v1/orders/:id/confirm # Potwierdź
POST   /api/v1/orders/:id/ship    # Wyślij
POST   /api/v1/orders/:id/cancel  # Anuluj
```

---

### @quotes - Wyceny/Oferty

**Lokalizacja**: `apps/api/src/modules/quotes/`

**Podmoduły**:
- `QUOTES.BASIC` - Podstawowe wyceny
- `QUOTES.PDF` - Generowanie PDF
- `QUOTES.EMAIL` - Wysyłka emailem
- `QUOTES.PORTAL` - Akceptacja w portalu
- `QUOTES.CONVERSION` - Konwersja na zamówienie

**Flow**:
```
DRAFT → SENT → ACCEPTED → ORDER_CREATED
                ↓
             REJECTED
```

**Endpoints**:
```
GET    /api/v1/quotes             # Lista wycen
GET    /api/v1/quotes/:id         # Szczegóły
POST   /api/v1/quotes             # Nowa wycena
PUT    /api/v1/quotes/:id         # Aktualizacja
POST   /api/v1/quotes/:id/send    # Wyślij do klienta
POST   /api/v1/quotes/:id/convert # Konwertuj na zamówienie
GET    /api/v1/quotes/:id/pdf     # Pobierz PDF
```

---

### @stock - Stany magazynowe

**Lokalizacja**: `apps/api/src/modules/stock/`

**Podmoduły**:
- `STOCK.BASIC` - Podstawowe stany
- `STOCK.RESERVATIONS` - Rezerwacje
- `STOCK.ALERTS` - Alerty niskiego stanu
- `STOCK.MOVEMENTS` - Historia ruchów

**Model**:
```prisma
model StockLevel {
  id          String   @id @default(uuid())
  tenantId    String
  productId   String
  quantity    Int      @default(0)
  reserved    Int      @default(0)
  available   Int      // computed: quantity - reserved
  minLevel    Int?
  maxLevel    Int?
  updatedAt   DateTime @updatedAt
}
```

**Events**:
```typescript
'stock.updated'    // Zmiana stanu
'stock.reserved'   // Rezerwacja
'stock.released'   // Zwolnienie rezerwacji
'stock.low'        // Niski stan (alert)
```

---

### @invoicing - Faktury

**Lokalizacja**: `apps/api/src/modules/invoicing/`

**Podmoduły**:
- `INVOICING.BASIC` - Podstawowe faktury
- `INVOICING.PDF` - Generowanie PDF
- `INVOICING.EMAIL` - Wysyłka emailem
- `INVOICING.NUMBERING` - Numeracja
- `INVOICING.CORRECTIONS` - Korekty

**Endpoints**:
```
GET    /api/v1/invoices           # Lista faktur
GET    /api/v1/invoices/:id       # Szczegóły
POST   /api/v1/invoices           # Nowa faktura
POST   /api/v1/invoices/from-order/:orderId  # Z zamówienia
GET    /api/v1/invoices/:id/pdf   # Pobierz PDF
POST   /api/v1/invoices/:id/send  # Wyślij emailem
```

---

### @calendar - Kalendarz

**Lokalizacja**: `apps/api/src/modules/calendar/`

**Podmoduły**:
- `CALENDAR.EVENTS` - Wydarzenia
- `CALENDAR.TASKS` - Zadania
- `CALENDAR.REMINDERS` - Przypomnienia
- `CALENDAR.RESOURCES` - Zasoby (w @calendar-plus)

**Model**:
```prisma
model CalendarEvent {
  id          String    @id @default(uuid())
  tenantId    String
  title       String
  description String?
  type        String    // 'event' | 'task' | 'reminder'
  startAt     DateTime
  endAt       DateTime?
  allDay      Boolean   @default(false)
  customerId  String?
  orderId     String?
  userId      String?
  status      String    @default("scheduled")
  metadata    Json      @default("{}")
}
```

---

### @portal - Portal klienta

**Lokalizacja**: `apps/api/src/modules/portal/`

**Podmoduły**:
- `PORTAL.AUTH` - Logowanie klienta
- `PORTAL.ORDERS` - Składanie zamówień
- `PORTAL.QUOTES` - Przeglądanie ofert
- `PORTAL.HISTORY` - Historia
- `PORTAL.PROFILE` - Profil klienta

**Auth Flow**:
```
1. Klient loguje się telefonem + hasłem
2. Jeśli pierwszy login → wymuszenie zmiany hasła
3. JWT token z type: 'portal'
4. Dostęp tylko do swoich danych
```

**Endpoints**:
```
POST   /api/v1/portal/auth/login       # Login
POST   /api/v1/portal/auth/change-password
GET    /api/v1/portal/profile          # Profil
PUT    /api/v1/portal/profile          # Aktualizacja profilu
GET    /api/v1/portal/orders           # Moje zamówienia
POST   /api/v1/portal/orders           # Nowe zamówienie
GET    /api/v1/portal/quotes           # Moje oferty
POST   /api/v1/portal/quotes/:id/accept # Akceptuj ofertę
```

---

## Moduły Zaawansowane

### @wms - Warehouse Management

**Lokalizacja**: `apps/api/src/modules/wms/`

**Status**: W toku

**Podmoduły**:
- `WMS.LOCATIONS` - Lokalizacje (WH-RACK-SHELF-LEVEL)
- `WMS.BARCODE` - Skanowanie kodów
- `WMS.DOCUMENTS` - Dokumenty: PZ, WZ, MM, INV_ADJ
- `WMS.INVENTORY` - Inwentaryzacja
- `WMS.CONTAINERS` - Kontenery/Kuwety

**Modele**:
```prisma
model WarehouseLocation {
  id          String   @id @default(uuid())
  tenantId    String
  code        String   // WH01-A-01-1
  name        String
  type        String   // warehouse | rack | shelf | level
  parentId    String?
  barcode     String?
  isActive    Boolean  @default(true)
}

model WarehouseDocument {
  id              String   @id @default(uuid())
  tenantId        String
  documentNumber  String   // PZ/2024/001
  type            String   // PZ | WZ | MM | INV_ADJ
  status          String   // draft | confirmed | cancelled
  sourceLocationId String?
  targetLocationId String?
  items           Json     @default("[]")
}
```

---

### @production - Planowanie produkcji

**Lokalizacja**: `apps/api/src/modules/production/`

**Status**: W toku

**Podmoduły**:
- `PRODUCTION.PLANNING` - Agregacja zamówień na dzień
- `PRODUCTION.CONVERSION` - Konwersja jednostek (kg ↔ szt)
- `PRODUCTION.PREORDER` - Kalendarz pre-orderów (60 dni)

**Modele**:
```prisma
model ProductionPlan {
  id          String   @id @default(uuid())
  tenantId    String
  planDate    DateTime
  status      String   // draft | confirmed | completed
  totalWeight Decimal?
  items       ProductionPlanItem[]
}

model UnitConversion {
  id             String   @id @default(uuid())
  tenantId       String
  productId      String
  fromUnit       String   // kg
  toUnit         String   // szt
  conversionRate Decimal  // 1 kg = 10 szt
}
```

---

### @pricing - Cenniki

**Lokalizacja**: `apps/api/src/modules/pricing/`

**Status**: W toku

**Podmoduły**:
- `PRICING.TABLES` - Wielopoziomowe cenniki
- `PRICING.DUAL` - Dual pricing (zakup/sprzedaż)
- `PRICING.SURCHARGES` - Dopłaty (FIXED, PERCENT, PER_M2)
- `PRICING.MARGINS` - Kalkulacja marży

**Modele**:
```prisma
model PriceTable {
  id        String    @id @default(uuid())
  tenantId  String
  code      String    // RETAIL | WHOLESALE | VIP
  name      String
  validFrom DateTime?
  validTo   DateTime?
  currency  String    @default("PLN")
  entries   PriceTableEntry[]
}

model Surcharge {
  id      String @id @default(uuid())
  tenantId String
  code    String  // URGENT | OVERSIZED | HOLIDAY
  name    String
  type    String  // FIXED | PERCENT | PER_M2 | PER_MB
  value   Decimal
}
```

---

### @loyalty - Program lojalnościowy

**Lokalizacja**: `apps/api/src/modules/loyalty/`

**Status**: W toku

**Podmoduły**:
- `LOYALTY.POINTS` - System punktów
- `LOYALTY.DISCOUNTS` - Kody rabatowe
- `LOYALTY.TIERS` - Poziomy (Bronze, Silver, Gold)

**Modele**:
```prisma
model LoyaltyProgram {
  id           String  @id @default(uuid())
  tenantId     String  @unique
  isActive     Boolean @default(true)
  pointsPerPln Int     @default(1)  // 1 PLN = 1 punkt
  pointValue   Decimal @default(0.01) // 1 punkt = 0.01 PLN
}

model CustomerLoyalty {
  id             String @id @default(uuid())
  tenantId       String
  customerId     String
  currentPoints  Int    @default(0)
  lifetimePoints Int    @default(0)
  tierId         String?
}

model LoyaltyTier {
  id              String  @id @default(uuid())
  tenantId        String
  name            String  // Bronze | Silver | Gold | Platinum
  minPoints       Int     // Minimum punktów do osiągnięcia
  discountPercent Decimal // Rabat na zamówienia
  color           String  // #CD7F32 | #C0C0C0 | #FFD700
}
```

---

## Moduły AI

### @ai-branding - OMENROUTER

**Lokalizacja**: `apps/api/src/modules/ai-branding/`

**Status**: Gotowy

**Serwisy**:
- `WebScraperService` - Pobieranie HTML stron
- `AiAnalyzerService` - Analiza LLM (OpenRouter)
- `BrandExtractorService` - Ekstrakcja brandingu
- `TenantOnboardingService` - Self-service onboarding

**Podmoduły**:
- `AI_BRANDING.EXTRACT` - Ekstrakcja brandingu z URL
- `AI_BRANDING.ONBOARD` - Self-service tenant creation
- `AI_BRANDING.REBRAND` - Re-branding istniejącego tenanta

**Flow**:
```
URL → Web Scraping → LLM Analysis → Brand Extraction
                                         ↓
                              Vision AI (kolory z logo)
                                         ↓
                              Tenant Creation + Modules
```

**Endpoints**:
```
POST /api/v1/ai-branding/analyze           # Ekstrakcja brandingu
POST /api/v1/ai-branding/validate-subdomain # Walidacja subdomeny
POST /api/v1/ai-branding/onboard           # Self-service onboarding
POST /api/v1/ai-branding/tenants/:id/rebrand # Re-branding
GET  /api/v1/ai-branding/providers         # Dostępni providerzy AI
GET  /api/v1/ai-branding/config            # Konfiguracja AI
POST /api/v1/ai-branding/config/test-provider # Test providera
```

**AI Providers**:
```typescript
export enum AiProviderEnum {
  OPENROUTER = 'openrouter',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
}

// Domyślne modele
const AI_MODELS = {
  text: 'meta-llama/llama-3.2-3b-instruct:free',
  vision: 'google/gemini-2.0-flash-exp:free',
};
```

---

## Rejestracja modułu

### Wzorzec implementacji

Każdy moduł musi implementować `OnModuleInit` i rejestrować się w ModuleRegistry:

```typescript
// wms.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import { DataBusService } from '../data-bus/data-bus.service';
import { ModuleDefinitionFactory } from '../module-registry/module-definition.factory';
import { ModuleCategory, TenantPlan } from '../module-registry/constants';

@Module({
  imports: [PrismaModule],
  providers: [WmsService, LocationService, DocumentService],
  controllers: [WmsController],
  exports: [WmsService],
})
export class WmsModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Rejestracja modułu
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@wms',
        name: 'Warehouse Management',
        description: 'Zaawansowane zarządzanie magazynem',
        category: ModuleCategory.OPERATIONS,
        features: [
          { code: 'WMS.LOCATIONS', name: 'Lokalizacje', defaultEnabled: true },
          { code: 'WMS.BARCODE', name: 'Kody kreskowe', defaultEnabled: true },
          { code: 'WMS.DOCUMENTS', name: 'Dokumenty MM/PZ/WZ', defaultEnabled: false },
          { code: 'WMS.INVENTORY', name: 'Inwentaryzacja', defaultEnabled: false },
          { code: 'WMS.CONTAINERS', name: 'Kontenery', defaultEnabled: false },
        ],
        dependencies: ['@products', '@stock'],
        requiredPlan: TenantPlan.ENTERPRISE,
      }),
    );

    // 2. Rozszerzenie encji przez DataBus
    this.dataBus.extend({
      targetEntity: 'product',
      moduleCode: '@wms',
      fields: [
        { name: 'barcode', type: 'string', label: 'Kod kreskowy' },
        { name: 'warehouseLocationId', type: 'string', label: 'Lokalizacja' },
        { name: 'minStock', type: 'number', label: 'Min. stan' },
        { name: 'maxStock', type: 'number', label: 'Max. stan' },
      ],
    });

    // 3. Nasłuchiwanie eventów
    this.dataBus.on('order.confirmed', async (event) => {
      // Automatyczna rezerwacja w lokalizacji
      await this.reserveInLocation(event.payload);
    });
  }
}
```

### Frontend - SubmoduleGate

```tsx
// Komponent warunkowego renderowania dla podmodułów
import { SubmoduleGate } from '@/components/gates/SubmoduleGate';

function WarehousePage() {
  return (
    <div>
      <h1>Magazyn</h1>

      {/* Zawsze widoczne */}
      <LocationsList />

      {/* Tylko jeśli WMS.DOCUMENTS jest włączony */}
      <SubmoduleGate
        require="WMS.DOCUMENTS"
        fallback={<UpgradePrompt feature="Dokumenty magazynowe" />}
      >
        <DocumentsSection />
      </SubmoduleGate>

      {/* Tylko dla planu ENTERPRISE */}
      <SubmoduleGate require="WMS.INVENTORY">
        <InventorySection />
      </SubmoduleGate>
    </div>
  );
}
```

---

## Eventy modułów

### Lista wszystkich eventów

```typescript
// Core
'entity.created'
'entity.updated'
'entity.deleted'

// @customers
'customer.created'
'customer.updated'
'customer.portal_login'

// @orders
'order.created'
'order.confirmed'
'order.in_progress'
'order.shipped'
'order.delivered'
'order.cancelled'

// @quotes
'quote.created'
'quote.sent'
'quote.accepted'
'quote.rejected'
'quote.converted'

// @stock
'stock.updated'
'stock.reserved'
'stock.released'
'stock.low'

// @invoicing
'invoice.created'
'invoice.sent'
'invoice.paid'

// @portal
'portal.login'
'portal.order_placed'
'portal.quote_accepted'

// @wms
'wms.document.created'
'wms.document.confirmed'
'wms.inventory.completed'

// @production
'production.plan.created'
'production.plan.confirmed'
'production.item.completed'

// @pricing
'pricing.table.updated'
'pricing.surcharge.applied'

// @loyalty
'loyalty.points.earned'
'loyalty.points.redeemed'
'loyalty.tier.upgraded'

// @ai-branding
'ai_branding.extraction.started'
'ai_branding.extraction.completed'
'ai_branding.extraction.failed'
'ai_branding.tenant.onboarded'
```

---

**Wersja**: 1.0
**Data**: Styczeń 2025
