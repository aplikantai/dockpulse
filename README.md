# DockPulse

**Modularna platforma CRM/WMS typu multi-tenant dla malych i srednich firm B2B**

---

## Overview

DockPulse to platforma SaaS oferujaca gotowe szablony branzowe z predefiniowanymi modulami, polami i workflow - bez koniecznosci pisania kodu przez uzytkownika.

### Kluczowe zalozenia

- **Multi-tenancy** z izolowanymi bazami danych per tenant
- **Subdomeny**: `tenant.dockpulse.com`
- **Event Bus**: PostgreSQL LISTEN/NOTIFY
- **No-Code**: gotowe moduly on/off, predefiniowane pola, triggery on/off
- **Auto-Branding**: automatyczne pobieranie logo, kolorow i danych firmy z URL
- **AI**: asystent konfiguracji (sugestie), NIE generator kodu
- **Portal klienta**: logowanie przez telefon
- **Design**: iOS glassmorphism (blur, przezroczystosc)

---

## Zaimplementowane moduly

### Backend (NestJS)

| Modul | Opis | Funkcjonalnosci |
|-------|------|-----------------|
| **Auth** | Uwierzytelnianie JWT | Login/logout, role-based access control, token refresh |
| **Users** | Zarzadzanie uzytkownikami | CRUD, role (admin/manager/employee), aktywacja/dezaktywacja |
| **Customers** | Zarzadzanie klientami | CRUD, adresy, NIP, tagi, portal klienta |
| **Products** | Katalog produktow | CRUD, kody SKU/EAN, ceny netto/brutto, VAT, jednostki |
| **Orders** | Zamowienia | CRUD, pozycje, statusy, obliczanie sum, historia zmian |
| **Quotes** | Wyceny | CRUD, konwersja quote->order, waznosc, wysylka email/SMS |
| **Tenant** | Multi-tenancy | Middleware, domain resolution, izolacja danych |
| **Branding** | Auto-Branding | Ekstrakcja logo/kolorow z URL, dane firmy z API |
| **Cache** | Redis caching | Automatyczne cache'owanie, invalidacja |
| **AI** | OpenRouter integration | Asystent konfiguracji, sugestie |
| **Notifications** | Powiadomienia | Email, SMS (future), webhooks |
| **Reports** | Raporty | Eksport CSV/PDF, statystyki |
| **Settings** | Ustawienia | Moduly on/off, konfiguracja pol, triggery |
| **Storage** | Pliki | Upload, storage, S3-compatible |
| **Platform** | Administracja | Zarzadzanie tenantami, plany, billing |
| **Portal** | Portal klienta | Logowanie przez telefon, skladanie zamowien |

### Frontend (Next.js 14)

- App Router z SSR/SSG
- shadcn/ui + Tailwind CSS
- iOS Glassmorphism design
- React Query + Zustand
- Formularze z React Hook Form + Zod

---

## Struktura projektu

```
dockpulse/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   └── src/
│   │       ├── modules/        # 17 modulow biznesowych
│   │       ├── common/         # Guardy, dekoratory, filtry
│   │       └── main.ts
│   └── web/                    # Next.js Frontend
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # UI components
│           └── lib/            # Utilities
├── landing/                    # ⭐ Landing Page (Vite + React)
│   ├── components/
│   │   ├── Registration.tsx   # Modal rejestracji tenantow
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── ...
│   ├── dist/                  # Build output
│   └── index.html
├── packages/
│   ├── shared/                 # Shared types, schemas (Zod)
│   ├── ui/                     # Shared UI components
│   └── database/               # Prisma schema + client
├── docker/
├── scripts/
├── docs/
│   ├── DEPLOYMENT-FULL.md     # ⭐ Pelna instrukcja wdrozenia
│   └── ...
└── .github/workflows/
```

---

## Quick Start

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 15+
- pnpm 8+
- Redis 7+
- Docker (opcjonalnie)

### Development

```bash
# Instalacja
pnpm install

# Uruchom bazy danych
docker compose up -d postgres redis

# Generuj Prisma client
pnpm db:generate

# Migracje
pnpm db:migrate

# Seed danych
pnpm db:seed

# Dev server (API + Web)
pnpm dev

# Landing Page (osobno)
cd landing
npm install
npm run dev  # Port 3001

# Build
pnpm build
```

### Rejestracja nowego tenanta

#### Opcja 1: Przez Landing Page (zalecane)

1. Otwórz `http://localhost:3001`
2. Kliknij "Rozpocznij za darmo"
3. Wypełnij formularz 3-etapowy:
   - Wybór szablonu (Usługi/Produkcja/Handel)
   - Dane firmy (nazwa, subdomena, URL)
   - Konto admina (imię, email, telefon)
4. System automatycznie:
   - Tworzy tenanta i bazę danych
   - Zakłada konto administratora
   - Wysyła email z hasłem
   - Przekierowuje do panelu logowania

#### Opcja 2: Przez CLI

```bash
./scripts/create-tenant.sh --slug=acme --name="ACME Corp" --template=services
```

#### Opcja 3: Przez API

```bash
curl -X POST http://localhost:3333/api/platform/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "ACME Corporation",
    "slug": "acme",
    "template": "services",
    "websiteUrl": "https://acme.com",
    "adminName": "Jan Kowalski",
    "adminEmail": "jan@acme.com",
    "adminPhone": "+48 123 456 789"
  }'
```

---

## API Endpoints

### Auth
- `POST /auth/login` - Logowanie (email + password)
- `POST /auth/refresh` - Odswiezenie tokena
- `POST /auth/logout` - Wylogowanie

### Users
- `GET /users` - Lista uzytkownikow
- `POST /users` - Utworz uzytkownika
- `GET /users/:id` - Pobierz uzytkownika
- `PUT /users/:id` - Aktualizuj uzytkownika
- `DELETE /users/:id` - Usun uzytkownika

### Customers
- `GET /customers` - Lista klientow (paginacja, filtry)
- `POST /customers` - Utworz klienta
- `GET /customers/:id` - Pobierz klienta
- `PUT /customers/:id` - Aktualizuj klienta
- `DELETE /customers/:id` - Usun klienta

### Products
- `GET /products` - Lista produktow
- `POST /products` - Utworz produkt
- `GET /products/:id` - Pobierz produkt
- `PUT /products/:id` - Aktualizuj produkt
- `DELETE /products/:id` - Usun produkt

### Orders
- `GET /orders` - Lista zamowien
- `POST /orders` - Utworz zamowienie
- `GET /orders/:id` - Pobierz zamowienie
- `PUT /orders/:id` - Aktualizuj zamowienie
- `PATCH /orders/:id/status` - Zmien status
- `DELETE /orders/:id` - Usun zamowienie

### Quotes
- `GET /quotes` - Lista wycen
- `POST /quotes` - Utworz wycene
- `GET /quotes/:id` - Pobierz wycene
- `PATCH /quotes/:id/send` - Wyslij wycene
- `POST /quotes/:id/convert` - Konwertuj na zamowienie
- `DELETE /quotes/:id` - Usun wycene

---

## Dokumentacja

| Dokument | Opis |
|----------|------|
| [SPECYFIKACJA.md](docs/SPECYFIKACJA.md) | Pelna specyfikacja techniczna |
| [ARCHITEKTURA.md](docs/ARCHITEKTURA.md) | Architektura systemu |
| [API.md](docs/API.md) | Dokumentacja API |
| [SZABLONY.md](docs/SZABLONY.md) | Szablony branzowe |
| [AUTO-BRANDING.md](docs/AUTO-BRANDING.md) | System auto-brandingu |
| [DEPLOYMENT-FULL.md](docs/DEPLOYMENT-FULL.md) | ⭐ Pelna instrukcja wdrozenia + landing page |
| [landing/README.md](landing/README.md) | Landing page - quick start |

---

## Stack technologiczny

### Backend
- Node.js 20 LTS
- NestJS 10
- PostgreSQL 15+
- Prisma ORM
- Redis (cache)
- BullMQ (queues)
- Swagger (dokumentacja API)

### Frontend
- Next.js 14+ (App Router)
- shadcn/ui + Tailwind CSS
- React Query + Zustand
- iOS Glassmorphism design
- Zod (walidacja)

### Infrastruktura
- Docker + Docker Compose
- Caddy (reverse proxy, wildcard SSL)
- GitHub Actions (CI/CD)
- Turbo (monorepo)

---

## Szablony branzowe

| Szablon | Branze | Moduly |
|---------|--------|--------|
| **USLUGI** | IT, marketing, konsulting | @zlecenia, @klienci, @wyceny, @harmonogram |
| **PRODUKCJA** | Przetworstwo, stolarka, meble | @zamowienia, @odbiorcy, @wyroby, @magazyn |
| **HANDEL** | Hurt, dystrybucja, e-commerce B2B | @zamowienia, @kontrahenci, @towary, @faktury |

---

## Testy

```bash
# Unit tests
pnpm test

# Test coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

**Aktualny status testow**: 50 unit testow passing

---

## Autor

**Bartosz Gaca**
- Web: [bartoszgaca.pl](https://bartoszgaca.pl)
- GitHub: [github.com/gacabartosz](https://github.com/gacabartosz)

---

## Architektura modułowa (NAJWAŻNIEJSZE!)

### Jak działa system modułów

DockPulse używa **centralnego rejestru modułów** (`MODULE_REGISTRY`) jako jedynego źródła prawdy o dostępnych funkcjonalnościach. Każdy tenant może aktywować/deaktywować moduły według własnych potrzeb.

#### 1. MODULE_REGISTRY - Serce systemu

**Lokalizacja**: `/apps/api/src/modules/platform/module-registry.ts`

```typescript
export enum ModuleCode {
  // CORE MODULES (darmowe)
  CRM = 'CRM',              // Zarządzanie klientami
  ORDERS = 'ORDERS',        // Zamówienia
  PRODUCTS = 'PRODUCTS',    // Produkty

  // ADDON MODULES (płatne)
  INVENTORY = 'INVENTORY',  // Magazyn
  QUOTES = 'QUOTES',        // Wyceny
  INVOICES = 'INVOICES',    // Faktury
  REPORTS = 'REPORTS',      // Raporty

  // PREMIUM MODULES (zaawansowane)
  PRODUCTION = 'PRODUCTION',
  ANALYTICS = 'ANALYTICS',
  WEBHOOKS = 'WEBHOOKS',
  API_ACCESS = 'API_ACCESS',
}

export const MODULE_REGISTRY: Record<ModuleCode, ModuleDefinition> = {
  [ModuleCode.CRM]: {
    code: ModuleCode.CRM,
    name: 'Customer Management',
    namePl: 'Zarządzanie klientami',
    icon: 'Users',                    // Lucide React icon
    category: ModuleCategory.CORE,
    price: null,                      // darmowy
    isActive: true,                   // gotowy do użycia
    routes: ['/customers', '/customers/[id]'],
    apiEndpoints: ['GET /api/customers', 'POST /api/customers'],
    features: ['Lista klientów', 'Dodawanie/edycja'],
  },
  // ... 10+ modułów
};
```

**Dlaczego to ważne?**
- Jeden plik definiuje wszystkie moduły w systemie
- Dodanie nowego modułu = dodanie wpisu w MODULE_REGISTRY
- Automatyczna synchronizacja Backend ↔ Frontend
- Type-safe dzięki TypeScript enum

#### 2. Schemat bazy danych (Prisma)

**Lokalizacja**: `/packages/database/prisma/schema.prisma`

```prisma
model Tenant {
  id        String   @id @default(uuid())
  slug      String   @unique  // np. "onet"
  name      String
  modules   TenantModule[]  // ← Lista aktywnych modułów
  users     User[]
  customers Customer[]
  orders    Order[]
  // ... inne relacje
}

model TenantModule {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  moduleCode  String   // np. "CRM", "ORDERS" (z ModuleCode enum)
  isEnabled   Boolean  @default(true)
  config      Json?    // opcjonalna konfiguracja modułu

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, moduleCode])  // jeden moduł raz per tenant
}
```

**Jak to działa?**
1. Tenant "onet" ma wpis w tabeli `tenants`
2. Dla każdego aktywnego modułu istnieje wpis w `tenant_modules`:
   ```
   tenantId: uuid-of-onet
   moduleCode: "CRM"
   isEnabled: true
   config: {}
   ```
3. Sidebar pobiera moduły przez API: `GET /api/platform/tenants/onet/modules`
4. Zwraca tylko moduły gdzie `isEnabled = true`

#### 3. Backend API (NestJS)

**Kontroler**: `/apps/api/src/modules/platform/platform.controller.ts`

```typescript
@Controller('platform')
export class PlatformController {

  // Endpoint 1: Lista WSZYSTKICH dostępnych modułów
  @Public()
  @Get('modules/available')
  async getAvailableModules() {
    return this.platformService.getAvailableModules();
    // Zwraca: MODULE_REGISTRY (11 modułów)
  }

  // Endpoint 2: Aktywne moduły dla tenanta
  @Public()
  @Get('tenants/:slug/modules')
  async getTenantModules(@Param('slug') slug: string) {
    return this.platformService.getTenantModules(slug);
    // Zwraca: tylko moduły gdzie isEnabled=true dla tenanta "slug"
  }

  // Endpoint 3: Aktywuj/dezaktywuj moduł
  @Post('tenants/:id/modules')
  @UseGuards(PlatformAdminGuard)
  async toggleTenantModule(
    @Param('id') tenantId: string,
    @Body() dto: { moduleCode: string; isEnabled: boolean; config?: any },
  ) {
    return this.platformService.toggleTenantModule(
      tenantId,
      dto.moduleCode,
      dto.isEnabled,
      dto.config,
    );
  }
}
```

**Serwis**: `/apps/api/src/modules/platform/platform.service.ts`

```typescript
async getTenantModules(slug: string) {
  // 1. Pobierz tenanta z bazy
  const tenant = await this.prisma.tenant.findUnique({
    where: { slug },
    include: { modules: true },  // dołącz TenantModule[]
  });

  // 2. Filtruj tylko aktywne moduły
  const enabledModules = tenant.modules
    .filter(tm => tm.isEnabled)
    .map(tm => {
      // 3. Dołącz definicję z MODULE_REGISTRY
      const moduleDef = getModuleByCode(tm.moduleCode as ModuleCode);
      return {
        code: tm.moduleCode,
        isEnabled: tm.isEnabled,
        config: tm.config,
        definition: moduleDef ? {
          name: moduleDef.name,
          namePl: moduleDef.namePl,
          icon: moduleDef.icon,           // "Users", "ShoppingCart"
          routes: moduleDef.routes,       // ['/customers']
        } : null,
      };
    });

  return { tenantId: tenant.id, slug: tenant.slug, modules: enabledModules };
}
```

#### 4. Frontend - Dynamic Sidebar

**Komponent**: `/apps/web/src/components/layout/Sidebar.tsx`

```typescript
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, ShoppingCart, Package, Warehouse, FileText, Receipt, BarChart3,
  TrendingUp, Factory, Zap, Code, Settings, Bell, LayoutDashboard,
};

export function Sidebar() {
  const { tenant } = useTenant();
  const [mainNavItems, setMainNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    async function loadModules() {
      // 1. Pobierz aktywne moduły dla tenanta
      const response = await fetch(`/api/platform/tenants/${tenant.slug}/modules`);
      const data = await response.json();

      // 2. Zmapuj na elementy nawigacji
      const moduleNavItems = data.modules
        .filter(m => m.isEnabled && m.definition)
        .map(m => ({
          name: m.definition.namePl,        // "Zarządzanie klientami"
          href: m.definition.routes[0],     // "/customers"
          icon: ICON_MAP[m.definition.icon] || Package,  // React Component
          moduleCode: m.code,
        }));

      // 3. Połącz z statycznymi elementami (Dashboard, Ustawienia)
      setMainNavItems([...staticNavItems, ...moduleNavItems]);
    }

    loadModules();
  }, [tenant]);

  return (
    <aside>
      {mainNavItems.map(item => (
        <NavLink key={item.href} href={item.href}>
          <item.icon className="w-5 h-5" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </aside>
  );
}
```

**Jak to działa krok po kroku:**

1. **Użytkownik wchodzi na `onet.dockpulse.com`**
2. `TenantContext` pobiera dane tenanta (zawiera `slug: "onet"`)
3. `Sidebar` wywołuje `GET /api/platform/tenants/onet/modules`
4. Backend zwraca:
   ```json
   {
     "tenantId": "uuid-123",
     "slug": "onet",
     "modules": [
       {
         "code": "CRM",
         "isEnabled": true,
         "config": {},
         "definition": {
           "namePl": "Zarządzanie klientami",
           "icon": "Users",
           "routes": ["/customers"]
         }
       },
       {
         "code": "ORDERS",
         "isEnabled": true,
         "definition": {
           "namePl": "Zamówienia",
           "icon": "ShoppingCart",
           "routes": ["/orders"]
         }
       }
     ]
   }
   ```
5. Frontend renderuje sidebar z 2 modułami + Dashboard + Ustawienia

#### 5. Panel zarządzania modułami

**Komponent**: `/apps/web/src/app/(dashboard)/settings/modules/page.tsx`

```typescript
export default function ModulesSettingsPage() {
  const { tenant, refreshTenant } = useTenant();
  const [availableModules, setAvailableModules] = useState([]);
  const [tenantModules, setTenantModules] = useState([]);

  // Pobierz WSZYSTKIE dostępne moduły
  useEffect(() => {
    fetch('/api/platform/modules/available')
      .then(res => res.json())
      .then(setAvailableModules);
  }, []);

  // Aktywuj/dezaktywuj moduł
  const toggleModule = async (moduleCode: string, isEnabled: boolean) => {
    await fetch(`/api/platform/tenants/${tenant.id}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleCode,
        isEnabled: !isEnabled,
      }),
    });

    await refreshTenant();  // odśwież dane tenanta
  };

  return (
    <div>
      {availableModules.map(module => {
        const isEnabled = tenantModules.some(tm =>
          tm.code === module.code && tm.isEnabled
        );

        return (
          <ModuleCard key={module.code}>
            <h3>{module.namePl}</h3>
            <p>{module.descriptionPl}</p>
            <p>Cena: {module.price ? `${module.price} zł/mies` : 'DARMOWY'}</p>
            <button onClick={() => toggleModule(module.code, isEnabled)}>
              {isEnabled ? '✅ Aktywny' : '⭕ Nieaktywny'}
            </button>
          </ModuleCard>
        );
      })}
    </div>
  );
}
```

#### 6. Tenant Landing Page (Auto-Branding)

**Routing subdomen**:
- `dockpulse.com` → Marketing page
- `onet.dockpulse.com` → Redirect do `/tenant/onet` (branded landing)
- `app.dockpulse.com` → Dashboard (wymaga logowania)

**Komponent**: `/apps/web/src/app/page.tsx`

```typescript
'use client';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // Sprawdź czy to subdomena tenanta
    if (parts.length >= 3 && !hostname.includes('localhost')) {
      const subdomain = parts[0];

      if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'admin' && subdomain !== 'api') {
        // Przekieruj do branded landing page
        router.push(`/tenant/${subdomain}`);
        return;
      }
    }
  }, [router]);

  return <MarketingPage />;  // Główna strona marketingowa
}
```

**Tenant Landing**: `/apps/web/src/app/tenant/[slug]/page.tsx`

```typescript
import { TenantLandingPage } from '@/components/tenant/TenantLandingPage';

export default function TenantPage() {
  return <TenantLandingPage />;
}
```

**TenantLandingPage** pobiera:
- Logo z `tenant.branding.logoUrl`
- Kolory z `tenant.branding.colors.primary`
- Dane firmy z `tenant.companyData`

---

### Dodawanie nowego modułu (INSTRUKCJA)

Chcesz dodać moduł "WAREHOUSE" (Magazyn rozszerzony)?

**Krok 1**: Dodaj do `MODULE_REGISTRY`

```typescript
// apps/api/src/modules/platform/module-registry.ts
export enum ModuleCode {
  // ... istniejące
  WAREHOUSE = 'WAREHOUSE',
}

export const MODULE_REGISTRY: Record<ModuleCode, ModuleDefinition> = {
  // ... istniejące
  [ModuleCode.WAREHOUSE]: {
    code: ModuleCode.WAREHOUSE,
    name: 'Advanced Warehouse Management',
    namePl: 'Zarządzanie magazynem rozszerzonym',
    description: 'Multi-location inventory, batch tracking, expiry dates',
    descriptionPl: 'Wielolokalizacyjny magazyn, partie, daty ważności',
    icon: 'Warehouse',
    category: ModuleCategory.ADDON,
    price: 199,  // 199 zł/mies
    isActive: true,
    routes: ['/warehouse', '/warehouse/locations', '/warehouse/batches'],
    apiEndpoints: [
      'GET /api/warehouse/locations',
      'POST /api/warehouse/stock-movements',
    ],
    dependencies: [ModuleCode.PRODUCTS],  // wymaga PRODUCTS
    features: [
      'Wiele lokalizacji magazynowych',
      'Zarządzanie partiami',
      'Daty ważności produktów',
      'Automatyczne powiadomienia o niskich stanach',
    ],
  },
};
```

**Krok 2**: Dodaj ikonę do Sidebar

```typescript
// apps/web/src/components/layout/Sidebar.tsx
import { Warehouse } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType> = {
  // ... istniejące
  Warehouse,
};
```

**Krok 3**: Utwórz route w Next.js

```bash
mkdir -p apps/web/src/app/(dashboard)/warehouse
touch apps/web/src/app/(dashboard)/warehouse/page.tsx
```

**Krok 4**: Aktywuj dla tenanta

Przez panel Settings → Modules → klik "Aktywuj" przy module WAREHOUSE

**LUB** przez SQL:

```sql
INSERT INTO "tenant_modules" (id, "tenantId", "moduleCode", "isEnabled", config)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'onet'),
  'WAREHOUSE',
  true,
  '{}'
);
```

**To wszystko!** Moduł automatycznie:
- ✅ Pojawi się w sidebar
- ✅ Będzie dostępny w panelu Settings/Modules
- ✅ Route `/warehouse` zadziała
- ✅ Można go wyłączyć/włączyć per tenant

---

### Aktualny stan modułów

| Kod modułu | Nazwa PL | Kategoria | Cena | Status |
|------------|----------|-----------|------|--------|
| CRM | Zarządzanie klientami | CORE | DARMOWY | ✅ Aktywny |
| ORDERS | Zamówienia | CORE | DARMOWY | ✅ Aktywny |
| PRODUCTS | Produkty | CORE | DARMOWY | ✅ Aktywny |
| INVENTORY | Magazyn podstawowy | ADDON | 99 zł/mies | ✅ Aktywny |
| QUOTES | Wyceny | ADDON | 79 zł/mies | ✅ Aktywny |
| INVOICES | Faktury | ADDON | 129 zł/mies | ✅ Aktywny |
| REPORTS | Raporty | ADDON | 149 zł/mies | ✅ Aktywny |
| PRODUCTION | Zarządzanie produkcją | PREMIUM | 299 zł/mies | 🔜 Wkrótce |
| ANALYTICS | Zaawansowana analityka | PREMIUM | 249 zł/mies | 🔜 Wkrótce |
| WEBHOOKS | Integracje webhook | ENTERPRISE | 199 zł/mies | 🔜 Wkrótce |
| API_ACCESS | API programistyczne | ENTERPRISE | 299 zł/mies | 🔜 Wkrótce |

**Tenant "onet" ma aktywne**: CRM, ORDERS, PRODUCTS

---

## STRUKTURA ŁĄCZENIA KOLEJNYCH MODUŁÓW (INSTRUKCJA KOMPLETNA)

### Filozofia systemu

DockPulse używa **wzorca Module Registry** - jeden centralny plik definiuje wszystkie moduły, które następnie są automatycznie:
- Dostępne w panelu admin
- Widoczne w katalogu modułów
- Możliwe do aktywacji per tenant
- Renderowane w sidebar (jeśli aktywne)
- Dostępne przez API

**Nie musisz modyfikować wielu plików** - wystarczy dodać moduł do `MODULE_REGISTRY` i utworzyć odpowiednie pliki frontend/backend.

---

### KROK 1: Dodanie modułu do MODULE_REGISTRY (BACKEND)

**Plik**: `/apps/api/src/modules/platform/module-registry.ts`

```typescript
// 1. Dodaj kod modułu do enuma ModuleCode
export enum ModuleCode {
  // ... istniejące
  WAREHOUSE = 'WAREHOUSE',  // ← NOWY MODUŁ
}

// 2. Dodaj definicję do MODULE_REGISTRY
export const MODULE_REGISTRY: Record<ModuleCode, ModuleDefinition> = {
  // ... istniejące

  [ModuleCode.WAREHOUSE]: {
    code: ModuleCode.WAREHOUSE,
    name: 'Warehouse Management',
    namePl: 'Zarządzanie magazynem',
    description: 'Multi-location inventory, batch tracking, expiry dates',
    descriptionPl: 'Wielolokalizacyjny magazyn, partie, daty ważności',
    icon: 'Warehouse',  // Nazwa ikony z Lucide React
    category: ModuleCategory.ADDON,
    price: 199,  // 199 zł/mies (null = darmowy)
    isActive: true,  // true = gotowy do użycia
    routes: ['/warehouse', '/warehouse/locations', '/warehouse/batches'],
    apiEndpoints: [
      'GET /api/warehouse/locations',
      'POST /api/warehouse/stock-movements',
      'GET /api/warehouse/batches',
    ],
    dependencies: [ModuleCode.PRODUCTS],  // Wymaga PRODUCTS
    features: [
      'Wiele lokalizacji magazynowych',
      'Zarządzanie partiami',
      'Daty ważności produktów',
      'Automatyczne powiadomienia o niskich stanach',
      'Transfer między lokalizacjami',
    ],
  },
};
```

**Co się dzieje automatycznie po dodaniu?**
✅ Moduł pojawia się w `/api/platform/modules/available`
✅ Moduł widoczny w panelu admin `/admin/modules`
✅ Można go aktywować dla tenanta w `/admin/tenants/[id]`
✅ Tenant może go włączyć/wyłączyć w `/settings/modules`
✅ MRR/ARR automatycznie uwzględnia cenę modułu

---

### KROK 2: Backend - Utworzenie kontrolera i serwisu (OPCJONALNE)

**Jeśli moduł ma własną logikę biznesową**, utwórz moduł NestJS:

```bash
cd apps/api/src/modules
mkdir warehouse
cd warehouse
```

**warehouse.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService],
})
export class WarehouseModule {}
```

**warehouse.controller.ts**:
```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CurrentTenant } from '../tenant/decorators/current-tenant.decorator';
import { WarehouseService } from './warehouse.service';

@Controller('warehouse')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('locations')
  async getLocations(@CurrentTenant() tenantId: string) {
    return this.warehouseService.getLocations(tenantId);
  }

  @Post('stock-movements')
  async createStockMovement(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.warehouseService.createStockMovement(tenantId, dto);
  }
}
```

**warehouse.service.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async getLocations(tenantId: string) {
    // Implementacja logiki
    return this.prisma.warehouseLocation.findMany({
      where: { tenantId },
    });
  }

  async createStockMovement(tenantId: string, dto: any) {
    // Implementacja logiki
  }
}
```

**Dodaj do AppModule** (`apps/api/src/app.module.ts`):
```typescript
import { WarehouseModule } from './modules/warehouse/warehouse.module';

@Module({
  imports: [
    // ... istniejące
    WarehouseModule,  // ← DODAJ
  ],
})
export class AppModule {}
```

---

### KROK 3: Frontend - Dodanie ikony do Sidebar

**Plik**: `/apps/web/src/components/layout/Sidebar.tsx`

```typescript
import { Warehouse } from 'lucide-react';  // ← IMPORT IKONY

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, ShoppingCart, Package,
  Warehouse,  // ← DODAJ DO MAPY
  FileText, Receipt, BarChart3,
  TrendingUp, Factory, Zap, Code, Settings, Bell, LayoutDashboard,
};
```

**Sidebar automatycznie**:
- Pobiera moduły z API dla tenanta
- Znajduje ikonę `Warehouse` w `ICON_MAP`
- Renderuje link do `/warehouse` (pierwszy route z `routes[]`)

---

### KROK 4: Frontend - Utworzenie strony modułu

**Struktura plików**:
```
apps/web/src/app/(dashboard)/
  warehouse/
    page.tsx           # Lista lokalizacji
    locations/
      page.tsx         # Zarządzanie lokalizacjami
    batches/
      page.tsx         # Zarządzanie partiami
```

**warehouse/page.tsx** (przykład):
```typescript
'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Warehouse } from 'lucide-react';

export default function WarehousePage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/warehouse/locations');
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">
          Zarządzanie magazynem
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {locations.map((location) => (
          <GlassCard key={location.id}>
            <h3 className="font-semibold text-lg">{location.name}</h3>
            <p className="text-sm text-gray-600">{location.address}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
```

---

### KROK 5: Baza danych - Prisma schema (jeśli potrzeba)

**Plik**: `/packages/database/prisma/schema.prisma`

```prisma
model WarehouseLocation {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  name      String
  code      String   // np. "WH-01"
  address   String?
  isActive  Boolean  @default(true)

  stockItems StockItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, code])
  @@index([tenantId])
}

model StockItem {
  id         String   @id @default(uuid())
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id])

  locationId String
  location   WarehouseLocation @relation(fields: [locationId], references: [id])

  productId  String
  product    Product  @relation(fields: [productId], references: [id])

  quantity   Decimal  @default(0)
  batchNumber String?
  expiryDate  DateTime?

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([locationId, productId, batchNumber])
  @@index([tenantId])
  @@index([productId])
}

// Dodaj relację do Tenant
model Tenant {
  // ... istniejące pola
  warehouseLocations WarehouseLocation[]
  stockItems         StockItem[]
}
```

**Migracja**:
```bash
cd packages/database
npx prisma migrate dev --name add_warehouse_module
npx prisma generate
```

---

### KROK 6: Aktywacja modułu dla tenanta

#### Opcja A: Przez panel admin

1. Wejdź na **https://dockpulse.com/admin/tenants**
2. Kliknij "View Details" na tenanta (np. "onet")
3. W sekcji "Installed Modules" wybierz **"+ Install Module"**
4. Wybierz **"WAREHOUSE"**
5. Moduł zostaje aktywowany ✅

#### Opcja B: Przez SQL

```sql
INSERT INTO "tenant_modules" (id, "tenantId", "moduleCode", "isEnabled", config)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'onet'),
  'WAREHOUSE',
  true,
  '{}'::jsonb
);
```

#### Opcja C: Przez API

```bash
curl -X POST https://dockpulse.com/api/admin/tenants/{tenantId}/modules/WAREHOUSE \
  -H "Authorization: Bearer {admin_token}"
```

---

### KROK 7: Sprawdzenie czy działa

1. **Sidebar**: Moduł "Zarządzanie magazynem" pojawia się w menu
2. **Route**: `/warehouse` jest dostępny
3. **API**: `GET /api/warehouse/locations` zwraca dane
4. **Admin panel**: `/admin/modules` pokazuje WAREHOUSE w katalogu
5. **Settings**: `/settings/modules` pozwala włączyć/wyłączyć moduł

---

### Flow danych - jak to wszystko działa razem

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. MODULE_REGISTRY (źródło prawdy)                             │
│    /apps/api/src/modules/platform/module-registry.ts           │
│    - Definicje wszystkich modułów (11)                          │
│    - Kategorie, ceny, zależności, funkcje                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Backend API                                                  │
│    GET /api/platform/modules/available                          │
│    - Zwraca wszystkie moduły z MODULE_REGISTRY                  │
│    - Filtruje po isActive                                        │
│                                                                  │
│    GET /api/platform/tenants/{slug}/modules                     │
│    - Pobiera z bazy TenantModule (WHERE isEnabled=true)        │
│    - Łączy z definicjami z MODULE_REGISTRY                     │
│    - Zwraca: { code, isEnabled, definition { icon, routes } }  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Baza danych (tenant_modules)                                 │
│    ┌──────────┬─────────┬────────────┬───────────┬────────┐  │
│    │ tenantId │ code    │ isEnabled  │ config    │ ...    │  │
│    ├──────────┼─────────┼────────────┼───────────┼────────┤  │
│    │ uuid-123 │ CRM     │ true       │ {}        │ ...    │  │
│    │ uuid-123 │ ORDERS  │ true       │ {}        │ ...    │  │
│    │ uuid-123 │ WAREHOUSE│ true      │ {}        │ ...    │  │
│    └──────────┴─────────┴────────────┴───────────┴────────┘  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Frontend Sidebar                                             │
│    /apps/web/src/components/layout/Sidebar.tsx                 │
│    - useEffect → fetch(`/api/platform/tenants/${slug}/modules`)│
│    - Mapuje ikony: ICON_MAP[definition.icon]                   │
│    - Renderuje NavLink dla każdego modułu                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. UI Renderuje moduły                                          │
│    - Sidebar: "Zarządzanie magazynem" + ikona Warehouse         │
│    - Route: /warehouse → warehouse/page.tsx                     │
│    - Settings: Toggle ON/OFF w /settings/modules                │
└─────────────────────────────────────────────────────────────────┘
```

---

### Zarządzanie zależnościami modułów

**Problem**: Moduł WAREHOUSE wymaga PRODUCTS

**Rozwiązanie w MODULE_REGISTRY**:
```typescript
[ModuleCode.WAREHOUSE]: {
  dependencies: [ModuleCode.PRODUCTS],  // ← Zdefiniuj zależności
}
```

**Backend automatycznie sprawdza**:
```typescript
// W platform.service.ts (toggleTenantModule)
const dependencies = checkModuleDependencies(moduleCode, enabledModules);
if (!dependencies.isValid) {
  throw new Error(
    `Cannot enable ${moduleCode}: missing ${dependencies.missing.join(', ')}`
  );
}
```

**Frontend pokazuje ostrzeżenie**:
- Panel Settings/Modules: "⚠️ Wymaga: PRODUCTS"
- Nie można aktywować WAREHOUSE jeśli PRODUCTS nie jest aktywny

---

### Moduły dedykowane (custom per tenant)

**Scenariusz**: Tenant "onet" chce specjalny moduł "ONET_ANALYTICS" tylko dla siebie.

**Rozwiązanie**:

1. **Dodaj do MODULE_REGISTRY**:
```typescript
[ModuleCode.ONET_ANALYTICS]: {
  code: ModuleCode.ONET_ANALYTICS,
  namePl: 'Analityka Onet (dedykowana)',
  category: ModuleCategory.ENTERPRISE,
  price: 0,  // Custom pricing - zarządzane osobno
  isActive: true,
  // ...
}
```

2. **Rozszerz TenantModule o custom pricing** (w przyszłości):
```prisma
model TenantModule {
  // ... istniejące
  customPrice    Decimal?  // Override ceny z MODULE_REGISTRY
  isDedicated    Boolean   @default(false)  // Czy moduł dedykowany
  visibleToOthers Boolean  @default(true)   // Czy widoczny dla innych
}
```

3. **Filtruj w panelu admin**:
```typescript
// Pokaż tylko moduły dedykowane dla tenanta lub publiczne
const visibleModules = allModules.filter(m =>
  !m.isDedicated || m.tenantId === currentTenantId
);
```

---

### Trial periods (14 dni)

**Implementacja**:

1. **Dodaj pole do Tenant**:
```prisma
model Tenant {
  // ... istniejące
  trialEndsAt   DateTime?
  plan          String    @default("TRIAL")  // TRIAL, FREE, STARTER, PRO, ENTERPRISE
  status        String    @default("ACTIVE") // ACTIVE, TRIAL, SUSPENDED, CANCELED
}
```

2. **Automatyczne wyłączanie trial po 14 dniach** (CRON job):
```typescript
// apps/api/src/modules/billing/billing.cron.ts
@Cron('0 0 * * *') // Codziennie o północy
async checkExpiredTrials() {
  const now = new Date();
  const expiredTrials = await this.prisma.tenant.findMany({
    where: {
      plan: 'TRIAL',
      trialEndsAt: { lte: now },
    },
  });

  for (const tenant of expiredTrials) {
    // Wyłącz płatne moduły
    await this.prisma.tenantModule.updateMany({
      where: {
        tenantId: tenant.id,
        // Tylko płatne moduły (price > 0)
      },
      data: { isEnabled: false },
    });

    // Zmień plan na FREE
    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan: 'FREE',
        status: 'ACTIVE',
      },
    });

    // Wyślij email
    await this.emailService.sendTrialExpiredNotification(tenant);
  }
}
```

---

### Billing - przyszłe rozszerzenia

**Model danych**:
```prisma
model Subscription {
  id          String   @id @default(uuid())
  tenantId    String   @unique
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  plan        String   // FREE, STARTER, PRO, ENTERPRISE
  status      String   // ACTIVE, CANCELED, PAST_DUE, TRIAL

  currentPeriodStart DateTime
  currentPeriodEnd   DateTime

  invoices    Invoice[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Invoice {
  id             String   @id @default(uuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])

  amount         Decimal
  currency       String   @default("PLN")
  status         String   // DRAFT, PAID, FAILED, REFUNDED

  paidAt         DateTime?
  dueDate        DateTime

  items          InvoiceItem[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model InvoiceItem {
  id         String  @id @default(uuid())
  invoiceId  String
  invoice    Invoice @relation(fields: [invoiceId], references: [id])

  moduleCode String  // Z ModuleCode enum
  quantity   Int     @default(1)
  unitPrice  Decimal
  amount     Decimal  // quantity * unitPrice

  createdAt  DateTime @default(now())
}
```

---

### Checklist dodawania nowego modułu

```
□ 1. Dodaj ModuleCode do enuma w module-registry.ts
□ 2. Dodaj definicję do MODULE_REGISTRY
□ 3. Dodaj ikonę do ICON_MAP w Sidebar.tsx
□ 4. [OPCJONALNIE] Utwórz backend module (controller + service)
□ 5. [OPCJONALNIE] Dodaj do AppModule
□ 6. [OPCJONALNIE] Dodaj modele Prisma (jeśli moduł ma własne dane)
□ 7. [OPCJONALNIE] Wykonaj migrację Prisma
□ 8. Utwórz frontend page w (dashboard)/[module-name]/page.tsx
□ 9. Build backend: pnpm --filter @dockpulse/api build
□ 10. Build frontend: pnpm --filter @dockpulse/web build
□ 11. Restart services: pm2 restart dockpulse-api dockpulse-web
□ 12. Aktywuj moduł dla tenanta (panel admin lub SQL)
□ 13. Sprawdź: Sidebar → route → API → admin panel → settings
```

**To wszystko!** System jest w pełni modularny i rozszerzalny.

---

*Wersja: 3.1 | Data: Styczeń 2026 | Dashboard Admin + Dokumentacja modułów GOTOWA*
