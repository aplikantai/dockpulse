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
├── packages/
│   ├── shared/                 # Shared types, schemas (Zod)
│   ├── ui/                     # Shared UI components
│   └── database/               # Prisma schema + client
├── docker/
├── scripts/
├── docs/
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

# Build
pnpm build

# Testy
pnpm test
```

### Tworzenie tenanta

```bash
./scripts/create-tenant.sh --slug=acme --name="ACME Corp" --template=services
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
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Instrukcja deploymentu |

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

*Wersja: 2.1 | Data: Grudzien 2024*
