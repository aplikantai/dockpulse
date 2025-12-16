# DockPulse SaaS

Multi-tenant SaaS platform for order management with client portal.

## Architecture

```
firma1.dockpulse.com ─┐
firma2.dockpulse.com ─┼──► ONE backend ──► ONE database (RLS)
firma3.dockpulse.com ─┘
```

## Features

- **Multi-tenancy** - Row Level Security (RLS) for data isolation
- **Secure Auth** - httpOnly cookies, refresh token rotation
- **Client Portal** - Self-service for customers
- **Audit Log** - Track all actions
- **i18n** - Polish + English support
- **RBAC** - Role-based access control per tenant

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Apply RLS policies
npx prisma db execute --file prisma/migrations/rls_policies.sql

# Seed test data
npm run db:seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Test Accounts

### Panel (Staff)
| Phone | Password | Role |
|-------|----------|------|
| +48000000001 | admin123 | OWNER |
| +48000000002 | admin123 | MANAGER |
| +48000000003 | admin123 | MEMBER |

### Portal (Clients)
| Email | Password |
|-------|----------|
| client1@example.com | client123 |
| client2@example.com | client123 |

### Tenants
- `demo.localhost:4000` (or header `X-Tenant-Slug: demo`)
- `test.localhost:4000` (or header `X-Tenant-Slug: test`)

## Project Structure

```
dockpulse/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── tenancy/      # RLS, resolve subdomain
│   │   │   ├── auth/         # httpOnly cookies, refresh
│   │   │   └── audit/        # Audit log service
│   │   ├── modules/
│   │   │   ├── orders/       # Order management
│   │   │   ├── portal/       # Client portal
│   │   │   └── audit/        # Audit API
│   │   ├── middleware/       # Auth, RBAC, rate limiting
│   │   └── infra/            # Database, storage
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # RLS policies
│   └── __tests__/            # Tenant isolation tests
│
└── frontend/
    └── src/
        ├── apps/
        │   ├── panel/        # Staff panel (admin)
        │   └── portal/       # Client portal
        └── shared/
            ├── api/          # API client with credentials
            ├── auth/         # Cookie-based auth
            ├── i18n/         # Translations (PL + EN)
            └── ui/           # UI components

## API Endpoints

### Auth (Panel)
- `POST /api/auth/login` - Login with phone
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Order details
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Change status

### Portal
- `POST /api/portal/auth/login` - Client login
- `GET /api/portal/orders` - My orders
- `POST /api/portal/orders` - Create order

### Audit
- `GET /api/audit` - Audit events (OWNER/ADMIN only)

## Security

- **RLS** - Row Level Security at database level
- **httpOnly Cookies** - Tokens not accessible via JavaScript
- **CSRF Protection** - Token validation for mutations
- **Rate Limiting** - Per tenant, not per IP
- **Audit Log** - All actions logged, PII redacted

## Development

### Run tests
```bash
cd backend
npm test
```

### Database Studio
```bash
cd backend
npm run db:studio
```

## Roadmap

See documentation files:
- `TODO_MASTER.md` - Main plan
- `TODO_ROADMAP.md` - Timeline and priorities
- `TODO_BACKEND_PR*.md` - Backend specifications
- `TODO_FRONTEND.md` - Frontend specifications
```
