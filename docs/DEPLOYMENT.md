# DockPulse - Deployment Guide

> Instrukcja wdrozenia platformy DockPulse na srodowisko produkcyjne

---

## 1. WYMAGANIA

### 1.1. Serwer

| Komponent | Minimum | Rekomendowane |
|-----------|---------|---------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Dysk | 40 GB SSD | 100 GB NVMe |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 1.2. Oprogramowanie

| Komponent | Wersja |
|-----------|--------|
| Node.js | 20 LTS |
| PostgreSQL | 15+ |
| Redis | 7+ |
| Docker | 24+ |
| Docker Compose | 2.20+ |
| Caddy | 2.7+ |
| pnpm | 8+ |

### 1.3. DNS

Wymagane rekordy DNS:

```
dockpulse.com          A    <IP_SERWERA>
*.dockpulse.com        A    <IP_SERWERA>
app.dockpulse.com      A    <IP_SERWERA>
api.dockpulse.com      A    <IP_SERWERA>
```

---

## 2. INSTALACJA SRODOWISKA

### 2.1. Aktualizacja systemu

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### 2.2. Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.3. pnpm

```bash
npm install -g pnpm
```

### 2.4. Docker

```bash
# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Docker Compose
sudo apt install -y docker-compose-plugin
```

### 2.5. PostgreSQL 15

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15
```

### 2.6. Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

### 2.7. Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

---

## 3. KONFIGURACJA BAZ DANYCH

### 3.1. PostgreSQL

```bash
sudo -u postgres psql
```

```sql
-- Uzytkownik
CREATE USER dockpulse WITH PASSWORD 'SUPER_SECRET_PASSWORD';
ALTER USER dockpulse CREATEDB;

-- Baza platformy
CREATE DATABASE dockpulse_platform OWNER dockpulse;

-- Uprawnienia
GRANT ALL PRIVILEGES ON DATABASE dockpulse_platform TO dockpulse;
```

### 3.2. PgBouncer

```bash
sudo apt install -y pgbouncer
```

Edytuj `/etc/pgbouncer/pgbouncer.ini`:

```ini
[databases]
dockpulse_platform = host=localhost port=5432 dbname=dockpulse_platform

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

Edytuj `/etc/pgbouncer/userlist.txt`:

```
"dockpulse" "SUPER_SECRET_PASSWORD"
```

```bash
sudo systemctl restart pgbouncer
sudo systemctl enable pgbouncer
```

### 3.3. Redis

Edytuj `/etc/redis/redis.conf`:

```conf
bind 127.0.0.1
requirepass REDIS_SECRET_PASSWORD
maxmemory 512mb
maxmemory-policy allkeys-lru
```

```bash
sudo systemctl restart redis-server
```

---

## 4. DEPLOYMENT APLIKACJI

### 4.1. Klonowanie repozytorium

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/gacabartosz/dockpulse.git
sudo chown -R $USER:$USER dockpulse
cd dockpulse
```

### 4.2. Instalacja zaleznosci

```bash
pnpm install
```

### 4.3. Zmienne srodowiskowe

Utworz plik `.env` w katalogu glownym:

```bash
cp .env.example .env
nano .env
```

```env
# Application
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://app.dockpulse.com

# Database (Platform)
DATABASE_URL=postgresql://dockpulse:SUPER_SECRET_PASSWORD@localhost:6432/dockpulse_platform

# Redis
REDIS_URL=redis://:REDIS_SECRET_PASSWORD@localhost:6379

# JWT
JWT_SECRET=BARDZO_DLUGI_LOSOWY_SECRET_MIN_64_ZNAKI
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# S3 Storage (MinIO)
S3_ENDPOINT=https://s3.dockpulse.com
S3_ACCESS_KEY=minio_access_key
S3_SECRET_KEY=minio_secret_key
S3_BUCKET=dockpulse

# OpenRouter (AI)
OPENROUTER_API_KEY=sk-or-xxxxx

# SMS (np. SMSAPI)
SMS_API_KEY=xxxxx
SMS_SENDER=DockPulse

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@dockpulse.com
SMTP_PASS=xxxxx
SMTP_FROM=DockPulse <noreply@dockpulse.com>

# Wildcard domain
DOMAIN=dockpulse.com
```

### 4.4. Migracje bazy danych

```bash
cd packages/database
pnpm prisma migrate deploy
pnpm prisma db seed
```

### 4.5. Build aplikacji

```bash
pnpm build
```

---

## 5. KONFIGURACJA CADDY

### 5.1. Caddyfile

Edytuj `/etc/caddy/Caddyfile`:

```caddyfile
# Platform admin
app.dockpulse.com {
    reverse_proxy localhost:3000
}

# API
api.dockpulse.com {
    reverse_proxy localhost:4000
}

# Wildcard dla tenantow
*.dockpulse.com {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }

    reverse_proxy localhost:3000
}

# S3 / MinIO (opcjonalnie)
s3.dockpulse.com {
    reverse_proxy localhost:9000
}
```

### 5.2. Cloudflare API Token

Dla wildcard SSL potrzebny jest token Cloudflare:

1. Zaloguj sie do Cloudflare Dashboard
2. Przejdz do: My Profile > API Tokens
3. Utworz token z uprawnieniami: Zone > DNS > Edit

Ustaw zmienna srodowiskowa:

```bash
sudo nano /etc/systemd/system/caddy.service.d/override.conf
```

```ini
[Service]
Environment="CLOUDFLARE_API_TOKEN=xxxx"
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart caddy
```

---

## 6. PROCESS MANAGER (PM2)

### 6.1. Instalacja PM2

```bash
npm install -g pm2
```

### 6.2. Konfiguracja ecosystem

Utworz `ecosystem.config.js` w `/var/www/dockpulse`:

```javascript
module.exports = {
  apps: [
    {
      name: 'dockpulse-api',
      cwd: '/var/www/dockpulse/apps/api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_file: '/var/www/dockpulse/.env',
    },
    {
      name: 'dockpulse-web',
      cwd: '/var/www/dockpulse/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '/var/www/dockpulse/.env',
    },
  ],
};
```

### 6.3. Uruchomienie

```bash
cd /var/www/dockpulse
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 7. SKRYPTY OPERACYJNE

### 7.1. Tworzenie tenanta

```bash
#!/bin/bash
# scripts/create-tenant.sh

SLUG=$1
NAME=$2
TEMPLATE=$3
ADMIN_EMAIL=$4

if [ -z "$SLUG" ] || [ -z "$NAME" ] || [ -z "$TEMPLATE" ] || [ -z "$ADMIN_EMAIL" ]; then
    echo "Usage: ./create-tenant.sh <slug> <name> <template> <admin_email>"
    exit 1
fi

echo "Creating tenant: $SLUG"

# 1. Utworz baze danych
sudo -u postgres psql -c "CREATE DATABASE dockpulse_tenant_$SLUG OWNER dockpulse;"

# 2. Dodaj do PgBouncer
echo "dockpulse_tenant_$SLUG = host=localhost port=5432 dbname=dockpulse_tenant_$SLUG" | sudo tee -a /etc/pgbouncer/pgbouncer.ini
sudo systemctl reload pgbouncer

# 3. Uruchom migracje
DATABASE_URL="postgresql://dockpulse:xxx@localhost:5432/dockpulse_tenant_$SLUG" \
  pnpm prisma migrate deploy --schema=packages/database/prisma/tenant.prisma

# 4. Seed szablonu
node scripts/seed-tenant.js --slug=$SLUG --template=$TEMPLATE --admin-email=$ADMIN_EMAIL

# 5. Dodaj do tabeli tenants
sudo -u postgres psql -d dockpulse_platform -c "
  INSERT INTO tenants (slug, name, template, status)
  VALUES ('$SLUG', '$NAME', '$TEMPLATE', 'active');
"

echo "Tenant $SLUG created successfully!"
echo "URL: https://$SLUG.dockpulse.com"
```

### 7.2. Backup tenanta

```bash
#!/bin/bash
# scripts/backup-tenant.sh

SLUG=$1
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/dockpulse"

mkdir -p $BACKUP_DIR

pg_dump -U dockpulse dockpulse_tenant_$SLUG | gzip > "$BACKUP_DIR/${SLUG}_${DATE}.sql.gz"

echo "Backup created: ${SLUG}_${DATE}.sql.gz"
```

### 7.3. Usuwanie tenanta

```bash
#!/bin/bash
# scripts/delete-tenant.sh

SLUG=$1

echo "WARNING: This will permanently delete tenant $SLUG!"
read -p "Type tenant slug to confirm: " CONFIRM

if [ "$CONFIRM" != "$SLUG" ]; then
    echo "Aborted."
    exit 1
fi

# 1. Usun z tabeli tenants
sudo -u postgres psql -d dockpulse_platform -c "
  UPDATE tenants SET status = 'deleted' WHERE slug = '$SLUG';
"

# 2. Usun baze danych
sudo -u postgres psql -c "DROP DATABASE dockpulse_tenant_$SLUG;"

echo "Tenant $SLUG deleted."
```

---

## 8. MONITORING

### 8.1. PM2 Monitoring

```bash
pm2 monit
pm2 logs
pm2 status
```

### 8.2. Prometheus + Grafana (opcjonalnie)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  grafana_data:
```

---

## 9. CI/CD (GitHub Actions)

### 9.1. Workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/dockpulse
            git pull origin main
            pnpm install
            pnpm build
            pm2 restart all
```

---

## 10. TROUBLESHOOTING

### 10.1. Sprawdzenie logow

```bash
# PM2
pm2 logs dockpulse-api
pm2 logs dockpulse-web

# Caddy
journalctl -u caddy -f

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Redis
sudo tail -f /var/log/redis/redis-server.log
```

### 10.2. Sprawdzenie statusu uslug

```bash
systemctl status postgresql
systemctl status redis-server
systemctl status pgbouncer
systemctl status caddy
pm2 status
```

### 10.3. Czeste problemy

| Problem | Rozwiazanie |
|---------|-------------|
| 502 Bad Gateway | Sprawdz czy aplikacja dziala: `pm2 status` |
| SSL error | Sprawdz Cloudflare token i DNS |
| Database connection refused | Sprawdz PgBouncer: `systemctl status pgbouncer` |
| Redis connection refused | Sprawdz Redis: `redis-cli ping` |
| Tenant not found | Sprawdz tabele tenants w dockpulse_platform |

---

## 11. BACKUP I RECOVERY

### 11.1. Automatyczny backup (cron)

```bash
crontab -e
```

```
# Backup wszystkich baz o 3:00
0 3 * * * /var/www/dockpulse/scripts/backup-all.sh

# Czyszczenie backupow starszych niz 30 dni
0 4 * * * find /var/backups/dockpulse -mtime +30 -delete
```

### 11.2. Recovery

```bash
# Odtworzenie bazy tenanta
gunzip < backup.sql.gz | psql -U dockpulse dockpulse_tenant_SLUG
```

---

## 12. CHECKLIST PRZED PRODUKCJA

- [ ] Zmienione domyslne hasla
- [ ] Skonfigurowany firewall (ufw)
- [ ] Wlaczony fail2ban
- [ ] SSL dziala na wszystkich subdomenach
- [ ] Backup dziala automatycznie
- [ ] Monitoring skonfigurowany
- [ ] Logi rotowane
- [ ] DNS propagowany
- [ ] Testy E2E przechodzą
- [ ] Rate limiting wlaczony

---

**Wersja**: 2.0
**Data**: Grudzien 2024
