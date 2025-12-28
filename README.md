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
- **AI**: asystent konfiguracji (sugestie), NIE generator kodu
- **Portal klienta**: logowanie przez telefon
- **Design**: iOS glassmorphism (blur, przezroczystosc)

---

## Struktura projektu

```
dockpulse/
├── apps/
│   ├── api/                    # NestJS Backend
│   └── web/                    # Next.js Frontend
├── packages/
│   ├── shared/                 # Shared types, utils
│   ├── ui/                     # Shared UI components
│   └── database/               # Prisma schema
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
- Docker (opcjonalnie)

### Development

```bash
# Instalacja
pnpm install

# Uruchom bazy danych
docker compose up -d postgres redis

# Migracje
pnpm db:migrate

# Seed danych
pnpm db:seed

# Dev server (API + Web)
pnpm dev
```

### Tworzenie tenanta

```bash
./scripts/create-tenant.sh --slug=acme --name="ACME Corp" --template=services
```

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
- NestJS
- PostgreSQL 15+
- Prisma ORM
- Redis (cache)
- BullMQ (queues)

### Frontend
- Next.js 14+ (App Router)
- shadcn/ui + Tailwind CSS
- React Query + Zustand
- iOS Glassmorphism design

### Infrastruktura
- Docker + Docker Compose
- Caddy (reverse proxy, wildcard SSL)
- GitHub Actions (CI/CD)

---

## Szablony branzowe

| Szablon | Branze | Moduly |
|---------|--------|--------|
| **USLUGI** | IT, marketing, konsulting | @zlecenia, @klienci, @wyceny, @harmonogram |
| **PRODUKCJA** | Przetworstwo, stolarka, meble | @zamowienia, @odbiorcy, @wyroby, @magazyn |
| **HANDEL** | Hurt, dystrybucja, e-commerce B2B | @zamowienia, @kontrahenci, @towary, @faktury |

---

## Autor

**Bartosz Gaca**
- Web: [bartoszgaca.pl](https://bartoszgaca.pl)
- GitHub: [github.com/gacabartosz](https://github.com/gacabartosz)

---

*Wersja: 2.0 | Data: Grudzien 2024*
