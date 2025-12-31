# DockPulse - Kompletny Przewodnik Wdrożenia

> Pełna instrukcja uruchomienia systemu DockPulse z landing page i rejestracją klientów

---

## 📋 Spis Treści

1. [Wymagania](#wymagania)
2. [Konfiguracja Bazy Danych](#konfiguracja-bazy-danych)
3. [Konfiguracja Backendu (API)](#konfiguracja-backendu-api)
4. [Konfiguracja Landing Page](#konfiguracja-landing-page)
5. [Konfiguracja Reverse Proxy](#konfiguracja-reverse-proxy)
6. [Uruchomienie Systemu](#uruchomienie-systemu)
7. [Testowanie Flow Rejestracji](#testowanie-flow-rejestracji)

---

## 🔧 Wymagania

### System
- **Node.js**: 20.x lub wyższy
- **pnpm**: 8.x lub wyższy
- **PostgreSQL**: 15.x lub wyższy
- **Redis**: 7.x lub wyższy (opcjonalnie)
- **Nginx lub Caddy**: dla reverse proxy

### Porty
- `3000` - Frontend (Next.js)
- `3001` - Landing Page (Vite)
- `3333` - Backend API (NestJS)
- `5432` - PostgreSQL
- `6379` - Redis (opcjonalnie)

---

## 💾 Konfiguracja Bazy Danych

### 1. Zainstaluj PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@15
brew services start postgresql@15
```

### 2. Utwórz bazę danych platformy

```bash
# Przełącz się na użytkownika postgres
sudo -u postgres psql

# Utwórz bazę i użytkownika
CREATE DATABASE dockpulse_platform;
CREATE USER dockpulse WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE dockpulse_platform TO dockpulse;
\q
```

### 3. Zastosuj migracje Prisma

```bash
cd packages/database

# Zaktualizuj .env z connection string
echo "DATABASE_URL=postgresql://dockpulse:your-secure-password@localhost:5432/dockpulse_platform" > .env

# Uruchom migracje
pnpm prisma migrate deploy

# Wygeneruj Prisma Client
pnpm prisma generate
```

### 4. Utwórz pierwszego administratora platformy

```bash
# Wejdź do psql
sudo -u postgres psql dockpulse_platform

# Wstaw administratora (hasło: Admin123!)
INSERT INTO platform_admins (id, email, name, password_hash, is_super_admin, active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@dockpulse.com',
  'Platform Admin',
  '$2b$10$rN9KKoVYkY7YvBi3nqN5yOZuVXEJqZ8xqPHt1zFxBxZKdz5hFZo4S',
  true,
  true,
  NOW(),
  NOW()
);
```

---

## 🔌 Konfiguracja Backendu (API)

### 1. Zainstaluj zależności

```bash
cd apps/api
pnpm install
```

### 2. Konfiguracja Environment Variables

Utwórz plik `apps/api/.env`:

```env
# Server
NODE_ENV=development
PORT=3333
API_URL=http://localhost:3333

# Database
DATABASE_URL=postgresql://dockpulse:your-secure-password@localhost:5432/dockpulse_platform

# JWT
JWT_SECRET=your-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# CORS
FRONTEND_URL=http://localhost:3000
LANDING_URL=http://localhost:3001

# Redis (opcjonalnie)
REDIS_HOST=localhost
REDIS_PORT=6379

# S3 Storage (opcjonalnie - dla auto-branding)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=dockpulse
S3_PUBLIC_URL=https://cdn.dockpulse.com

# OpenRouter API (dla auto-branding)
OPENROUTER_API_KEY=sk-or-xxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Email (opcjonalnie)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Zbuduj i uruchom API

```bash
# Development
pnpm run dev

# Production
pnpm run build
pnpm run start
```

API będzie dostępne pod `http://localhost:3333`

---

## 🎨 Konfiguracja Landing Page

### 1. Zainstaluj zależności

```bash
cd landing
npm install
```

### 2. Konfiguracja API endpoint

Edytuj `landing/components/Registration.tsx` - upewnij się że API endpoint jest poprawny:

```typescript
const response = await fetch('http://localhost:3333/api/platform/tenants/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});
```

### 3. Zbuduj landing page

```bash
# Development
npm run dev

# Production build
npm run build
```

Build wyjściowy będzie w folderze `landing/dist/`

### 4. Serwuj static files

```bash
# Development - Vite dev server
npm run dev # Port 3001

# Production - użyj nginx lub caddy (patrz poniżej)
```

---

## 🌐 Konfiguracja Reverse Proxy

### Opcja A: Caddy (zalecane - auto SSL)

Utwórz `Caddyfile`:

```caddyfile
# Landing page - główna domena
dockpulse.com {
    root * /var/www/dockpulse/landing/dist
    file_server
    try_files {path} /index.html

    # API proxy
    handle /api/* {
        reverse_proxy localhost:3333
    }
}

# Wildcard dla tenantów
*.dockpulse.com {
    reverse_proxy localhost:3000
}
```

Uruchom Caddy:

```bash
sudo caddy run --config Caddyfile
```

### Opcja B: Nginx

Utwórz `/etc/nginx/sites-available/dockpulse`:

```nginx
# Landing page
server {
    listen 80;
    server_name dockpulse.com;

    root /var/www/dockpulse/landing/dist;
    index index.html;

    # Landing page
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Wildcard dla tenantów
server {
    listen 80;
    server_name *.dockpulse.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Tenant-Slug $tenant;
    }

    # Extract tenant from subdomain
    if ($host ~* "^(.+)\.dockpulse\.com$") {
        set $tenant $1;
    }
}
```

Aktywuj konfigurację:

```bash
sudo ln -s /etc/nginx/sites-available/dockpulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚀 Uruchomienie Systemu

### Development (lokalnie)

Uruchom wszystko w osobnych terminalach:

```bash
# Terminal 1: PostgreSQL (jeśli nie jest jako service)
sudo service postgresql start

# Terminal 2: Backend API
cd apps/api
pnpm run dev

# Terminal 3: Landing Page
cd landing
npm run dev

# Terminal 4: Frontend Next.js
cd apps/web
pnpm run dev
```

Dostępne URL:
- Landing: `http://localhost:3001`
- API: `http://localhost:3333`
- Frontend: `http://localhost:3000`

### Production (z Docker Compose)

Utwórz `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dockpulse_platform
      POSTGRES_USER: dockpulse
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - DATABASE_URL=postgresql://dockpulse:${DB_PASSWORD}@postgres:5432/dockpulse_platform
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3333:3333"
    depends_on:
      - postgres

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=https://api.dockpulse.com
    ports:
      - "3000:3000"
    depends_on:
      - api

  caddy:
    image: caddy:latest
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./landing/dist:/var/www/landing
      - caddy_data:/data
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
      - web

volumes:
  postgres_data:
  caddy_data:
```

Uruchom:

```bash
docker-compose up -d
```

---

## ✅ Testowanie Flow Rejestracji

### 1. Sprawdź API Health

```bash
curl http://localhost:3333/health
# Powinno zwrócić: {"status":"ok","timestamp":"..."}
```

### 2. Sprawdź dostępność endpoint rejestracji

```bash
curl -X POST http://localhost:3333/api/platform/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "slug": "test-company",
    "template": "services",
    "websiteUrl": "https://test.com",
    "adminName": "Jan Kowalski",
    "adminEmail": "jan@test.com",
    "adminPhone": "+48123456789"
  }'
```

Poprawna odpowiedź:

```json
{
  "success": true,
  "slug": "test-company",
  "tenantId": "uuid-here",
  "message": "Konto utworzone pomyślnie! Sprawdź email z hasłem dostępowym.",
  "loginUrl": "https://test-company.dockpulse.com/login"
}
```

### 3. Przetestuj landing page

1. Otwórz `http://localhost:3001` w przeglądarce
2. Kliknij "Rozpocznij za darmo"
3. Wypełnij formularz rejestracji:
   - Wybierz szablon (np. "Usługi")
   - Podaj nazwę firmy
   - Subdomena zostanie wygenerowana automatycznie
   - Podaj dane kontaktowe
4. Kliknij "Utwórz konto"
5. Powinieneś zobaczyć komunikat sukcesu
6. Po 3 sekundach zostaniesz przekierowany do `{slug}.dockpulse.com/login`

### 4. Sprawdź utworzenie tenanta w bazie

```bash
sudo -u postgres psql dockpulse_platform

SELECT id, name, slug, status, plan FROM tenants;
SELECT id, email, name, role FROM users WHERE tenant_id = 'tenant-id-here';

\q
```

### 5. Sprawdź logowanie

1. Przejdź do `http://test-company.dockpulse.com/login` (lub localhost:3000)
2. Zaloguj się używając:
   - Email: podany w rejestracji
   - Hasło: wysłane na email (lub wygenerowane - sprawdź logi API)

---

## 🐛 Troubleshooting

### Problem: CORS errors

Sprawdź czy w `apps/api/.env` masz:

```env
FRONTEND_URL=http://localhost:3000
LANDING_URL=http://localhost:3001
```

I w `apps/api/src/main.ts`:

```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.LANDING_URL,
    /\.dockpulse\.com$/,
  ],
  credentials: true,
});
```

### Problem: Cannot connect to database

```bash
# Sprawdź czy PostgreSQL działa
sudo systemctl status postgresql

# Sprawdź connection string
echo $DATABASE_URL

# Sprawdź czy możesz się połączyć
psql postgresql://dockpulse:your-password@localhost:5432/dockpulse_platform
```

### Problem: Tenant subdomain nie działa

W development używaj edycji `/etc/hosts`:

```bash
sudo nano /etc/hosts

# Dodaj:
127.0.0.1 test-company.dockpulse.com
127.0.0.1 dockpulse.com
```

Lub użyj narzędzia jak `dnsmasq` lub `lvh.me`.

### Problem: Build landing page nie działa

```bash
cd landing
rm -rf node_modules dist
npm install
npm run build
```

---

## 📝 Następne Kroki

Po uruchomieniu systemu:

1. **Auto-Branding**: Zintegruj BrandingModule z procesem rejestracji (TODO #5)
2. **Email**: Skonfiguruj wysyłanie emaili z hasłem
3. **Monitoring**: Dodaj Sentry lub podobne
4. **Backupy**: Skonfiguruj automatyczne backupy bazy danych
5. **SSL**: W produkcji użyj Caddy dla auto-SSL

---

**Wersja**: 2.0
**Data**: 31 Grudzień 2024
**Autor**: DockPulse Team
