# DockPulse

**Modularna platforma CRM/WMS typu multi-tenant dla małych i średnich firm B2B**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.4.20-e0234e)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## 📋 Spis treści

- [Overview](#overview)
- [Kluczowe założenia](#kluczowe-założenia)
- [Stack technologiczny](#stack-technologiczny)
- [Struktura projektu](#struktura-projektu)
- [Zaimplementowane moduły](#zaimplementowane-moduły)
- [Admin Panel](#admin-panel)
- [API Endpoints (kompletna lista)](#api-endpoints-kompletna-lista)
- [Instalacja i uruchomienie](#instalacja-i-uruchomienie)
- [Deployment na VPS](#deployment-na-vps)
- [Architektura modułowa](#architektura-modułowa)
- [Dodawanie nowego modułu](#dodawanie-nowego-modułu)
- [Baza danych (Prisma Schema)](#baza-danych-prisma-schema)
- [Multi-tenancy](#multi-tenancy)
- [Auto-Branding](#auto-branding)
- [Portal klienta](#portal-klienta)
- [TODO / Co nie działa](#todo--co-nie-działa)
- [Roadmap](#roadmap)
- [Autor](#autor)

---

## Overview

**DockPulse** to platforma SaaS oferująca gotowe szablony branżowe z predefiniowanymi modułami, polami i workflow - bez konieczności pisania kodu przez użytkownika.

### Główne funkcjonalności

- ✅ **Multi-tenancy** - każdy klient ma izolowane dane w osobnej bazie PostgreSQL
- ✅ **Subdomeny** - automatyczny routing `tenant.dockpulse.com`
- ✅ **Moduły on/off** - elastyczny system modułów (11 dostępnych)
- ✅ **Admin Panel** - zarządzanie tenantami, statystyki, wykresy MRR/ARR
- ✅ **Auto-Branding** - automatyczne pobieranie logo i kolorów z URL firmy
- ✅ **Portal klienta** - logowanie przez telefon, składanie zamówień
- ✅ **Event Bus** - PostgreSQL LISTEN/NOTIFY
- ✅ **Glassmorphism UI** - iOS-inspired design
- 🔜 **AI Asystent** - sugestie konfiguracji (w przygotowaniu)
- 🔜 **Billing** - trial periods, subskrypcje, faktury (w przygotowaniu)

---

## Kluczowe założenia

1. **Multi-tenancy**
   - Każdy tenant (`slug`) ma izolowane dane w PostgreSQL
   - Routing przez subdomeny: `onet.dockpulse.com`, `wp.dockpulse.com`
   - Middleware `TenantMiddleware` automatycznie wykrywa tenanta z:
     - Header `x-tenant-id`
     - Subdomena
     - Query param `?tenant=onet` (dev mode)

2. **No-Code dla użytkownika końcowego**
   - Gotowe moduły włączane/wyłączane przez toggle
   - Predefiniowane pola i workflow
   - Brak możliwości pisania kodu przez użytkownika

3. **Modułowość**
   - Centralny rejestr `MODULE_REGISTRY` jako single source of truth
   - Moduły CORE (darmowe), ADDON (płatne), PREMIUM, ENTERPRISE
   - Dynamiczny sidebar renderowany z aktywnych modułów
   - Zależności między modułami (np. WAREHOUSE wymaga PRODUCTS)

4. **Auto-Branding**
   - Automatyczne ekstrakcja logo z `websiteUrl`
   - Ekstrakcja palety kolorów (primary, secondary, accent)
   - Dane firmy z API (GUS, REGON - future)
   - Preview przed zapisaniem

5. **Event-Driven Architecture**
   - Event Bus na PostgreSQL LISTEN/NOTIFY
   - Module hooks (beforeCreate, afterUpdate, etc.)
   - Extensible entity system (produkt może być rozszerzany przez moduły)

---

## Stack technologiczny

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10.4.20
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.22.0
- **Cache**: Redis 7+
- **Queue**: BullMQ
- **Auth**: JWT (passport-jwt)
- **API Docs**: Swagger (OpenAPI)
- **WebSockets**: Socket.IO (future)

### Frontend
- **Framework**: Next.js 14.2.35 (App Router)
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 3.4
- **State**: React Query + Zustand
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts 2.15.0
- **Icons**: Lucide React
- **Design**: iOS Glassmorphism (backdrop-blur, transparency)

### Infrastruktura
- **Reverse Proxy**: Nginx + Certbot (SSL wildcard)
- **Process Manager**: PM2
- **Monorepo**: pnpm workspaces
- **CI/CD**: GitHub Actions (future)
- **Hosting**: VPS (Ubuntu 22.04)

### DevOps
- **Docker**: PostgreSQL, Redis containers
- **Scripts**: Deployment automation (`install_server.sh`)
- **Logs**: PM2 logs, Nginx access/error logs
- **Monitoring**: PM2 monitoring (future: Grafana)

---

## Struktura projektu

```
dockpulse/
├── apps/
│   ├── api/                          # NestJS Backend (Port 3003)
│   │   └── src/
│   │       ├── modules/              # Moduły biznesowe
│   │       │   ├── auth/             # Uwierzytelnianie JWT
│   │       │   ├── users/            # Zarządzanie użytkownikami
│   │       │   ├── customers/        # Klienci (CRM)
│   │       │   ├── products/         # Produkty
│   │       │   ├── orders/           # Zamówienia
│   │       │   ├── quotes/           # Wyceny
│   │       │   ├── inventory/        # Magazyn podstawowy
│   │       │   ├── stock/            # Moduł @stock (advanced inventory)
│   │       │   ├── invoicing/        # Moduł @invoicing (faktury)
│   │       │   ├── calendar/         # Moduł @calendar (wydarzenia)
│   │       │   ├── webhooks/         # Moduł @webhooks (integracje)
│   │       │   ├── branding/         # Auto-branding z URL
│   │       │   ├── ai/               # AI asystent (OpenRouter)
│   │       │   ├── notifications/    # Email, SMS, push
│   │       │   ├── reports/          # Raporty CSV/PDF
│   │       │   ├── settings/         # Ustawienia tenanta
│   │       │   ├── storage/          # Upload plików
│   │       │   ├── cache/            # Redis caching
│   │       │   ├── tenant/           # Multi-tenancy
│   │       │   ├── platform/         # Zarządzanie platformą
│   │       │   ├── admin/            # ⭐ Panel administracyjny
│   │       │   ├── portal/           # Portal klienta
│   │       │   ├── database/         # Prisma service
│   │       │   ├── databus/          # Event bus
│   │       │   └── entity-registry/  # Extensible entities
│   │       ├── common/               # Guards, decorators, filters
│   │       ├── health.controller.ts  # Health check
│   │       ├── app.module.ts         # Root module
│   │       └── main.ts               # Bootstrap
│   │
│   └── web/                          # Next.js Frontend (Port 3000)
│       └── src/
│           ├── app/                  # App Router
│           │   ├── (dashboard)/      # Dashboard layout (authenticated)
│           │   │   ├── dashboard/    # Dashboard główny
│           │   │   ├── customers/    # Lista klientów
│           │   │   ├── products/     # Produkty
│           │   │   ├── orders/       # Zamówienia
│           │   │   ├── quotes/       # Wyceny
│           │   │   ├── inventory/    # Magazyn
│           │   │   ├── notifications/# Powiadomienia
│           │   │   ├── reports/      # Raporty
│           │   │   └── settings/     # Ustawienia
│           │   │       ├── modules/  # Zarządzanie modułami
│           │   │       ├── ai/       # Konfiguracja AI
│           │   │       └── workflows/# Workflow automation
│           │   │
│           │   ├── (platform-admin)/ # ⭐ Admin Panel
│           │   │   └── admin/
│           │   │       ├── page.tsx           # Redirect do /dashboard
│           │   │       ├── dashboard/         # Dashboard admina
│           │   │       │   └── page.tsx       # Statystyki + wykresy
│           │   │       ├── tenants/           # Zarządzanie tenantami
│           │   │       │   ├── page.tsx       # Lista tenantów
│           │   │       │   └── [id]/page.tsx  # Szczegóły + moduły
│           │   │       └── modules/           # Katalog modułów
│           │   │           └── page.tsx       # Wszystkie moduły
│           │   │
│           │   ├── portal/           # Portal klienta (public)
│           │   │   ├── login/        # Logowanie SMS
│           │   │   ├── orders/       # Zamówienia klienta
│           │   │   ├── quotes/       # Wyceny klienta
│           │   │   └── new-order/    # Nowe zamówienie
│           │   │
│           │   ├── tenant/[slug]/    # Branded landing page
│           │   ├── login/            # Login tenanta
│           │   ├── onboarding/       # Pierwszy setup
│           │   └── page.tsx          # Marketing homepage
│           │
│           ├── components/           # React komponenty
│           │   ├── layout/           # Layout components
│           │   │   ├── Sidebar.tsx   # Dynamic sidebar z modułami
│           │   │   ├── Header.tsx
│           │   │   └── Footer.tsx
│           │   ├── ui/               # UI primitives (shadcn)
│           │   │   ├── GlassCard.tsx # Glassmorphism card
│           │   │   ├── Button.tsx
│           │   │   ├── Input.tsx
│           │   │   └── ...
│           │   ├── tenant/           # Tenant-specific
│           │   │   └── TenantLandingPage.tsx
│           │   └── portal/           # Portal components
│           │
│           ├── lib/                  # Utilities
│           │   ├── api.ts            # API client
│           │   ├── auth.ts           # Auth helpers
│           │   └── utils.ts
│           │
│           └── contexts/             # React contexts
│               ├── TenantContext.tsx # Tenant state
│               └── AuthContext.tsx   # Auth state
│
├── packages/
│   ├── database/                     # Prisma schema shared
│   │   └── prisma/
│   │       ├── schema.prisma         # Database schema
│   │       └── migrations/           # SQL migrations
│   │
│   ├── shared/                       # Shared types, utils
│   └── ui/                           # Shared UI components
│
├── scripts/
│   ├── install_server.sh             # Full VPS deployment
│   ├── create-tenant.sh              # CLI: create new tenant
│   └── seed-data.ts                  # Seed initial data
│
├── docs/
│   ├── SPECYFIKACJA.md               # Full spec
│   ├── ARCHITEKTURA.md               # Architecture
│   ├── API.md                        # API docs
│   ├── SZABLONY.md                   # Branżowe templates
│   ├── AUTO-BRANDING.md              # Branding system
│   └── DEPLOYMENT-FULL.md            # Deployment guide
│
├── .github/
│   └── workflows/                    # CI/CD (future)
│
├── docker-compose.yml                # Local dev databases
├── pnpm-workspace.yaml               # Monorepo config
├── package.json                      # Root package
└── README.md                         # This file

```

---

## Zaimplementowane moduły

### Backend (NestJS) - 17 modułów

| Moduł | Opis | Główne funkcje | Status |
|-------|------|----------------|--------|
| **Auth** | Uwierzytelnianie JWT | Login/logout, refresh token, role-based access | ✅ Gotowy |
| **Users** | Zarządzanie użytkownikami | CRUD, role (ADMIN/MANAGER/EMPLOYEE), aktywacja/dezaktywacja | ✅ Gotowy |
| **Customers** | CRM - zarządzanie klientami | CRUD, adresy, NIP, tagi, portal access | ✅ Gotowy |
| **Products** | Katalog produktów | CRUD, SKU/EAN, ceny netto/brutto, VAT, jednostki | ✅ Gotowy |
| **Orders** | Zamówienia | CRUD, pozycje, statusy, obliczanie sum, historia zmian | ✅ Gotowy |
| **Quotes** | Wyceny | CRUD, konwersja quote→order, ważność, wysyłka email/SMS | ✅ Gotowy |
| **Inventory** | Magazyn podstawowy | Stany magazynowe, history, low stock alerts | ✅ Gotowy |
| **Stock** | @stock (advanced inventory) | Multi-location, batch tracking, expiry dates | ✅ Gotowy |
| **Invoicing** | @invoicing (faktury) | Generowanie faktur, PDF, wysyłka | ✅ Gotowy |
| **Calendar** | @calendar (wydarzenia) | Wydarzenia, zadania, przypomnienia | ✅ Gotowy |
| **Webhooks** | @webhooks (integracje) | HTTP webhooks, delivery tracking | ✅ Gotowy |
| **Tenant** | Multi-tenancy | Middleware, domain resolution, data isolation | ✅ Gotowy |
| **Branding** | Auto-Branding | Ekstrakcja logo/kolorów z URL, preview | ✅ Gotowy |
| **AI** | OpenRouter integration | Asystent konfiguracji, sugestie (Claude, GPT-4) | ✅ Gotowy |
| **Notifications** | Powiadomienia | Email (Resend), SMS (future), webhooks | ✅ Gotowy |
| **Reports** | Raporty | Eksport CSV/PDF, statystyki | ✅ Gotowy |
| **Settings** | Ustawienia | Moduły on/off, konfiguracja pól, triggery | ✅ Gotowy |
| **Storage** | Upload plików | Local storage, future: S3-compatible | ✅ Gotowy |
| **Platform** | Administracja platformy | Zarządzanie tenantami, moduły, billing | ✅ Gotowy |
| **Admin** | Panel administracyjny | Dashboard, statystyki, wykresy, zarządzanie tenantami | ✅ Gotowy |
| **Portal** | Portal klienta | Logowanie SMS, składanie zamówień | ✅ Gotowy |
| **Database** | Prisma service | Single database connection pool | ✅ Gotowy |
| **Cache** | Redis caching | Automatic caching, invalidation | ✅ Gotowy |
| **DataBus** | Event bus | PostgreSQL LISTEN/NOTIFY, event routing | ✅ Gotowy |
| **EntityRegistry** | Extensible entities | Module hooks, dynamic fields | ✅ Gotowy |

### Frontend (Next.js) - Routes

| Route | Opis | Auth | Layout |
|-------|------|------|--------|
| `/` | Marketing homepage | Public | - |
| `/login` | Login page | Public | - |
| `/onboarding` | Pierwszy setup po rejestracji | Public | - |
| `/tenant/[slug]` | Branded landing page | Public | - |
| `/dashboard` | Dashboard główny | Required | Dashboard |
| `/customers` | Lista klientów | Required | Dashboard |
| `/customers/[id]` | Szczegóły klienta | Required | Dashboard |
| `/products` | Produkty | Required | Dashboard |
| `/orders` | Zamówienia | Required | Dashboard |
| `/quotes` | Wyceny | Required | Dashboard |
| `/inventory` | Magazyn | Required | Dashboard |
| `/notifications` | Powiadomienia | Required | Dashboard |
| `/reports` | Raporty | Required | Dashboard |
| `/settings` | Ustawienia | Required | Dashboard |
| `/settings/modules` | Zarządzanie modułami | Required | Dashboard |
| `/settings/ai` | Konfiguracja AI | Required | Dashboard |
| `/settings/workflows` | Workflow automation | Required | Dashboard |
| **ADMIN PANEL** | | | |
| `/admin` | Redirect → `/admin/dashboard` | Admin | Admin |
| `/admin/dashboard` | Dashboard admina (stats + charts) | Admin | Admin |
| `/admin/tenants` | Lista wszystkich tenantów | Admin | Admin |
| `/admin/tenants/[id]` | Szczegóły tenanta + moduły | Admin | Admin |
| `/admin/modules` | Katalog wszystkich modułów | Admin | Admin |
| **PORTAL KLIENTA** | | | |
| `/portal/login` | Login klienta (SMS) | Public | Portal |
| `/portal/orders` | Zamówienia klienta | Portal Auth | Portal |
| `/portal/quotes` | Wyceny klienta | Portal Auth | Portal |
| `/portal/new-order` | Nowe zamówienie | Portal Auth | Portal |

---

## Admin Panel

### Dashboard admina (`/admin/dashboard`)

Panel administracyjny platformy dostępny pod adresem `https://dockpulse.com/admin/dashboard`.

#### Funkcjonalności:

1. **Statystyki platformy (Key Metrics)**
   - **Tenanci**: Total, Active (login w ostatnich 30 dni), Trial, Suspended
   - **Użytkownicy**: Total, Active (login w ostatnich 30 dni)
   - **Przychody**:
     - MRR (Monthly Recurring Revenue) - suma cen aktywnych modułów
     - ARR (Annual Recurring Revenue) - MRR × 12
     - Growth % - wzrost miesiąc do miesiąca

2. **Wykresy (Charts)** - **✅ NOWE!**
   - **Wzrost liczby tenantów** (ostatnie 12 miesięcy):
     - ComposedChart z Recharts
     - Area chart - łączna liczba tenantów
     - Bar chart - nowi tenanci w danym miesiącu
   - **Wzrost MRR** (ostatnie 12 miesięcy):
     - LineChart z dual Y-axes
     - Linia fioletowa - wartość MRR w PLN
     - Linia zielona - wzrost % miesiąc do miesiąca

3. **Najpopularniejsze moduły** (Top 5)
   - Ranking modułów według liczby instalacji
   - Liczba instalacji per moduł

4. **Ostatnio dodani tenanci** (5 najnowszych)
   - Nazwa, slug, plan, data utworzenia
   - Kliknięcie → przejście do szczegółów tenanta

5. **Alerty problemów** (Issues Alert)
   - Zawieszeni tenanci (suspended)
   - Nieudane płatności (failed payments)
   - Wygasłe trial periods (expired trials > 14 dni)

6. **Rozkład statusów tenantów**
   - Aktywni (zielony)
   - Trial (niebieski)
   - Zawieszeni (czerwony)
   - Razem (szary)

#### API Endpoints dla dashboardu:

```
GET /api/admin/stats
```

**Response**:
```json
{
  "tenants": {
    "total": 3,
    "active": 2,
    "trial": 1,
    "suspended": 0,
    "inactive": 1,
    "byPlan": {
      "FREE": 3
    }
  },
  "users": {
    "total": 5,
    "active": 3
  },
  "revenue": {
    "mrr": 0,
    "arr": 0,
    "growth": 15.5
  },
  "modules": [
    {
      "code": "CRM",
      "name": "Customer Management",
      "installations": 3
    },
    {
      "code": "ORDERS",
      "name": "Order Management",
      "installations": 2
    }
  ],
  "recentTenants": [
    {
      "id": "uuid-123",
      "name": "ONET",
      "slug": "onet",
      "createdAt": "2026-01-01T10:00:00Z",
      "plan": "FREE"
    }
  ],
  "issues": {
    "suspendedTenants": 0,
    "failedPayments": 0,
    "expiredTrials": 1
  },
  "charts": {
    "tenantsOverTime": [
      {
        "date": "sty 2025",
        "total": 1,
        "new": 1
      },
      {
        "date": "lut 2025",
        "total": 2,
        "new": 1
      },
      // ... 12 miesięcy
    ],
    "mrrGrowth": [
      {
        "date": "sty 2025",
        "mrr": 0,
        "growth": 0
      },
      {
        "date": "lut 2025",
        "mrr": 0,
        "growth": 0
      },
      // ... 12 miesięcy
    ]
  }
}
```

### Zarządzanie tenantami (`/admin/tenants`)

Lista wszystkich tenantów z możliwością:
- Podglądu szczegółów
- Zarządzania modułami (install/uninstall)
- Tworzenia nowych tenantów

#### Szczegóły tenanta (`/admin/tenants/[id]`)

- Podstawowe informacje (nazwa, slug, data utworzenia)
- Lista użytkowników
- **Zainstalowane moduły**:
  - Lista aktywnych modułów
  - Toggle enable/disable
  - Data instalacji
- **Dostępne moduły**:
  - Katalog modułów do zainstalowania
  - Instalacja jednym klikiem
- **Ostatnie wydarzenia** (EventLog)

### Katalog modułów (`/admin/modules`)

Lista wszystkich dostępnych modułów w systemie (z `MODULE_REGISTRY`):
- Nazwa, opis, kategoria
- Cena (jeśli płatny)
- Liczba instalacji
- Features list
- Dependencies
- Status (active/inactive)

---

## API Endpoints (kompletna lista)

### Auth (`/api/auth`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| POST | `/auth/login` | Logowanie (email + password) | Public |
| POST | `/auth/register` | Rejestracja nowego użytkownika | Public |
| POST | `/auth/refresh` | Odświeżenie access token (refresh token) | Public |
| POST | `/auth/logout` | Wylogowanie (invalidacja refresh token) | Required |
| GET | `/auth/me` | Pobierz dane zalogowanego użytkownika | Required |

**Request** (`POST /auth/login`):
```json
{
  "email": "admin@onet.pl",
  "password": "password123"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid-123",
    "email": "admin@onet.pl",
    "name": "Jan Kowalski",
    "role": "ADMIN"
  }
}
```

---

### Users (`/api/users`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/users` | Lista użytkowników (pagination) | Required |
| POST | `/users` | Utwórz użytkownika | Admin |
| GET | `/users/:id` | Pobierz użytkownika | Required |
| PUT | `/users/:id` | Aktualizuj użytkownika | Admin |
| DELETE | `/users/:id` | Usuń użytkownika | Admin |
| PATCH | `/users/:id/activate` | Aktywuj użytkownika | Admin |
| PATCH | `/users/:id/deactivate` | Dezaktywuj użytkownika | Admin |

---

### Customers (`/api/customers`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/customers` | Lista klientów (pagination, filters, search) | Required |
| POST | `/customers` | Utwórz klienta | Required |
| GET | `/customers/:id` | Pobierz klienta | Required |
| PUT | `/customers/:id` | Aktualizuj klienta | Required |
| DELETE | `/customers/:id` | Usuń klienta | Admin |
| GET | `/customers/:id/orders` | Zamówienia klienta | Required |
| GET | `/customers/:id/quotes` | Wyceny klienta | Required |

**Query params** (`GET /customers`):
```
?page=1&limit=20&search=onet&tag=vip&sortBy=createdAt&sortOrder=desc
```

---

### Products (`/api/products`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/products` | Lista produktów | Required |
| POST | `/products` | Utwórz produkt | Required |
| GET | `/products/:id` | Pobierz produkt | Required |
| PUT | `/products/:id` | Aktualizuj produkt | Required |
| DELETE | `/products/:id` | Usuń produkt | Admin |
| GET | `/products/:id/stock` | Stan magazynowy produktu | Required |

---

### Orders (`/api/orders`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/orders` | Lista zamówień | Required |
| POST | `/orders` | Utwórz zamówienie | Required |
| GET | `/orders/:id` | Pobierz zamówienie | Required |
| PUT | `/orders/:id` | Aktualizuj zamówienie | Required |
| DELETE | `/orders/:id` | Usuń zamówienie | Admin |
| PATCH | `/orders/:id/status` | Zmień status zamówienia | Required |
| GET | `/orders/:id/history` | Historia zmian zamówienia | Required |
| POST | `/orders/:id/items` | Dodaj pozycję do zamówienia | Required |
| PUT | `/orders/:id/items/:itemId` | Aktualizuj pozycję | Required |
| DELETE | `/orders/:id/items/:itemId` | Usuń pozycję | Required |

**Statusy zamówienia**:
- `DRAFT` - szkic
- `CONFIRMED` - potwierdzone
- `IN_PRODUCTION` - w produkcji
- `READY` - gotowe
- `SHIPPED` - wysłane
- `DELIVERED` - dostarczone
- `CANCELLED` - anulowane

---

### Quotes (`/api/quotes`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/quotes` | Lista wycen | Required |
| POST | `/quotes` | Utwórz wycenę | Required |
| GET | `/quotes/:id` | Pobierz wycenę | Required |
| PUT | `/quotes/:id` | Aktualizuj wycenę | Required |
| DELETE | `/quotes/:id` | Usuń wycenę | Admin |
| PATCH | `/quotes/:id/send` | Wyślij wycenę (email/SMS) | Required |
| POST | `/quotes/:id/convert` | Konwertuj wycenę na zamówienie | Required |
| GET | `/quotes/:id/pdf` | Pobierz PDF wyceny | Required |

---

### Inventory (`/api/inventory`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/inventory` | Stany magazynowe | Required |
| GET | `/inventory/low-stock` | Produkty z niskim stanem | Required |
| POST | `/inventory/adjust` | Korekta stanu magazynowego | Required |
| GET | `/inventory/history` | Historia ruchów magazynowych | Required |

---

### Warehouse (`/api/warehouse`) - Moduł @stock

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/warehouse/locations` | Lista lokalizacji magazynowych | Required |
| POST | `/warehouse/locations` | Utwórz lokalizację | Admin |
| GET | `/warehouse/stock-movements` | Historia przesunięć | Required |
| POST | `/warehouse/stock-movements` | Przesunięcie międzymagazynowe | Required |
| GET | `/warehouse/batches` | Lista partii | Required |
| POST | `/warehouse/batches` | Utwórz partię | Required |

---

### Invoicing (`/api/invoicing`) - Moduł @invoicing

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/invoicing/invoices` | Lista faktur | Required |
| POST | `/invoicing/invoices` | Utwórz fakturę | Required |
| GET | `/invoicing/invoices/:id` | Pobierz fakturę | Required |
| GET | `/invoicing/invoices/:id/pdf` | Pobierz PDF faktury | Required |
| POST | `/invoicing/invoices/:id/send` | Wyślij fakturę (email) | Required |

---

### Calendar (`/api/calendar`) - Moduł @calendar

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/calendar/events` | Lista wydarzeń | Required |
| POST | `/calendar/events` | Utwórz wydarzenie | Required |
| GET | `/calendar/events/:id` | Pobierz wydarzenie | Required |
| PUT | `/calendar/events/:id` | Aktualizuj wydarzenie | Required |
| DELETE | `/calendar/events/:id` | Usuń wydarzenie | Required |

---

### Webhooks (`/api/webhooks`) - Moduł @webhooks

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/webhooks/endpoints` | Lista endpoint'ów webhook | Required |
| POST | `/webhooks/endpoints` | Utwórz endpoint webhook | Admin |
| GET | `/webhooks/deliveries` | Historia wysyłek webhook | Required |

---

### Branding (`/api/branding`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| POST | `/branding/extract` | Ekstrakcja brandingu z URL | Required |
| GET | `/branding/preview` | Preview brandingu przed zapisem | Public |
| PUT | `/branding/save` | Zapisz branding do tenanta | Admin |

**Request** (`POST /branding/extract`):
```json
{
  "websiteUrl": "https://onet.pl"
}
```

**Response**:
```json
{
  "logoUrl": "https://onet.pl/logo.png",
  "colors": {
    "primary": "#FF5733",
    "secondary": "#3366FF",
    "accent": "#FFC300"
  },
  "companyData": {
    "name": "Onet Sp. z o.o.",
    "nip": "1234567890",
    "address": "ul. Przykładowa 1, 00-001 Warszawa"
  }
}
```

---

### AI (`/api/ai`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/ai/models` | Lista dostępnych modeli AI | Public |
| POST | `/ai/suggest-config` | Sugestie konfiguracji dla tenanta | Required |
| POST | `/ai/chat` | Chat z asystentem AI | Required |

---

### Notifications (`/api/notifications`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/notifications` | Lista powiadomień użytkownika | Required |
| POST | `/notifications/mark-read` | Oznacz jako przeczytane | Required |
| DELETE | `/notifications/:id` | Usuń powiadomienie | Required |

---

### Reports (`/api/reports`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/reports/sales` | Raport sprzedaży | Required |
| GET | `/reports/inventory` | Raport magazynowy | Required |
| GET | `/reports/customers` | Raport klientów | Required |
| POST | `/reports/export` | Eksport raportu (CSV/PDF) | Required |

---

### Settings (`/api/settings`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/settings` | Ustawienia tenanta | Required |
| PUT | `/settings` | Aktualizuj ustawienia | Admin |
| GET | `/settings/modules` | Lista modułów z konfiguracją | Required |

---

### Platform (`/api/platform`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| POST | `/platform/tenants/register` | Rejestracja nowego tenanta | Public |
| GET | `/platform/tenants/check` | Sprawdź dostępność slug | Public |
| POST | `/platform/auth/login` | Login do platform admin | Public |
| GET | `/platform/modules/available` | Lista wszystkich modułów | Public |
| GET | `/platform/tenants/:slug` | Dane tenanta (public data) | Public |
| GET | `/platform/tenants/:slug/modules` | Aktywne moduły tenanta | Public |
| POST | `/platform/tenants/:id/modules` | Aktywuj/dezaktywuj moduł | Admin |

**Rejestracja tenanta** (`POST /platform/tenants/register`):
```json
{
  "companyName": "ONET Sp. z o.o.",
  "slug": "onet",
  "template": "services",
  "websiteUrl": "https://onet.pl",
  "adminName": "Jan Kowalski",
  "adminEmail": "jan@onet.pl",
  "adminPhone": "+48 123 456 789"
}
```

---

### Admin Panel (`/api/admin`) - ⭐ NOWE!

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/admin/stats` | Statystyki platformy + wykresy | **⚠️ Tymczasowo PUBLIC** |
| GET | `/admin/tenants` | Lista wszystkich tenantów | Admin |
| GET | `/admin/tenants/:id` | Szczegóły tenanta | Admin |
| POST | `/admin/tenants` | Utwórz tenanta | Admin |
| GET | `/admin/modules` | Katalog modułów | Admin |
| POST | `/admin/tenants/:tenantId/modules/:moduleCode` | Instaluj moduł dla tenanta | Admin |
| DELETE | `/admin/tenants/:tenantId/modules/:moduleCode` | Odinstaluj moduł | Admin |

**⚠️ WAŻNE**: Endpoint `/admin/stats` jest **tymczasowo PUBLIC** (używa `@Public()` decorator) dla celów testowania wykresów. W produkcji należy dodać autentykację Platform Admin!

---

### Portal (`/api/portal`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| POST | `/portal/auth/send-code` | Wyślij kod SMS do logowania | Public |
| POST | `/portal/auth/verify-code` | Weryfikuj kod SMS | Public |
| GET | `/portal/orders` | Zamówienia klienta | Portal Auth |
| POST | `/portal/orders` | Nowe zamówienie przez portal | Portal Auth |
| GET | `/portal/quotes` | Wyceny klienta | Portal Auth |

---

### Health (`/api/health`)

| Method | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/health` | Health check (database, cache, storage) | Public |

**Response**:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "cache": { "status": "up" }
  },
  "details": {
    "database": { "status": "up" },
    "cache": { "status": "up" }
  }
}
```

---

## Instalacja i uruchomienie

### Prerequisites

- **Node.js 20 LTS** (recommended)
- **PostgreSQL 15+**
- **Redis 7+**
- **pnpm 8+** (`npm install -g pnpm`)
- **Docker** (opcjonalnie dla local development)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/aplikantai/dockpulse.git
cd dockpulse

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit .env files with your database credentials

# 4. Start databases (Docker)
docker compose up -d postgres redis

# Lub zainstaluj PostgreSQL i Redis lokalnie

# 5. Generate Prisma client
cd packages/database
npx prisma generate

# 6. Run migrations
npx prisma migrate dev

# 7. Seed initial data (optional)
cd ../../
pnpm db:seed

# 8. Start development servers
pnpm dev

# API: http://localhost:3003
# Web: http://localhost:3000
# Swagger docs: http://localhost:3003/api/docs
```

### Environment Variables

**API** (`apps/api/.env`):
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dockpulse?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# OpenRouter AI
OPENROUTER_API_KEY="sk-or-v1-..."

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@dockpulse.com"

# Platform Admin
PLATFORM_ADMIN_EMAILS="admin@dockpulse.com,bartosz@dockpulse.com"

# Server
PORT=3003
NODE_ENV=development
```

**Web** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3003
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment na VPS

Pełna instrukcja deployment na VPS (Ubuntu 22.04) dostępna w skrypcie `install_server.sh`.

### Quick deployment

```bash
# Na serwerze VPS (jako root)
curl -fsSL https://raw.githubusercontent.com/aplikantai/dockpulse/main/scripts/install_server.sh -o install_server.sh
chmod +x install_server.sh
./install_server.sh
```

### Co robi skrypt:

1. ✅ Instaluje Node.js 20, pnpm, PostgreSQL 15, Redis, Nginx, Certbot
2. ✅ Klonuje repozytorium z GitHub
3. ✅ Tworzy bazę danych PostgreSQL (`dockpulse_platform`)
4. ✅ Ustawia zmienne środowiskowe w `.env`
5. ✅ Instaluje dependencies (`pnpm install`)
6. ✅ Generuje Prisma client + migracje
7. ✅ Buduje aplikacje (`pnpm build`)
8. ✅ Konfiguruje PM2 (auto-restart)
9. ✅ Konfiguruje Nginx (reverse proxy)
10. ✅ Generuje SSL wildcard dla `*.dockpulse.com` (Certbot)
11. ✅ Ustawia auto-renewal SSL
12. ✅ Uruchamia aplikacje

### Po deployment sprawdź:

```bash
# Status aplikacji
pm2 status

# Logi
pm2 logs dockpulse-api
pm2 logs dockpulse-web

# Testy
curl https://dockpulse.com/health
curl https://dockpulse.com/api/health
```

### DNS Configuration

Skonfiguruj DNS u swojego providera:

```
A       @                 159.89.105.123
A       *                 159.89.105.123
CNAME   www               dockpulse.com
```

Gdzie `159.89.105.123` to IP twojego VPS.

### Nginx Configuration

Plik: `/etc/nginx/sites-available/dockpulse`

```nginx
# API Backend
server {
    listen 443 ssl http2;
    server_name dockpulse.com *.dockpulse.com;

    ssl_certificate /etc/letsencrypt/live/dockpulse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dockpulse.com/privkey.pem;

    # API routes
    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name dockpulse.com *.dockpulse.com;
    return 301 https://$host$request_uri;
}
```

### PM2 Configuration

PM2 zarządza procesami aplikacji:

```bash
# Lista procesów
pm2 list

# Restart
pm2 restart dockpulse-api
pm2 restart dockpulse-web

# Logi
pm2 logs dockpulse-api --lines 100

# Monitorowanie
pm2 monit

# Zapisz konfigurację (auto-start po reboot)
pm2 save
pm2 startup
```

---

## Architektura modułowa

### MODULE_REGISTRY - Serce systemu

**Lokalizacja**: `/apps/api/src/modules/platform/module-registry.ts`

Centralny rejestr definiuje wszystkie moduły dostępne w platformie.

```typescript
export enum ModuleCode {
  // CORE (darmowe)
  CRM = 'CRM',
  ORDERS = 'ORDERS',
  PRODUCTS = 'PRODUCTS',

  // ADDON (płatne)
  INVENTORY = 'INVENTORY',
  QUOTES = 'QUOTES',
  INVOICES = 'INVOICES',
  REPORTS = 'REPORTS',
  STOCK = 'STOCK',
  CALENDAR = 'CALENDAR',

  // PREMIUM
  PRODUCTION = 'PRODUCTION',
  ANALYTICS = 'ANALYTICS',

  // ENTERPRISE
  WEBHOOKS = 'WEBHOOKS',
  API_ACCESS = 'API_ACCESS',
}

export const MODULE_REGISTRY: Record<ModuleCode, ModuleDefinition> = {
  [ModuleCode.CRM]: {
    code: ModuleCode.CRM,
    name: 'Customer Management',
    namePl: 'Zarządzanie klientami',
    description: 'Complete CRM with contacts, tags, portal access',
    descriptionPl: 'Kompletny CRM z kontaktami, tagami, dostępem do portalu',
    icon: 'Users',  // Lucide React icon name
    category: ModuleCategory.CORE,
    price: null,  // darmowy
    isActive: true,
    routes: ['/customers', '/customers/[id]'],
    apiEndpoints: [
      'GET /api/customers',
      'POST /api/customers',
      'GET /api/customers/:id',
      'PUT /api/customers/:id',
      'DELETE /api/customers/:id',
    ],
    dependencies: [],  // brak zależności
    features: [
      'Lista klientów z paginacją',
      'Dodawanie/edycja klientów',
      'Tagi i segmentacja',
      'Portal klienta',
      'Historia zamówień',
    ],
  },

  [ModuleCode.STOCK]: {
    code: ModuleCode.STOCK,
    name: 'Advanced Stock Management',
    namePl: 'Zaawansowany magazyn',
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
      'GET /api/warehouse/batches',
    ],
    dependencies: [ModuleCode.PRODUCTS],  // wymaga PRODUCTS
    features: [
      'Wiele lokalizacji magazynowych',
      'Zarządzanie partiami',
      'Daty ważności produktów',
      'Transfer między lokalizacjami',
      'Powiadomienia o niskich stanach',
    ],
  },

  // ... pozostałe moduły
};
```

### Schemat bazy danych (Prisma)

**Lokalizacja**: `/packages/database/prisma/schema.prisma`

#### Tenant

```prisma
model Tenant {
  id        String   @id @default(uuid())
  slug      String   @unique  // np. "onet"
  name      String

  // Branding
  branding  Json?    // { logoUrl, colors: { primary, secondary }, ... }

  // Relacje
  modules   TenantModule[]
  users     User[]
  customers Customer[]
  products  Product[]
  orders    Order[]
  quotes    Quote[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
}
```

#### TenantModule

```prisma
model TenantModule {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  moduleCode  String   // Z ModuleCode enum (np. "CRM", "ORDERS")
  isEnabled   Boolean  @default(true)
  config      Json?    // Opcjonalna konfiguracja modułu

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, moduleCode])
  @@index([tenantId])
  @@index([moduleCode])
}
```

### Flow danych

```
┌─────────────────────────────────────────────────┐
│ 1. MODULE_REGISTRY (źródło prawdy)             │
│    /apps/api/src/modules/platform/             │
│       module-registry.ts                        │
│    - 11 modułów zdefiniowanych                  │
│    - Kategorie, ceny, zależności                │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 2. Backend API                                  │
│    GET /api/platform/modules/available          │
│    → Zwraca wszystkie moduły                    │
│                                                  │
│    GET /api/platform/tenants/{slug}/modules     │
│    → Zwraca aktywne moduły tenanta              │
│    → Łączy z MODULE_REGISTRY                    │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 3. Baza danych (tenant_modules)                 │
│    ┌────────┬─────┬─────────┬────────┐        │
│    │tenantId│code │isEnabled│config  │        │
│    ├────────┼─────┼─────────┼────────┤        │
│    │uuid-123│CRM  │true     │{}      │        │
│    │uuid-123│STOCK│true     │{}      │        │
│    └────────┴─────┴─────────┴────────┘        │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 4. Frontend Sidebar                             │
│    /apps/web/src/components/layout/Sidebar.tsx │
│    - fetch(`/api/platform/tenants/onet/modules`)│
│    - Mapuje ikony: ICON_MAP[icon]              │
│    - Renderuje NavLink                          │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 5. UI Renderuje moduły                          │
│    - Sidebar: "Zarządzanie klientami" + Users   │
│    - Route: /customers                          │
│    - Settings: Toggle ON/OFF                    │
└─────────────────────────────────────────────────┘
```

---

## Dodawanie nowego modułu

### KROK 1: MODULE_REGISTRY

Dodaj kod modułu do enuma i definicję do rejestru:

```typescript
// apps/api/src/modules/platform/module-registry.ts

export enum ModuleCode {
  // ... istniejące
  WAREHOUSE_ADVANCED = 'WAREHOUSE_ADVANCED',  // ← NOWY
}

export const MODULE_REGISTRY: Record<ModuleCode, ModuleDefinition> = {
  // ... istniejące

  [ModuleCode.WAREHOUSE_ADVANCED]: {
    code: ModuleCode.WAREHOUSE_ADVANCED,
    name: 'Advanced Warehouse',
    namePl: 'Magazyn rozszerzony',
    description: 'Multi-location, batch tracking, expiry dates',
    descriptionPl: 'Wielolokalizacyjny, partie, daty ważności',
    icon: 'Warehouse',
    category: ModuleCategory.ADDON,
    price: 299,
    isActive: true,
    routes: ['/warehouse-advanced', '/warehouse-advanced/locations'],
    apiEndpoints: [
      'GET /api/warehouse-advanced/locations',
      'POST /api/warehouse-advanced/stock-movements',
    ],
    dependencies: [ModuleCode.PRODUCTS, ModuleCode.INVENTORY],
    features: [
      'Wiele lokalizacji',
      'Zarządzanie partiami',
      'Daty ważności',
      'Transfer międzymagazynowy',
    ],
  },
};
```

### KROK 2: Backend Controller (opcjonalnie)

```bash
cd apps/api/src/modules
mkdir warehouse-advanced
cd warehouse-advanced
```

```typescript
// warehouse-advanced.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../tenant/decorators/current-tenant.decorator';

@Controller('warehouse-advanced')
@UseGuards(JwtAuthGuard)
export class WarehouseAdvancedController {
  @Get('locations')
  async getLocations(@CurrentTenant() tenantId: string) {
    // Implementacja
  }

  @Post('stock-movements')
  async createStockMovement(@CurrentTenant() tenantId: string, @Body() dto: any) {
    // Implementacja
  }
}
```

Dodaj do `AppModule`.

### KROK 3: Frontend Ikona

```typescript
// apps/web/src/components/layout/Sidebar.tsx
import { Warehouse } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType> = {
  // ... istniejące
  Warehouse,  // ← DODAJ
};
```

### KROK 4: Frontend Page

```bash
mkdir -p apps/web/src/app/(dashboard)/warehouse-advanced
```

```typescript
// apps/web/src/app/(dashboard)/warehouse-advanced/page.tsx
'use client';

export default function WarehouseAdvancedPage() {
  return (
    <div>
      <h1>Magazyn rozszerzony</h1>
      {/* Implementacja */}
    </div>
  );
}
```

### KROK 5: Prisma Schema (jeśli potrzeba)

```prisma
model WarehouseLocation {
  id        String  @id @default(uuid())
  tenantId  String
  tenant    Tenant  @relation(fields: [tenantId], references: [id])

  name      String
  code      String
  address   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, code])
}

// Dodaj relację do Tenant
model Tenant {
  // ... istniejące
  warehouseLocations WarehouseLocation[]
}
```

Migracja:
```bash
cd packages/database
npx prisma migrate dev --name add_warehouse_advanced
npx prisma generate
```

### KROK 6: Build + Restart

```bash
pnpm --filter @dockpulse/api build
pnpm --filter @dockpulse/web build
pm2 restart dockpulse-api dockpulse-web
```

### KROK 7: Aktywacja

**Panel Admin**: `/admin/tenants/[id]` → "Install Module" → wybierz `WAREHOUSE_ADVANCED`

**LUB SQL**:
```sql
INSERT INTO "tenant_modules" (id, "tenantId", "moduleCode", "isEnabled")
VALUES (
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'onet'),
  'WAREHOUSE_ADVANCED',
  true
);
```

**GOTOWE!** Moduł pojawi się w sidebar i będzie dostępny.

---

## Baza danych (Prisma Schema)

### Core Models

```prisma
// Tenant (główna jednostka izolacji)
model Tenant {
  id        String   @id @default(uuid())
  slug      String   @unique
  name      String
  branding  Json?
  settings  Json?

  modules   TenantModule[]
  users     User[]
  customers Customer[]
  products  Product[]
  orders    Order[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Moduły włączone dla tenanta
model TenantModule {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  moduleCode  String
  isEnabled   Boolean  @default(true)
  config      Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, moduleCode])
}

// Użytkownicy
model User {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  email     String
  password  String
  name      String?
  role      String   // ADMIN, MANAGER, EMPLOYEE
  isActive  Boolean  @default(true)
  lastLogin DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, email])
}

// Klienci
model Customer {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  name      String
  email     String?
  phone     String?
  nip       String?
  address   String?
  tags      String[] @default([])

  orders    Order[]
  quotes    Quote[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
}

// Produkty
model Product {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  name        String
  sku         String?
  ean         String?
  description String?

  priceNet    Decimal
  priceGross  Decimal
  vat         Decimal
  unit        String   @default("szt")

  orderItems  OrderItem[]
  quoteItems  QuoteItem[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, sku])
  @@index([tenantId])
}

// Zamówienia
model Order {
  id         String   @id @default(uuid())
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id])

  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])

  orderNumber String
  status      String   @default("DRAFT")

  totalNet    Decimal
  totalGross  Decimal

  items       OrderItem[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, orderNumber])
  @@index([tenantId])
  @@index([customerId])
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])

  productId String
  product   Product @relation(fields: [productId], references: [id])

  quantity  Decimal
  priceNet  Decimal
  priceGross Decimal

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// EventLog (audyt)
model EventLog {
  id         String   @id @default(uuid())
  tenantId   String

  eventType  String   // CREATE, UPDATE, DELETE, STATUS_CHANGE
  entityType String   // Order, Customer, Product, ...
  entityId   String

  userId     String?
  metadata   Json?

  createdAt  DateTime @default(now())

  @@index([tenantId])
  @@index([entityType, entityId])
}
```

### Migracje

```bash
# Utwórz nową migrację
cd packages/database
npx prisma migrate dev --name add_new_feature

# Deploy migracji na produkcję
npx prisma migrate deploy

# Generuj Prisma Client
npx prisma generate

# Reset bazy (DEV ONLY!)
npx prisma migrate reset
```

---

## Multi-tenancy

### TenantMiddleware

**Lokalizacja**: `/apps/api/src/modules/tenant/tenant.middleware.ts`

Middleware automatycznie wykrywa tenanta z:
1. Header `x-tenant-id`
2. Subdomena (np. `onet.dockpulse.com` → `onet`)
3. Query param `?tenant=onet` (dev mode)

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.baseUrl + (req.path || req.url);

    // Skip dla public endpoints
    if (
      path.includes('/health') ||
      path.includes('/platform/tenants/register') ||
      path.includes('/admin')  // Admin panel nie wymaga x-tenant-id
    ) {
      return next();
    }

    // Wykryj tenanta
    const tenantSlug = this.extractTenantSlug(req);
    if (!tenantSlug) {
      throw new BadRequestException('Missing x-tenant-id header');
    }

    // Pobierz tenanta z bazy
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantSlug}' not found`);
    }

    // Dołącz do request
    req.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      branding: tenant.branding,
    };

    next();
  }

  private extractTenantSlug(req: Request): string | undefined {
    // Priority 1: Header
    const headerTenant = req.headers['x-tenant-id'];
    if (headerTenant) return headerTenant as string;

    // Priority 2: Subdomain
    const host = req.headers.host;
    if (host && !host.startsWith('localhost')) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'admin') {
        return subdomain;
      }
    }

    // Priority 3: Query param (dev)
    const queryTenant = req.query.tenant;
    if (queryTenant) return queryTenant as string;

    return undefined;
  }
}
```

### Decorator `@CurrentTenant()`

```typescript
// apps/api/src/modules/tenant/decorators/current-tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant?.id;  // Zwraca tenantId
  },
);
```

**Użycie**:
```typescript
@Controller('customers')
export class CustomersController {
  @Get()
  async getCustomers(@CurrentTenant() tenantId: string) {
    // Pobierz klientów tylko dla tego tenanta
    return this.customersService.findAll(tenantId);
  }
}
```

---

## Auto-Branding

System automatycznie pobiera branding z URL firmy.

### Flow

1. **Użytkownik podaje `websiteUrl`** (np. `https://onet.pl`)
2. **Backend pobiera HTML strony**
3. **Ekstrakcja logo**:
   - `<link rel="icon">`
   - `<meta property="og:image">`
   - `<img>` z alt="logo"
4. **Ekstrakcja kolorów**:
   - Analiza CSS variables (`--primary-color`)
   - Ekstrakcja z logo (dominant colors)
5. **Preview** - zwrot danych do frontendu
6. **Zatwierdzenie** - zapis do `Tenant.branding`

### Endpoint

```
POST /api/branding/extract
{
  "websiteUrl": "https://onet.pl"
}

Response:
{
  "logoUrl": "https://onet.pl/logo.png",
  "colors": {
    "primary": "#FF5733",
    "secondary": "#3366FF"
  },
  "companyData": {
    "name": "Onet Sp. z o.o."
  }
}
```

### Rendering w UI

```typescript
// Pobierz branding z TenantContext
const { tenant } = useTenant();

// Zastosuj kolory
<div style={{
  backgroundColor: tenant.branding?.colors?.primary,
  color: tenant.branding?.colors?.secondary
}}>
  {tenant.branding?.logoUrl && (
    <img src={tenant.branding.logoUrl} alt="Logo" />
  )}
</div>
```

---

## Portal klienta

Portal dla klientów B2B dostępny pod `/portal`.

### Logowanie przez SMS

```
POST /api/portal/auth/send-code
{
  "phone": "+48 123 456 789"
}

→ Wysyła SMS z kodem 6-cyfrowym

POST /api/portal/auth/verify-code
{
  "phone": "+48 123 456 789",
  "code": "123456"
}

→ Zwraca JWT token dla klienta
```

### Funkcjonalności portalu

- ✅ Przeglądanie zamówień
- ✅ Przeglądanie wycen
- ✅ Składanie nowego zamówienia
- ✅ Akceptacja wyceny
- 🔜 Historia płatności
- 🔜 Pobieranie dokumentów (PDF)

---

## TODO / Co nie działa

### ⚠️ KRYTYCZNE (trzeba naprawić przed produkcją)

1. **Autentykacja Admin Panel**
   - ❌ Endpoint `/api/admin/stats` jest **PUBLIC** (używa `@Public()`)
   - ❌ Brak login page dla admina
   - ❌ Brak sprawdzania roli `PLATFORM_ADMIN`
   - **TODO**: Zaimplementować admin login + JWT auth

2. **Trial Periods**
   - ❌ Brak pola `trialEndsAt` w modelu `Tenant`
   - ❌ Brak pola `plan` w modelu `Tenant`
   - ❌ Brak CRON job do wyłączania expired trials
   - **TODO**: Dodać Prisma migration + billing CRON

3. **Billing**
   - ❌ Brak modeli `Subscription`, `Invoice`, `InvoiceItem`
   - ❌ Brak integracji z payment gateway (Stripe/Przelewy24)
   - ❌ Brak generowania faktur PDF
   - **TODO**: Zaimplementować cały system billing

4. **Dedicated Modules**
   - ❌ Brak pola `customPrice` w `TenantModule`
   - ❌ Brak pola `isDedicated` / `visibleToOthers`
   - **TODO**: Rozszerzyć model + panel admin

5. **Email Notifications**
   - ❌ Brak email templates (trial expired, invoice, welcome)
   - ❌ Resend API key nie ustawiony w production
   - **TODO**: Dodać email templates + konfiguracja

### 🔶 WAŻNE (można zrobić później)

6. **SMS Gateway**
   - ❌ Brak integracji z SMS provider (Twilio/SMSApi)
   - ❌ Portal login działa tylko z mock kodem
   - **TODO**: Integracja z SMS gateway

7. **Webhooks Delivery Retry**
   - ❌ Brak retry logic dla failed webhooks
   - ❌ Brak exponential backoff
   - **TODO**: Queue system (BullMQ) dla webhooks

8. **AI Asystent**
   - ❌ OpenRouter API key nie ustawiony
   - ❌ Brak UI dla chat z AI
   - **TODO**: Implementacja chat interface

9. **Reports Export**
   - ❌ CSV export działa, PDF nie
   - ❌ Brak formatowania PDF (headers, footers, logo)
   - **TODO**: PDF generator library (pdfmake/puppeteer)

10. **Storage**
    - ❌ Tylko local storage, brak S3
    - ❌ Brak limitów storage per tenant
    - ❌ Brak auto-cleanup old files
    - **TODO**: S3-compatible storage + limits

### 🟢 NICE TO HAVE (features na przyszłość)

11. **Monitoring**
    - 🔜 Grafana + Prometheus
    - 🔜 Error tracking (Sentry)
    - 🔜 Performance monitoring (APM)

12. **Tests**
    - 🔜 E2E tests (Playwright)
    - 🔜 Integration tests (backend)
    - 🔜 Unit tests coverage > 80%

13. **CI/CD**
    - 🔜 GitHub Actions workflows
    - 🔜 Automated deployments
    - 🔜 Preview deployments (Vercel/Netlify)

14. **Docker**
    - 🔜 Production Dockerfile
    - 🔜 Docker Compose dla full stack
    - 🔜 Kubernetes manifests (future)

15. **Multi-language**
    - 🔜 i18n (English, Polish)
    - 🔜 Language switcher w UI

---

## Roadmap

### Q1 2026 (Styczeń - Marzec)

- [x] ✅ Admin Panel Dashboard z wykresami (Recharts)
- [ ] 🔄 Autentykacja Admin Panel (login page + JWT)
- [ ] 🔄 Trial Periods (14 dni) + CRON job
- [ ] 🔄 Billing system (Subscription, Invoice models)
- [ ] 🔄 Payment integration (Stripe lub Przelewy24)
- [ ] 🔄 Email templates (Resend)
- [ ] 🔄 SMS gateway integration (SMSApi)

### Q2 2026 (Kwiecień - Czerwiec)

- [ ] 🔜 Dedicated Modules (custom pricing per tenant)
- [ ] 🔜 Advanced permissions (RBAC per module)
- [ ] 🔜 Webhooks delivery retry system
- [ ] 🔜 AI Chat interface w UI
- [ ] 🔜 PDF Reports (faktury, raporty sprzedaży)
- [ ] 🔜 S3-compatible storage + limits

### Q3 2026 (Lipiec - Wrzesień)

- [ ] 🔜 Monitoring (Grafana + Prometheus)
- [ ] 🔜 E2E tests (Playwright)
- [ ] 🔜 CI/CD (GitHub Actions)
- [ ] 🔜 Multi-language (i18n)
- [ ] 🔜 Mobile app (React Native)

### Q4 2026 (Październik - Grudzień)

- [ ] 🔜 Production (moduł zarządzania produkcją)
- [ ] 🔜 Analytics (zaawansowana analityka)
- [ ] 🔜 API Access (REST API dla developerów)
- [ ] 🔜 Marketplace (custom moduły od 3rd party)

---

## Autor

**Bartosz Gaca**
- Web: [bartoszgaca.pl](https://bartoszgaca.pl)
- GitHub: [github.com/gacabartosz](https://github.com/gacabartosz)
- Email: bartosz@dockpulse.com

---

## Licencja

Proprietary - All Rights Reserved

© 2026 DockPulse. Wszelkie prawa zastrzeżone.

---

## Dodatkowa dokumentacja

| Dokument | Opis |
|----------|------|
| [DEPLOYMENT-FULL.md](docs/DEPLOYMENT-FULL.md) | Pełna instrukcja deployment na VPS |
| [ARCHITEKTURA.md](docs/ARCHITEKTURA.md) | Architektura systemu |
| [API.md](docs/API.md) | Kompletna dokumentacja API |
| [SZABLONY.md](docs/SZABLONY.md) | Szablony branżowe (Usługi/Produkcja/Handel) |
| [AUTO-BRANDING.md](docs/AUTO-BRANDING.md) | System auto-brandingu |

---

**Wersja README**: 4.0
**Data ostatniej aktualizacji**: 2 Stycznia 2026
**Status**: ✅ Admin Panel Dashboard GOTOWY | ⚠️ Billing + Auth w toku
