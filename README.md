# DockPulse 2.0

**Modularna platforma CRM/WMS typu multi-tenant z AI Branding**

[![NestJS](https://img.shields.io/badge/NestJS-10.3-e0234e)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748)](https://www.prisma.io/)

---

## Spis treści

1. [Architektura](#1-architektura)
2. [Wszystkie moduły (33)](#2-wszystkie-moduły-33)
3. [System Multi-Tenant](#3-system-multi-tenant)
4. [AI Branding (OMENROUTER)](#4-ai-branding-omenrouter)
5. [Data Bus - Łączenie modułów](#5-data-bus---łączenie-modułów)
6. [Tworzenie nowego tenanta](#6-tworzenie-nowego-tenanta)
7. [Baza danych](#7-baza-danych)
8. [Uruchomienie lokalne](#8-uruchomienie-lokalne)

---

## 1. Architektura

```
dockpulse/
├── apps/
│   ├── api/          # NestJS Backend (port 4000)
│   ├── web/          # Next.js Frontend klienta (port 3000)
│   └── admin/        # Panel administracyjny (port 3001)
├── packages/
│   ├── database/     # Prisma schema + migracje
│   └── shared/       # Współdzielone typy TypeScript
├── docs/             # Dokumentacja
├── landing/          # Landing page
└── docker/           # Docker configs
```

### Stack technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Backend | NestJS 10, TypeScript, Prisma ORM |
| Frontend | Next.js 14, React, TailwindCSS |
| Baza danych | PostgreSQL 15 |
| Cache | Redis (opcjonalnie) |
| AI | OpenRouter (Ollama/Groq/OpenAI/Anthropic) |
| Storage | S3 (MinIO lokalnie, Cloudflare R2 prod) |
| Monorepo | Turborepo + pnpm |

---

## 2. Wszystkie moduły (33)

### Moduły Core (fundamentalne)

| Moduł | Kod | Opis |
|-------|-----|------|
| **Auth** | `@auth` | JWT authentication, role-based access control |
| **Users** | `@users` | Zarządzanie użytkownikami tenanta |
| **Customers** | `@customers` | Baza klientów z pełnym CRM |
| **Orders** | `@orders` | Zamówienia z workflow |
| **Products** | `@products` | Katalog produktów |
| **Quotes** | `@quotes` | Oferty i wyceny |

### Moduły Rozszerzone (biznesowe)

| Moduł | Kod | Opis | Źródło inspiracji |
|-------|-----|------|-------------------|
| **WMS** | `@wms` | Warehouse Management System | wms.ebukieteria.pl |
| **Stock** | `@stock` | Stany magazynowe, reorder alerts | - |
| **Production** | `@production` | Plany produkcji, receptury | wedlinyodkaroliny.pl |
| **Pricing** | `@pricing` | Cenniki, marże, surcharge'y | tapparella, inconcept |
| **Loyalty** | `@loyalty` | Program lojalnościowy, punkty | ebukieteria |
| **Branches** | `@branches` | Multi-branch (oddziały) | tapparella |
| **Locations** | `@locations` | Punkty odbioru | ebukieteria, wedliny |
| **Measurements** | `@measurements` | Pomiary na miejscu | tapparella |
| **Calendar** | `@calendar` | Kalendarz dostaw/wizyt | - |
| **Invoicing** | `@invoicing` | Faktury | - |
| **Dictionaries** | `@dictionaries` | Słowniki systemowe | - |

### Moduły Systemowe

| Moduł | Kod | Opis |
|-------|-----|------|
| **AI Branding** | `@ai-branding` | AI ekstrakcja brandingu (OMENROUTER) |
| **Data Bus** | `@data-bus` | Magistrala danych, rozszerzenia encji |
| **Module Registry** | `@module-registry` | Rejestr modułów z zależnościami |
| **Events** | `@events` | Event bus (EventEmitter2) |
| **Notifications** | `@notifications` | Email/SMS/Push |
| **Webhooks** | `@webhooks` | Outbound webhooks |
| **Portal** | `@portal` | Portal klienta z tokenowym dostępem |
| **Platform** | `@platform` | Admin platformy (super-admin) |
| **Tenant** | `@tenant` | Middleware multi-tenant |
| **Settings** | `@settings` | Ustawienia tenanta |
| **Reports** | `@reports` | Raporty i eksporty |
| **Admin** | `@admin` | Panel admina tenanta |
| **Storage** | `@storage` | Przechowywanie plików (S3) |
| **Cache** | `@cache` | Redis cache |
| **Database** | `@database` | Prisma service |
| **Health** | `@health` | Health checks |

### Szczegóły modułu WMS

```
@wms - Warehouse Management System
├── WMS.LOCATIONS    - Hierarchia: magazyn → strefa → regał → półka → pozycja
├── WMS.BARCODE      - Skanowanie kodów kreskowych
├── WMS.DOCUMENTS    - Dokumenty: PZ (przyjęcie), WZ (wydanie), MM (przesunięcie)
├── WMS.INVENTORY    - Inwentaryzacja z weryfikacją różnic
└── WMS.CONTAINERS   - Kuwety, palety, pojemniki
```

Typy lokalizacji: `WAREHOUSE | ZONE | RACK | SHELF | BIN`

Typy dokumentów: `PZ | WZ | PW | RW | MM | INV | RETURN`

### Szczegóły modułu Loyalty

```
@loyalty - Program Lojalnościowy
├── LOYALTY.PROGRAMS     - Definicje programów
├── LOYALTY.TIERS        - Poziomy (Bronze, Silver, Gold, Platinum)
├── LOYALTY.POINTS       - Naliczanie i wymiana punktów
├── LOYALTY.DISCOUNTS    - Kody rabatowe (%, kwota, darmowa dostawa)
└── LOYALTY.BIRTHDAY     - Automatyczne kupony urodzinowe
```

Typy transakcji punktowych: `EARNED | REDEEMED | BONUS | ADJUSTMENT | EXPIRED`

---

## 3. System Multi-Tenant

### Jak działa routing tenanta

```
Request → TenantMiddleware → Ekstrakcja tenant slug → Wstrzyknięcie req.tenant
```

**Źródła identyfikacji tenanta (priorytet):**

1. **Header**: `x-tenant-id: moja-firma`
2. **Subdomena**: `moja-firma.dockpulse.com`
3. **Query param**: `?tenant=moja-firma`

### Plany i limity

| Plan | Users | Customers | Products | Moduły |
|------|-------|-----------|----------|--------|
| **FREE** | 2 | 100 | 50 | customers, products, orders |
| **STARTER** | 5 | 500 | 200 | + quotes, reports |
| **BUSINESS** | 20 | 2,000 | 1,000 | + inventory, notifications |
| **ENTERPRISE** | ∞ | ∞ | ∞ | Wszystkie moduły |

### Izolacja danych

Każda tabela ma kolumnę `tenantId` która zapewnia izolację:

```sql
SELECT * FROM customers WHERE tenant_id = 'abc-123';
```

Prisma middleware automatycznie filtruje dane po tenant_id.

### Role użytkowników

```typescript
enum UserRole {
  OWNER           // Właściciel tenanta - pełny dostęp
  ADMIN           // Administrator - zarządzanie użytkownikami
  MANAGER         // Manager - dostęp do raportów
  EMPLOYEE        // Pracownik - podstawowy dostęp
  VIEWER          // Tylko podgląd
  PLATFORM_ADMIN  // Super-admin platformy
}
```

---

## 4. AI Branding (OMENROUTER)

### Jak działa ekstrakcja brandingu

```
1. Input: URL strony firmy (np. https://mojafirma.pl)
                    ↓
2. WebScraperService pobiera:
   - Meta tagi (og:title, og:description, og:image)
   - Favicon
   - Apple touch icon
                    ↓
3. AiAnalyzerService analizuje:
   - Nazwa firmy
   - Opis działalności
   - Branża/kategoria
   - Kolory brandingu (primary, secondary)
   - Logo URL
                    ↓
4. BrandExtraction zapisywany w bazie
                    ↓
5. Tenant.branding aktualizowany z wynikami
```

### Wspierani providerzy AI

| Provider | Typ | Koszt | Użycie |
|----------|-----|-------|--------|
| **OLLAMA** | Lokalny | Darmowy | Development |
| **GROQ** | Cloud | Darmowy tier | Produkcja (szybki) |
| **OPENAI** | Cloud | Płatny | Produkcja (dokładny) |
| **ANTHROPIC** | Cloud | Płatny | Produkcja (kreatywny) |
| **MISTRAL** | Cloud | Darmowy tier | Alternatywa |

### Endpoint API

```http
POST /api/ai-branding/analyze
Content-Type: application/json

{
  "url": "https://mojafirma.pl",
  "provider": "GROQ",
  "skipAi": false
}
```

**Odpowiedź:**

```json
{
  "id": "extraction-uuid",
  "status": "COMPLETED",
  "companyName": "Moja Firma Sp. z o.o.",
  "logoUrl": "https://mojafirma.pl/logo.png",
  "primaryColor": "#2563eb",
  "secondaryColor": "#1e40af",
  "description": "Firma zajmująca się...",
  "industry": "E-commerce",
  "confidence": 0.92
}
```

### Konfiguracja

```env
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## 5. Data Bus - Łączenie modułów

### Architektura

```
┌─────────────────────────────────────────────────────────┐
│                    DataBusService                        │
├─────────────────────────────────────────────────────────┤
│  registerEntity()   - Rejestracja encji core            │
│  extend()           - Rozszerzanie encji przez moduły   │
│  getFields()        - Pobierz wszystkie pola encji      │
│  executeHooks()     - Lifecycle hooks                   │
│  executeAction()    - Custom actions                    │
│  getTabs()          - UI tabs dla encji                 │
└─────────────────────────────────────────────────────────┘
```

### Jak moduł rozszerza encję

```typescript
// W StockModule.onModuleInit():
this.dataBus.extend({
  targetEntity: 'product',
  moduleCode: '@stock',
  fields: [
    { name: 'stockQuantity', type: 'number', required: true },
    { name: 'reorderLevel', type: 'number' },
    { name: 'warehouseLocation', type: 'string' },
  ],
  tabs: [{
    code: 'stock_movements',
    label: 'Ruchy magazynowe',
    dataEndpoint: '/api/stock/movements',
    icon: 'warehouse',
  }],
  hooks: {
    afterCreate: [
      {
        name: 'init_stock',
        handler: async (ctx) => { /* ... */ },
        priority: 100
      }
    ],
  },
});
```

### Flow komunikacji między modułami

```
User Action (np. utworzenie zamówienia)
          ↓
OrdersController.create()
          ↓
OrdersService.create() - zapis do DB
          ↓
DataBus.executeHooks('afterCreate', { entity: 'order', data: order })
          ↓
EventBus.emit('order.created', order)
          ↓
┌─────────────────────────────────────┐
│ Słuchacze (subskrybenci):           │
│ - @stock: rezerwacja produktów      │
│ - @notifications: email do klienta  │
│ - @invoicing: tworzenie faktury     │
│ - @loyalty: naliczenie punktów      │
└─────────────────────────────────────┘
```

### Lifecycle Hooks

| Hook | Kiedy | Przykład użycia |
|------|-------|-----------------|
| `beforeCreate` | Przed zapisem | Walidacja, generowanie kodu |
| `afterCreate` | Po zapisie | Wysłanie maila, inicjalizacja |
| `beforeUpdate` | Przed update | Logowanie zmian |
| `afterUpdate` | Po update | Sync z zewnętrznym systemem |
| `beforeDelete` | Przed usunięciem | Sprawdzenie zależności |
| `afterDelete` | Po usunięciu | Cleanup, archiwizacja |

---

## 6. Tworzenie nowego tenanta

### Przez API (programowo)

```http
POST /platform/tenants/register
Content-Type: application/json

{
  "name": "Moja Firma",
  "slug": "moja-firma",
  "ownerEmail": "owner@mojafirma.pl",
  "ownerPassword": "SecurePass123!",
  "plan": "STARTER",
  "websiteUrl": "https://mojafirma.pl"
}
```

### Co się dzieje krok po kroku

```
1. Walidacja
   ├── Sprawdzenie unikalności slug
   ├── Walidacja formatu (lowercase, bez spacji, tylko a-z0-9-)
   └── Walidacja email owner'a

2. Tworzenie Tenant
   ├── INSERT INTO tenants (id, slug, name, plan, status)
   └── status = 'active'

3. Przydzielenie modułów
   ├── Pobranie listy modułów dla planu
   ├── INSERT INTO tenant_modules dla każdego modułu
   └── Domyślna konfiguracja każdego modułu

4. Tworzenie Owner User
   ├── Hash hasła (bcrypt, 10 rounds)
   ├── INSERT INTO users (email, password, role='OWNER', tenantId)
   └── Automatyczne uprawnienia do wszystkich modułów

5. AI Branding (opcjonalnie)
   ├── Jeśli podano websiteUrl
   ├── Wywołanie BrandExtractorService.extractBrand(url)
   └── UPDATE tenants SET branding = {...}

6. Event: tenant.created
   └── Możliwość reakcji innych systemów
```

### Struktura danych nowego tenanta w bazie

```sql
-- Tenant
INSERT INTO tenants (id, slug, name, plan, status, created_at)
VALUES ('uuid', 'moja-firma', 'Moja Firma', 'STARTER', 'active', NOW());

-- Moduły tenanta
INSERT INTO tenant_modules (id, tenant_id, module_code, is_enabled, config)
VALUES
  ('uuid1', 'tenant-uuid', '@customers', true, '{}'),
  ('uuid2', 'tenant-uuid', '@products', true, '{}'),
  ('uuid3', 'tenant-uuid', '@orders', true, '{}'),
  ('uuid4', 'tenant-uuid', '@quotes', true, '{}'),
  ('uuid5', 'tenant-uuid', '@reports', true, '{}');

-- Owner User
INSERT INTO users (id, tenant_id, email, password_hash, role, status)
VALUES ('uuid', 'tenant-uuid', 'owner@example.com', '$2b$10$...', 'OWNER', 'active');
```

---

## 7. Baza danych

### Schemat (główne grupy tabel - 60+)

```
Tenant & Users (13 tabel)
├── tenants
├── tenant_modules
├── tenant_submodules
├── users
├── user_module_permissions
├── user_branches
├── role_definitions
├── password_reset_tokens
└── audit_logs

Core Business (12 tabel)
├── customers
├── orders, order_items, order_surcharges
├── quotes, quote_items, quote_responses
├── products
├── field_configs
└── workflow_triggers, workflow_executions, event_logs

Pricing (10 tabel)
├── module_prices, submodule_prices
├── price_categories, price_tables, price_table_entries
├── surcharges, product_costs, customer_pricing
└── unit_conversions

WMS (8 tabel)
├── warehouse_locations
├── warehouse_documents, warehouse_document_items
├── inventory_counts, inventory_count_items
└── containers, container_contents

Production (4 tabele)
├── production_plans, production_plan_items
└── production_recipes, production_recipe_ingredients

Loyalty (6 tabel)
├── loyalty_programs, loyalty_tiers, customer_loyalty
├── points_transactions
└── discount_codes, discount_code_usages

AI & Branding (4 tabele)
├── ai_model_configs
├── brand_extractions
└── portal_access_tokens, customer_portal_sessions
```

### Komendy Prisma

```bash
# Generowanie klienta
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Migracja (development)
pnpm db:migrate

# Migracja (produkcja)
pnpm db:migrate:deploy

# Prisma Studio (GUI)
pnpm db:studio

# Reset bazy
npx prisma migrate reset

# Seed danych
pnpm db:seed
```

---

## 8. Uruchomienie lokalne

### Wymagania

- Node.js 20+
- PostgreSQL 15+
- pnpm 8+
- Redis (opcjonalnie)

### Instalacja

```bash
# 1. Klonowanie
git clone https://github.com/gacabartosz/dockpulse.git
cd dockpulse

# 2. Instalacja zależności
pnpm install

# 3. Konfiguracja środowiska
cp .env.example .env
# Edytuj .env - ustaw DATABASE_URL

# 4. Tworzenie bazy
createdb dockpulse_platform

# 5. Migracje
pnpm db:migrate

# 6. Generowanie Prisma Client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# 7. Seed (opcjonalnie)
pnpm db:seed

# 8. Uruchomienie
pnpm dev
```

### Porty

| Serwis | Port | URL |
|--------|------|-----|
| API | 4000 | http://localhost:4000 |
| Swagger | 4000 | http://localhost:4000/api/docs |
| Web | 3000 | http://localhost:3000 |
| Admin | 3001 | http://localhost:3001 |
| Prisma Studio | 5555 | http://localhost:5555 |

### Zmienne środowiskowe (.env)

```env
# Application
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dockpulse_platform

# Redis (opcjonalnie)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1h

# AI (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Storage (MinIO lokalnie)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=dockpulse
S3_SECRET_KEY=dockpulse_secret
S3_BUCKET=dockpulse
```

### Docker

```bash
# Cały stack
docker-compose up -d

# Tylko baza i Redis
docker-compose up -d postgres redis
```

---

## API Reference

### Autentykacja

```http
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": { ... }
}
```

### Główne endpointy

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/customers` | Lista klientów |
| POST | `/api/customers` | Nowy klient |
| GET | `/api/orders` | Lista zamówień |
| POST | `/api/orders` | Nowe zamówienie |
| GET | `/api/products` | Lista produktów |
| POST | `/api/ai-branding/analyze` | Ekstrakcja brandingu AI |
| POST | `/platform/tenants/register` | Rejestracja tenanta |
| GET | `/health` | Health check |

**Swagger**: http://localhost:4000/api/docs

---

## Licencja

MIT License - Bartosz Gaca <kontakt@bartoszgaca.pl>
