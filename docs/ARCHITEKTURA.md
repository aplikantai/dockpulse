# DockPulse - Architektura Systemu

> Kompletna dokumentacja architektury multi-tenant platformy CRM/WMS

---

## 1. ARCHITEKTURA WYSOKIEGO POZIOMU

```
                                    ┌─────────────────────────────────────┐
                                    │           INTERNET                   │
                                    └──────────────┬──────────────────────┘
                                                   │
                                    ┌──────────────▼──────────────────────┐
                                    │     Caddy (Reverse Proxy)           │
                                    │   - Wildcard SSL (*.dockpulse.com)  │
                                    │   - Subdomain routing               │
                                    └──────────────┬──────────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
         ┌──────────▼──────────┐       ┌──────────▼──────────┐       ┌──────────▼──────────┐
         │   Next.js Frontend  │       │   Next.js Frontend  │       │   Next.js Frontend  │
         │   (tenant1.dock...) │       │   (tenant2.dock...) │       │   (app.dockpulse)   │
         └──────────┬──────────┘       └──────────┬──────────┘       └──────────┬──────────┘
                    │                              │                              │
                    └──────────────────────────────┼──────────────────────────────┘
                                                   │
                                    ┌──────────────▼──────────────────────┐
                                    │         NestJS API Gateway          │
                                    │   - JWT Authentication              │
                                    │   - Tenant Resolution               │
                                    │   - Rate Limiting                   │
                                    └──────────────┬──────────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
         ┌──────────▼──────────┐       ┌──────────▼──────────┐       ┌──────────▼──────────┐
         │     Event Bus       │       │       Redis         │       │      BullMQ         │
         │  (PG LISTEN/NOTIFY) │       │   (Cache/Session)   │       │   (Job Queues)      │
         └──────────┬──────────┘       └─────────────────────┘       └─────────────────────┘
                    │
                    └──────────────────────────────┬──────────────────────────────┐
                                                   │                              │
                                    ┌──────────────▼──────────┐       ┌──────────▼──────────┐
                                    │      PgBouncer          │       │   S3 Storage        │
                                    │  (Connection Pooling)   │       │   (MinIO/R2)        │
                                    └──────────────┬──────────┘       └─────────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
         ┌──────────▼──────────┐       ┌──────────▼──────────┐       ┌──────────▼──────────┐
         │  dockpulse_platform │       │ dockpulse_tenant_1  │       │ dockpulse_tenant_N  │
         │  (Shared Database)  │       │ (Isolated Database) │       │ (Isolated Database) │
         └─────────────────────┘       └─────────────────────┘       └─────────────────────┘
```

---

## 2. STRUKTURA MONOREPO

```
dockpulse/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── src/
│   │   │   ├── main.ts               # Entry point
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── modules/              # Feature modules
│   │   │   │   ├── auth/             # Autentykacja
│   │   │   │   ├── customers/        # Modul @customers
│   │   │   │   ├── orders/           # Modul @orders
│   │   │   │   ├── products/         # Modul @products
│   │   │   │   ├── quotes/           # Modul @quotes
│   │   │   │   ├── portal/           # Modul @portal
│   │   │   │   ├── settings/         # Konfiguracja tenanta
│   │   │   │   ├── notifications/    # Modul @notifications
│   │   │   │   ├── reports/          # Modul @reports
│   │   │   │   ├── ai/               # Asystent AI
│   │   │   │   └── platform/         # Zarzadzanie platforma
│   │   │   ├── common/               # Shared utilities
│   │   │   │   ├── decorators/       # Custom decorators
│   │   │   │   ├── guards/           # Auth guards
│   │   │   │   ├── interceptors/     # Logging, transform
│   │   │   │   ├── filters/          # Exception filters
│   │   │   │   └── pipes/            # Validation pipes
│   │   │   ├── database/             # Database layer
│   │   │   │   ├── migrations/       # SQL migrations
│   │   │   │   └── seeds/            # Seed data
│   │   │   └── event-bus/            # Event Bus
│   │   │       ├── event-bus.service.ts
│   │   │       ├── event-bus.module.ts
│   │   │       └── handlers/         # Event handlers
│   │   ├── test/                     # E2E tests
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                          # Next.js Frontend
│       ├── src/
│       │   ├── app/                  # App Router
│       │   │   ├── (auth)/           # Auth pages
│       │   │   │   ├── login/
│       │   │   │   └── register/
│       │   │   ├── (admin)/          # Admin panel
│       │   │   │   ├── dashboard/
│       │   │   │   ├── customers/
│       │   │   │   ├── orders/
│       │   │   │   ├── products/
│       │   │   │   └── settings/
│       │   │   ├── (portal)/         # Portal klienta
│       │   │   │   ├── dashboard/
│       │   │   │   ├── orders/
│       │   │   │   └── quotes/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/           # React components
│       │   │   ├── ui/               # shadcn/ui components
│       │   │   ├── forms/            # Form components
│       │   │   ├── tables/           # Table components
│       │   │   ├── modals/           # Modal components
│       │   │   └── layout/           # Layout components
│       │   ├── hooks/                # Custom hooks
│       │   ├── lib/                  # Utilities
│       │   ├── stores/               # Zustand stores
│       │   └── styles/               # Global styles
│       ├── public/                   # Static assets
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared types & utils
│   │   ├── src/
│   │   │   ├── types/                # TypeScript types
│   │   │   ├── constants/            # Constants
│   │   │   ├── utils/                # Utility functions
│   │   │   └── schemas/              # Zod schemas
│   │   └── package.json
│   │
│   ├── ui/                           # Shared UI components
│   │   ├── src/
│   │   │   ├── components/           # Reusable components
│   │   │   └── styles/               # Shared styles
│   │   └── package.json
│   │
│   └── database/                     # Database package
│       ├── prisma/
│       │   ├── schema.prisma         # Platform schema
│       │   └── tenant.prisma         # Tenant schema template
│       └── package.json
│
├── docker/
│   ├── docker-compose.yml            # Development
│   ├── docker-compose.prod.yml       # Production
│   ├── Dockerfile.api
│   └── Dockerfile.web
│
├── scripts/
│   ├── create-tenant.sh              # Tworzenie tenanta
│   ├── delete-tenant.sh              # Usuwanie tenanta
│   ├── backup-tenant.sh              # Backup tenanta
│   └── migrate-tenant.sh             # Migracje tenanta
│
├── docs/
│   ├── SPECYFIKACJA.md
│   ├── ARCHITEKTURA.md               # Ten plik
│   ├── API.md
│   ├── SZABLONY.md
│   └── DEPLOYMENT.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI pipeline
│       └── deploy.yml                # CD pipeline
│
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspace
├── turbo.json                        # Turborepo config
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. MULTI-TENANCY

### 3.1. Model Izolacji

```
Podejscie: Database-per-Tenant (NIE Row Level Security)

Zalety:
- Pelna izolacja danych
- Latwe usuwanie tenanta (DROP DATABASE)
- Niezalezne backupy
- Zgodnosc z RODO (prawo do bycia zapomnianym)
- Brak ryzyka wyciekow danych miedzy tenantami
- Mozliwosc roznicy wersji schematow

Wady:
- Wiecej polaczen do bazy
- Zlozonosc zarzadzania migracjami
- PgBouncer wymagany
```

### 3.2. Baza Platformy (dockpulse_platform)

```sql
-- Tabela tenantow
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,      -- subdomena
    name VARCHAR(255) NOT NULL,
    template VARCHAR(50) NOT NULL,          -- 'services' | 'production' | 'trade'
    plan_id UUID REFERENCES plans(id),
    status VARCHAR(20) DEFAULT 'active',    -- 'active' | 'suspended' | 'deleted'
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plany cenowe
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '{}',
    max_users INTEGER DEFAULT 5,
    max_customers INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Administratorzy platformy
CREATE TABLE platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rejestr modulow
CREATE TABLE module_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,       -- '@customers' | '@orders' | ...
    name VARCHAR(100) NOT NULL,
    description TEXT,
    templates TEXT[] DEFAULT '{}',          -- ktore szablony obsluguja
    default_enabled BOOLEAN DEFAULT false,
    config_schema JSONB DEFAULT '{}'
);

-- Billing
CREATE TABLE billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    plan_id UUID REFERENCES plans(id),
    amount DECIMAL(10,2),
    period_start DATE,
    period_end DATE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3. Baza Tenanta (dockpulse_tenant_{slug})

Kazdy tenant ma identyczny schemat (z mozliwoscia roznic):

```sql
-- Uzytkownicy (pracownicy tenanta)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,              -- 'admin' | 'manager' | 'employee'
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Klienci (kontrahenci tenanta)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,      -- login do portalu
    password_hash VARCHAR(255),             -- haslo do portalu
    email VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    nip VARCHAR(20),
    address JSONB DEFAULT '{}',
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    is_portal_active BOOLEAN DEFAULT true,
    portal_first_login BOOLEAN DEFAULT true, -- wymuszenie zmiany hasla
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produkty/Uslugi
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10,2),
    unit VARCHAR(20) DEFAULT 'szt',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zamowienia
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(50) UNIQUE NOT NULL,     -- ZAM-2024-001
    customer_id UUID REFERENCES customers(id),
    user_id UUID REFERENCES users(id),       -- kto obsluguje
    status VARCHAR(50) NOT NULL,
    status_history JSONB DEFAULT '[]',
    items JSONB DEFAULT '[]',               -- pozycje zamowienia
    total_amount DECIMAL(10,2),
    notes TEXT,
    delivery_date DATE,
    delivery_address JSONB DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'admin',     -- 'admin' | 'portal' | 'api'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wyceny
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft',
    items JSONB DEFAULT '[]',
    total_amount DECIMAL(10,2),
    valid_until DATE,
    notes TEXT,
    accepted_at TIMESTAMPTZ,
    order_id UUID REFERENCES orders(id),    -- utworzone zamowienie
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Log (audit trail)
CREATE TABLE event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    source_module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    payload JSONB DEFAULT '{}',
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Konfiguracja modulow tenanta
CREATE TABLE tenant_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Konfiguracja pol (widocznosc)
CREATE TABLE field_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,       -- 'customer' | 'order' | 'product'
    field_name VARCHAR(100) NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    UNIQUE(entity_type, field_name)
);

-- Triggery workflow
CREATE TABLE workflow_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,             -- 'order.new.sms_admin'
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,       -- 'order.created'
    action_type VARCHAR(50) NOT NULL,       -- 'sms' | 'email' | 'push' | 'webhook'
    action_config JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_event_log_type ON event_log(event_type);
CREATE INDEX idx_event_log_entity ON event_log(entity_type, entity_id);
```

---

## 4. EVENT BUS

### 4.1. Implementacja PostgreSQL LISTEN/NOTIFY

```typescript
// event-bus.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, Client } from 'pg';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface DockPulseEvent {
  event_id: string;
  event_type: string;
  source_module: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, any>;
  user_id: string;
  created_at: string;
}

@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private readonly channel = 'dockpulse_events';

  constructor(
    private readonly pool: Pool,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await this.client.connect();
    await this.client.query(`LISTEN ${this.channel}`);

    this.client.on('notification', (msg) => {
      if (msg.channel === this.channel && msg.payload) {
        const event: DockPulseEvent = JSON.parse(msg.payload);
        this.eventEmitter.emit(event.event_type, event);
      }
    });
  }

  async onModuleDestroy() {
    await this.client.end();
  }

  async emit(event: Omit<DockPulseEvent, 'event_id' | 'created_at'>) {
    const fullEvent: DockPulseEvent = {
      ...event,
      event_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    // 1. Log do event_log
    await this.pool.query(
      `INSERT INTO event_log (event_id, event_type, source_module, entity_type, entity_id, payload, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        fullEvent.event_id,
        fullEvent.event_type,
        fullEvent.source_module,
        fullEvent.entity_type,
        fullEvent.entity_id,
        fullEvent.payload,
        fullEvent.user_id,
      ]
    );

    // 2. NOTIFY
    await this.pool.query(
      `SELECT pg_notify($1, $2)`,
      [this.channel, JSON.stringify(fullEvent)]
    );

    return fullEvent;
  }
}
```

### 4.2. Event Handlers

```typescript
// handlers/order.handler.ts
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';
import { StockService } from '../../stock/stock.service';

@Injectable()
export class OrderEventHandler {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly stock: StockService,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: DockPulseEvent) {
    // Wyslij SMS do admina
    await this.notifications.sendSMS({
      template: 'new_order_admin',
      data: event.payload,
    });

    // Rezerwuj produkty
    if (event.payload.items) {
      await this.stock.reserve(event.payload.items);
    }
  }

  @OnEvent('order.confirmed')
  async handleOrderConfirmed(event: DockPulseEvent) {
    // Wyslij email do klienta
    await this.notifications.sendEmail({
      template: 'order_confirmed',
      to: event.payload.customer_email,
      data: event.payload,
    });
  }

  @OnEvent('order.shipped')
  async handleOrderShipped(event: DockPulseEvent) {
    // Wyslij SMS z numerem przesylki
    await this.notifications.sendSMS({
      template: 'order_shipped',
      to: event.payload.customer_phone,
      data: event.payload,
    });
  }
}
```

### 4.3. Typy Eventow

```typescript
// shared/types/events.ts
export const EVENT_TYPES = {
  // Entity CRUD
  ENTITY_CREATED: 'entity.created',
  ENTITY_UPDATED: 'entity.updated',
  ENTITY_DELETED: 'entity.deleted',

  // Orders
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_IN_PROGRESS: 'order.in_progress',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',

  // Quotes
  QUOTE_CREATED: 'quote.created',
  QUOTE_SENT: 'quote.sent',
  QUOTE_ACCEPTED: 'quote.accepted',
  QUOTE_REJECTED: 'quote.rejected',

  // Customers
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_PORTAL_LOGIN: 'customer.portal_login',

  // Stock
  STOCK_RESERVED: 'stock.reserved',
  STOCK_LOW: 'stock.low',
  STOCK_UPDATED: 'stock.updated',

  // Portal
  PORTAL_ORDER_PLACED: 'portal.order_placed',
  PORTAL_QUOTE_ACCEPTED: 'portal.quote_accepted',
  PORTAL_MESSAGE_SENT: 'portal.message_sent',
} as const;
```

---

## 5. TENANT RESOLUTION

### 5.1. Middleware

```typescript
// common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PlatformService } from '../services/platform.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly platformService: PlatformService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const subdomain = this.extractSubdomain(host);

    if (!subdomain || subdomain === 'app') {
      // Platform admin panel
      req['tenant'] = null;
      return next();
    }

    const tenant = await this.platformService.getTenantBySlug(subdomain);

    if (!tenant) {
      throw new NotFoundException(`Tenant ${subdomain} not found`);
    }

    if (tenant.status !== 'active') {
      throw new NotFoundException(`Tenant ${subdomain} is ${tenant.status}`);
    }

    // Attach tenant to request
    req['tenant'] = tenant;
    req['tenantDbUrl'] = `postgresql://.../${tenant.database_name}`;

    next();
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');
    // tenant.dockpulse.com -> tenant
    // localhost:3000 -> null
    if (parts.length >= 3) {
      return parts[0];
    }
    return null;
  }
}
```

### 5.2. Dynamic Database Connection

```typescript
// database/tenant-connection.service.ts
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  private prisma: PrismaClient;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    const tenant = request['tenant'];

    if (!tenant) {
      throw new Error('No tenant context');
    }

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://dockpulse:password@localhost:5432/dockpulse_tenant_${tenant.slug}`,
        },
      },
    });
  }

  get client(): PrismaClient {
    return this.prisma;
  }
}
```

---

## 6. AUTENTYKACJA

### 6.1. Strategia JWT

```typescript
// auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;           // user_id
  type: 'admin' | 'portal';
  tenant_slug?: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      type: payload.type,
      tenantSlug: payload.tenant_slug,
      role: payload.role,
    };
  }
}
```

### 6.2. Portal Auth (Phone + Password)

```typescript
// auth/portal-auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenantPrismaService } from '../database/tenant-connection.service';

@Injectable()
export class PortalAuthService {
  constructor(
    private readonly prisma: TenantPrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(phone: string, password: string, tenantSlug: string) {
    const customer = await this.prisma.client.customer.findUnique({
      where: { phone },
    });

    if (!customer || !customer.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, customer.password_hash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: customer.id,
      type: 'portal',
      tenant_slug: tenantSlug,
    });

    return {
      access_token: token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        first_login: customer.portal_first_login,
      },
    };
  }

  async generateInitialPassword(): Promise<string> {
    // Generuj 8-znakowe haslo
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
```

---

## 7. FLOW DIAGRAM: TWORZENIE ZAMOWIENIA Z PORTALU

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Portal Client  │    │   API Gateway   │    │   Event Bus     │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         │  POST /portal/orders │                      │
         │─────────────────────>│                      │
         │                      │                      │
         │                      │  Validate JWT        │
         │                      │  Get tenant context  │
         │                      │                      │
         │                      │  Create order        │
         │                      │──────────────────────>│
         │                      │                      │
         │                      │                      │ emit('order.created')
         │                      │                      │──────────┐
         │                      │                      │          │
         │                      │                      │<─────────┘
         │                      │                      │
         │                      │<─────────────────────│
         │                      │                      │
         │  201 Created         │                      │
         │<─────────────────────│                      │
         │                      │                      │
         │                      │                      │
┌────────┴────────┐    ┌────────┴────────┐    ┌────────┴────────┐
│ @notifications  │    │    @stock       │    │   @customers    │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         │ on('order.created')  │ on('order.created')  │ on('order.created')
         │<─────────────────────┼──────────────────────┼─
         │                      │                      │
         │ Send SMS to admin    │ Reserve products     │ Update history
         │                      │                      │
         │ emit('sms.sent')     │ emit('stock.reserved')│
         │                      │                      │
```

---

## 8. DEPLOYMENT ARCHITECTURE

### 8.1. Docker Compose (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: dockpulse
      POSTGRES_PASSWORD: dockpulse_dev
      POSTGRES_DB: dockpulse_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: postgres://dockpulse:dockpulse_dev@postgres:5432/dockpulse_platform
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 20
    ports:
      - "6432:6432"
    depends_on:
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: dockpulse
      MINIO_ROOT_PASSWORD: dockpulse_dev
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 8.2. Caddy Config (Production)

```caddyfile
# /etc/caddy/Caddyfile

# Wildcard SSL for tenants
*.dockpulse.com {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }

    @portal host *.dockpulse.com
    handle @portal {
        reverse_proxy localhost:3000
    }
}

# Platform admin
app.dockpulse.com {
    reverse_proxy localhost:3000
}

# API
api.dockpulse.com {
    reverse_proxy localhost:4000
}
```

---

**Wersja**: 2.0
**Data**: Grudzien 2024
