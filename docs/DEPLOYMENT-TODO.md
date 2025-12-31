# 🚀 DOCKPULSE - MASTER DEPLOYMENT TODO

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██████╗  ██████╗  ██████╗██╗  ██╗██████╗ ██╗   ██╗██╗     ███████╗███████╗ ║
║   ██╔══██╗██╔═══██╗██╔════╝██║ ██╔╝██╔══██╗██║   ██║██║     ██╔════╝██╔════╝ ║
║   ██║  ██║██║   ██║██║     █████╔╝ ██████╔╝██║   ██║██║     ███████╗█████╗   ║
║   ██║  ██║██║   ██║██║     ██╔═██╗ ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝   ║
║   ██████╔╝╚██████╔╝╚██████╗██║  ██╗██║     ╚██████╔╝███████╗███████║███████╗ ║
║   ╚═════╝  ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝ ║
║                                                                              ║
║                    MODULAR CRM/WMS PLATFORM v2.0                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Wersja:** 2.0.0
**Data utworzenia:** 2024-12-31
**Serwer produkcyjny:** 91.228.199.170
**Domena:** dockpulse.com
**Autor:** Bartosz Gaca

---

## 📌 DANE SERWERA

```yaml
IP_SERWERA: 91.228.199.170
DOMENA: dockpulse.com
SSH_USER: root
KATALOG_PROJEKTU: /var/www/dockpulse.com
KATALOG_LOGÓW: /var/log/dockpulse
PLIK_POSTĘPU: /var/www/dockpulse.com/PROGRESS.log
```

## 🌐 STRUKTURA SUBDOMEN

```yaml
dockpulse.com:           Landing page (Vite/React)
api.dockpulse.com:       NestJS API Backend (port 4000)
app.dockpulse.com:       Next.js Dashboard (port 3000)
test.dockpulse.com:      Demo tenant
*.dockpulse.com:         Tenanci klientów (wildcard)
```

## 🔐 SYSTEM LOGOWANIA

**WAŻNE:** System obsługuje logowanie zarówno emailem jak i numerem telefonu:

- **Użytkownicy (pracownicy)**: email LUB telefon + hasło
- **Klienci (portal)**: email LUB telefon + hasło
- **Przyszłość**: Potwierdzenie SMS (2FA)

```typescript
// Login może być:
login: "jan@firma.pl"        // EMAIL
login: "+48123456789"        // TELEFON
login: "123456789"           // TELEFON (bez prefiksu)
```

---

## ⚠️ ZASADY DLA CLAUDE CODE

### ZŁOTE ZASADY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. NIE PYTAJ - wykonuj kroki po kolei                                      │
│  2. NIE PRZERYWAJ - kontynuuj do końca sprintu                              │
│  3. NIE POMIJAJ TESTÓW - każde zadanie ma test akceptacyjny                 │
│  4. NAPRAWIAJ BŁĘDY - jeśli test nie przejdzie, napraw i powtórz            │
│  5. LOGUJ POSTĘP - zapisuj każdy krok do PROGRESS.log                       │
│  6. UŻYWAJ CHECKPOINTÓW - po każdym etapie zapisz stan                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### LOGOWANIE POSTĘPU

Po każdym zadaniu:
```bash
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ SPRINT-X TASK-Y: <opis> - COMPLETED" >> /var/www/dockpulse.com/PROGRESS.log
```

Po błędzie:
```bash
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ SPRINT-X TASK-Y: <opis> - FAILED: <przyczyna>" >> /var/www/dockpulse.com/PROGRESS.log
```

---

## 🗺️ MAPA DEPLOYMENT

```
SPRINT 0: INFRASTRUKTURA (30min)
├── Task 0.1: Inicjalizacja projektu
├── Task 0.2: Aktualizacja systemu
├── Task 0.3: Node.js 20 LTS
├── Task 0.4: PostgreSQL 15
├── Task 0.5: Redis
├── Task 0.6: nginx
├── Task 0.7: DNS Configuration
├── Task 0.8: SSL Wildcard
├── Task 0.9: Zmienne środowiskowe
└── Task 0.10: nginx - pełna konfiguracja
    └─→ CP-001 ✅

SPRINT 1: LANDING PAGE (20min)
├── Task 1.1: Rozpakowanie ZIP
├── Task 1.2: Instalacja dependencies
├── Task 1.3: Build landing page
└── Task 1.4: nginx config update
    └─→ CP-002 ✅

SPRINT 2: BACKEND API (45min)
├── Task 2.1: Inicjalizacja NestJS
├── Task 2.2: Konfiguracja Prisma
├── Task 2.3: Migracje bazy
├── Task 2.4: Moduły NestJS
│   ├── Auth (email/phone login)
│   ├── Users
│   ├── Customers
│   ├── Products
│   ├── Orders
│   └── Quotes
├── Task 2.5: Build API
└── Task 2.6: PM2 deployment
    └─→ CP-003 ✅

SPRINT 3: FRONTEND CRM (60min)
├── Task 3.1: Next.js init
├── Task 3.2: Tailwind glassmorphism
├── Task 3.3: Global CSS
├── Task 3.4: App Router structure
├── Task 3.5: Login Page (iOS Crystal)
├── Task 3.6: Dashboard Layout
├── Task 3.7: Dashboard Page
└── Task 3.8: Build & PM2
    └─→ CP-004 ✅

SPRINT 4: MULTI-TENANCY (30min)
├── Task 4.1: Skrypt add-tenant.sh
└── Task 4.2: Demo tenant (test.dockpulse.com)
    └─→ CP-005 ✅

SPRINT 5: PORTAL KLIENTA (30min)
└── Task 5.1: Portal login (email/phone)
    └─→ CP-006 ✅

SPRINT 6: INTEGRACJE (20min) [OPCJONALNE]
├── Task 6.1: SMSAPI
├── Task 6.2: Email SMTP
└── Task 6.3: OpenRouter AI
    └─→ CP-007 ✅
```

---

## 📋 SZCZEGÓŁOWE TASKI

Pełna dokumentacja każdego taska znajduje się w sekcjach poniżej.

Każdy task zawiera:
- **User Story** - Opis z perspektywy użytkownika
- **Acceptance Criteria** - Kryteria akceptacji
- **Komendy** - Dokładne komendy do wykonania
- **Test** - Automatyczny test sprawdzający poprawność
- **Log** - Komenda do zalogowania postępu

---

## 🏗️ SPRINT 0: INFRASTRUKTURA

### TASK 0.1: Inicjalizacja projektu

**User Story:** Jako DevOps, chcę mieć przygotowany katalog projektu z systemem śledzenia postępu.

**Acceptance Criteria:**
- [ ] Katalog `/var/www/dockpulse.com` istnieje
- [ ] Plik `PROGRESS.log` utworzony
- [ ] Uprawnienia ustawione poprawnie

**Komendy:**
```bash
sudo mkdir -p /var/www/dockpulse.com/{apps,packages,scripts,logs,backups}
sudo mkdir -p /var/www/dockpulse.com/apps/{api,web}
sudo mkdir -p /var/www/dockpulse.com/packages/{database,shared,ui}
sudo chown -R $USER:$USER /var/www/dockpulse.com

touch /var/www/dockpulse.com/PROGRESS.log
echo "╔══════════════════════════════════════════════════════════════╗" >> /var/www/dockpulse.com/PROGRESS.log
echo "║           DOCKPULSE DEPLOYMENT PROGRESS LOG                  ║" >> /var/www/dockpulse.com/PROGRESS.log
echo "║           Started: $(date '+%Y-%m-%d %H:%M:%S')              ║" >> /var/www/dockpulse.com/PROGRESS.log
echo "║           Server: 91.228.199.170                             ║" >> /var/www/dockpulse.com/PROGRESS.log
echo "╚══════════════════════════════════════════════════════════════╝" >> /var/www/dockpulse.com/PROGRESS.log
```

**Test:**
```bash
test -d /var/www/dockpulse.com && test -f /var/www/dockpulse.com/PROGRESS.log && echo "✅ OK" || echo "❌ FAILED"
```

**Log:**
```bash
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ SPRINT-0 TASK-0.1: Inicjalizacja projektu - COMPLETED" >> /var/www/dockpulse.com/PROGRESS.log
```

---

### TASK 0.2: Aktualizacja systemu

**Komendy:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential gnupg2 software-properties-common unzip htop
```

**Test:**
```bash
which curl && which git && which unzip && echo "✅ OK" || echo "❌ FAILED"
```

---

### TASK 0.3: Node.js 20 LTS

**Komendy:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
```

**Test:**
```bash
node --version | grep -q "v20" && pnpm --version && pm2 --version && echo "✅ OK" || echo "❌ FAILED"
```

---

### TASK 0.4: PostgreSQL 15

**Komendy:**
```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update && sudo apt install -y postgresql-15 postgresql-contrib-15

sudo systemctl start postgresql
sudo systemctl enable postgresql

POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" > /var/www/dockpulse.com/.secrets
chmod 600 /var/www/dockpulse.com/.secrets

sudo -u postgres psql << EOF
CREATE USER dockpulse WITH PASSWORD '$POSTGRES_PASSWORD';
ALTER USER dockpulse CREATEDB;
CREATE DATABASE dockpulse_platform OWNER dockpulse;
GRANT ALL PRIVILEGES ON DATABASE dockpulse_platform TO dockpulse;
\q
EOF
```

**Test:**
```bash
source /var/www/dockpulse.com/.secrets
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U dockpulse -d dockpulse_platform -c "SELECT 1;" && echo "✅ OK" || echo "❌ FAILED"
```

---

### TASK 0.5: Redis

**Komendy:**
```bash
sudo apt install -y redis-server

REDIS_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> /var/www/dockpulse.com/.secrets

sudo tee /etc/redis/redis.conf > /dev/null << EOF
bind 127.0.0.1
port 6379
requirepass $REDIS_PASSWORD
maxmemory 512mb
maxmemory-policy allkeys-lru
daemonize yes
pidfile /var/run/redis/redis-server.pid
logfile /var/log/redis/redis-server.log
dir /var/lib/redis
EOF

sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

**Test:**
```bash
source /var/www/dockpulse.com/.secrets
redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG" && echo "✅ OK" || echo "❌ FAILED"
```

---

### TASK 0.6: nginx

**Komendy:**
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo rm -f /etc/nginx/sites-enabled/default
```

**Test:**
```bash
nginx -v 2>&1 | grep -q "nginx" && systemctl is-active --quiet nginx && echo "✅ OK" || echo "❌ FAILED"
```

---

### TASK 0.7: DNS Configuration

**⚠️ RĘCZNA KONFIGURACJA W SPACESHIP/CLOUDFLARE**

Dodaj rekordy:

| Typ | Nazwa | Wartość | TTL |
|-----|-------|---------|-----|
| A | @ | 91.228.199.170 | 300 |
| A | * | 91.228.199.170 | 300 |
| A | api | 91.228.199.170 | 300 |
| A | www | 91.228.199.170 | 300 |
| A | app | 91.228.199.170 | 300 |

**Test:**
```bash
dig dockpulse.com +short | grep -q "91.228.199.170" && echo "✅ OK" || echo "⏳ WAITING"
```

---

### TASK 0.8: SSL Wildcard

**OPCJA A: Cloudflare (jeśli DNS na Cloudflare)**

```bash
sudo apt install -y certbot python3-certbot-dns-cloudflare

sudo mkdir -p /etc/letsencrypt
sudo tee /etc/letsencrypt/cloudflare.ini > /dev/null << 'EOF'
dns_cloudflare_api_token = TWÓJ_TOKEN
EOF
sudo chmod 600 /etc/letsencrypt/cloudflare.ini

sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d dockpulse.com \
  -d "*.dockpulse.com" \
  --non-interactive \
  --agree-tos \
  --email admin@dockpulse.com
```

**OPCJA B: Manual (Spaceship)**

```bash
sudo apt install -y certbot

sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d dockpulse.com \
  -d "*.dockpulse.com" \
  --agree-tos \
  --email admin@dockpulse.com
# Dodaj TXT record w DNS!
```

**Auto-renewal:**
```bash
echo "0 3 1 * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo tee -a /etc/crontab
```

**Test:**
```bash
sudo test -f /etc/letsencrypt/live/dockpulse.com/fullchain.pem && echo "✅ OK" || echo "❌ FAILED"
```

---

### TASK 0.9: Zmienne środowiskowe

**Komendy:**
```bash
cd /var/www/dockpulse.com
source .secrets

JWT_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)
echo "JWT_SECRET=$JWT_SECRET" >> .secrets

cat > .env << EOF
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://dockpulse.com
API_URL=https://api.dockpulse.com
APP_URL=https://app.dockpulse.com
DOMAIN=dockpulse.com

DATABASE_URL=postgresql://dockpulse:${POSTGRES_PASSWORD}@localhost:5432/dockpulse_platform
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Opcjonalne - do uzupełnienia później
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=dockpulse

OPENROUTER_API_KEY=
SMS_API_KEY=
SMS_SENDER=DockPulse

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=DockPulse <noreply@dockpulse.com>

ENABLE_AI_ASSISTANT=false
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_EMAIL_NOTIFICATIONS=false
EOF

chmod 600 .env
```

**Test:**
```bash
test -f /var/www/dockpulse.com/.env && grep -q "DATABASE_URL" /var/www/dockpulse.com/.env && echo "✅ OK" || echo "❌ FAILED"
```

---

### TASK 0.10: nginx - pełna konfiguracja

[Zawartość konfiguracji nginx jak w oryginalnym TODO]

---

## 🎨 SPRINT 1: LANDING PAGE

### TASK 1.1: Rozpakowanie ZIP

```bash
cd /var/www/dockpulse.com
mkdir -p landing
# Skopiuj ZIP z lokalnego folderu do serwera
# scp dockpulse---modular-crm_wms.zip root@91.228.199.170:/var/www/dockpulse.com/landing/

cd landing
unzip -o dockpulse---modular-crm_wms.zip
```

---

### TASK 1.2: Build landing

```bash
cd /var/www/dockpulse.com/landing
pnpm install
pnpm build
```

---

### TASK 1.3: nginx update

```bash
sudo sed -i 's|root /var/www/dockpulse.com/landing;|root /var/www/dockpulse.com/landing/dist;|g' /etc/nginx/sites-available/dockpulse.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔧 SPRINT 2-6

[Szczegóły pozostałych sprintów jak w oryginalnym TODO]

---

## 🧪 TESTY E2E

```bash
# Landing
curl -I https://dockpulse.com

# API
curl https://api.dockpulse.com/health

# App
curl -I https://app.dockpulse.com

# Demo tenant
curl -I https://test.dockpulse.com
```

---

## 📝 PROGRESS TRACKING

Sprawdź postęp:
```bash
tail -50 /var/www/dockpulse.com/PROGRESS.log
```

Wznów od ostatniego checkpoint:
```bash
grep "CHECKPOINT" /var/www/dockpulse.com/PROGRESS.log | tail -1
```

---

**Dokumentacja pełna:** Szczegółowe komendy dla każdego taska znajdują się w komentarzach w kodzie źródłowym.

**Status:** 🚧 W TRAKCIE IMPLEMENTACJI

**Ostatnia aktualizacja:** 2024-12-31
