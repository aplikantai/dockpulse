# 🚀 DockPulse - Instrukcja wdrożenia nginx i SSL

## 📋 Wymagania wstępne

- Serwer: **91.228.199.170**
- Domena: **dockpulse.com**
- DNS skonfigurowany (rekordy A wskazujące na IP serwera)
- Dostęp root do serwera

---

## 🔧 KROK 1: Instalacja nginx

```bash
# Aktualizuj system
sudo apt update && sudo apt upgrade -y

# Zainstaluj nginx
sudo apt install -y nginx

# Uruchom i włącz autostart
sudo systemctl start nginx
sudo systemctl enable nginx

# Sprawdź status
sudo systemctl status nginx
```

**Weryfikacja:**
```bash
nginx -v
# Powinno pokazać: nginx version: nginx/1.18.0 lub nowsze
```

---

## 🌐 KROK 2: Konfiguracja DNS

W panelu Spaceship (lub Cloudflare) dodaj następujące rekordy:

| Typ | Nazwa | Wartość | TTL |
|-----|-------|---------|-----|
| A | @ | 91.228.199.170 | 300 |
| A | * | 91.228.199.170 | 300 |
| A | api | 91.228.199.170 | 300 |
| A | app | 91.228.199.170 | 300 |
| A | test | 91.228.199.170 | 300 |
| A | www | 91.228.199.170 | 300 |

**Sprawdź propagację DNS:**
```bash
dig dockpulse.com +short
# Powinno pokazać: 91.228.199.170

dig api.dockpulse.com +short
# Powinno pokazać: 91.228.199.170
```

⏳ **Uwaga:** Propagacja DNS może zająć od 5 minut do 24 godzin.

---

## 🔐 KROK 3: Uzyskanie certyfikatu SSL (Wildcard)

### Opcja A: Cloudflare DNS (ZALECANE)

1. **Uzyskaj Cloudflare API Token:**
   - Zaloguj się do Cloudflare
   - Przejdź do: My Profile → API Tokens → Create Token
   - Wybierz: "Edit zone DNS" template
   - Zone Resources: Include → Specific zone → dockpulse.com
   - Skopiuj wygenerowany token

2. **Zainstaluj certbot z pluginem Cloudflare:**
```bash
sudo apt install -y certbot python3-certbot-nginx python3-certbot-dns-cloudflare
```

3. **Utwórz plik credentials:**
```bash
sudo mkdir -p /etc/letsencrypt
sudo tee /etc/letsencrypt/cloudflare.ini > /dev/null << 'EOF'
dns_cloudflare_api_token = TWÓJ_CLOUDFLARE_API_TOKEN
EOF
sudo chmod 600 /etc/letsencrypt/cloudflare.ini
```

4. **Uzyskaj certyfikat wildcard:**
```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d dockpulse.com \
  -d "*.dockpulse.com" \
  --non-interactive \
  --agree-tos \
  --email admin@dockpulse.com
```

### Opcja B: Spaceship DNS (Manual Challenge)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Manual DNS challenge
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d dockpulse.com \
  -d "*.dockpulse.com" \
  --agree-tos \
  --email admin@dockpulse.com
```

**Certbot poprosi o dodanie rekordu TXT:**
```
Please deploy a DNS TXT record under the name
_acme-challenge.dockpulse.com with the following value:

xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

1. Dodaj rekord TXT w Spaceship:
   - Typ: TXT
   - Nazwa: _acme-challenge
   - Wartość: (wartość podana przez certbot)
   - TTL: 300

2. Poczekaj 2-3 minuty na propagację

3. Sprawdź czy propagował:
```bash
dig TXT _acme-challenge.dockpulse.com +short
```

4. Wróć do certbot i naciśnij Enter

### Opcja C: Certyfikaty osobno dla każdej subdomeny (BEZ wildcard)

```bash
sudo certbot certonly --nginx \
  -d dockpulse.com \
  -d www.dockpulse.com \
  -d api.dockpulse.com \
  -d app.dockpulse.com \
  -d test.dockpulse.com \
  --non-interactive \
  --agree-tos \
  --email admin@dockpulse.com
```

⚠️ **Uwaga:** Ta opcja NIE obsługuje dynamicznych subdomen tenantów!

---

## 📝 KROK 4: Instalacja konfiguracji nginx

1. **Skopiuj plik konfiguracji:**
```bash
cd /root/dockpulse

# Skopiuj konfigurację
sudo cp nginx/dockpulse.conf /etc/nginx/sites-available/dockpulse.com

# Usuń domyślną konfigurację
sudo rm -f /etc/nginx/sites-enabled/default

# Włącz naszą konfigurację
sudo ln -sf /etc/nginx/sites-available/dockpulse.com /etc/nginx/sites-enabled/
```

2. **Testuj konfigurację:**
```bash
sudo nginx -t
```

**Oczekiwany output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

3. **Przeładuj nginx:**
```bash
sudo systemctl reload nginx
```

---

## 🔄 KROK 5: Auto-renewal SSL

Dodaj cron job do automatycznego odnowienia certyfikatu:

```bash
# Otwórz crontab
sudo crontab -e

# Dodaj linię (odnowienie codziennie o 3:00)
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

**Lub dodaj do /etc/crontab:**
```bash
echo "0 3 1 * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo tee -a /etc/crontab
```

**Test renewal (dry run):**
```bash
sudo certbot renew --dry-run
```

---

## ✅ KROK 6: Weryfikacja

### Test 1: Sprawdź czy certyfikat działa
```bash
echo | openssl s_client -servername dockpulse.com -connect dockpulse.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Test 2: Sprawdź każdą subdomenę
```bash
# Landing page
curl -I https://dockpulse.com

# API
curl -I https://api.dockpulse.com/health

# App
curl -I https://app.dockpulse.com

# Tenant (wildcard)
curl -I https://test.dockpulse.com
```

### Test 3: Sprawdź SSL w przeglądarce
- https://dockpulse.com - ✅ Powinno pokazać landing page
- https://api.dockpulse.com/health - ✅ Powinno pokazać status
- https://app.dockpulse.com - ✅ Powinno pokazać dashboard
- https://test.dockpulse.com - ✅ Powinno pokazać tenant

### Test 4: Sprawdź security headers
```bash
curl -I https://dockpulse.com | grep -E "X-Frame|X-Content|Strict-Transport"
```

Powinno pokazać:
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 📊 Status Check

Uruchom kompleksowy test:
```bash
#!/bin/bash
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            DOCKPULSE DEPLOYMENT STATUS CHECK                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 1. nginx
systemctl is-active --quiet nginx && echo "✅ nginx: RUNNING" || echo "❌ nginx: STOPPED"

# 2. SSL Certificate
if sudo test -f /etc/letsencrypt/live/dockpulse.com/fullchain.pem; then
    echo "✅ SSL Certificate: EXISTS"
    sudo openssl x509 -in /etc/letsencrypt/live/dockpulse.com/fullchain.pem -noout -dates | grep "notAfter"
else
    echo "❌ SSL Certificate: MISSING"
fi

# 3. DNS
echo ""
echo "DNS Resolution:"
dig dockpulse.com +short | head -1
dig api.dockpulse.com +short | head -1
dig app.dockpulse.com +short | head -1

# 4. HTTPS endpoints
echo ""
echo "HTTPS Endpoints:"
curl -sI https://dockpulse.com | head -1
curl -sI https://api.dockpulse.com | head -1
curl -sI https://app.dockpulse.com | head -1

echo ""
echo "╚══════════════════════════════════════════════════════════════╝"
```

---

## 🔧 Troubleshooting

### Problem: "connection refused"
```bash
# Sprawdź czy nginx działa
sudo systemctl status nginx

# Sprawdź logi
sudo tail -f /var/log/nginx/error.log
```

### Problem: "SSL certificate problem"
```bash
# Sprawdź certyfikat
sudo certbot certificates

# Odnów certyfikat
sudo certbot renew --force-renewal
```

### Problem: "502 Bad Gateway"
```bash
# Sprawdź czy backend działa
pm2 list

# Restart backend
pm2 restart all

# Sprawdź logi
pm2 logs
```

### Problem: DNS nie propaguje
```bash
# Sprawdź nameservery
dig dockpulse.com NS

# Wymuś propagację (zmień TTL na 60)
# Poczekaj 5-10 minut
```

---

## 📚 Dokumentacja uzupełniająca

- [DEPLOYMENT-FULL.md](DEPLOYMENT-FULL.md) - Pełna instrukcja wdrożenia
- [DEPLOYMENT-TODO.md](DEPLOYMENT-TODO.md) - Master TODO wdrożenia
- [nginx/dockpulse.conf](../nginx/dockpulse.conf) - Kompletna konfiguracja nginx

---

## 🎯 Quick Reference

### Sprawdź status nginx:
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Przeładuj nginx po zmianach:
```bash
sudo systemctl reload nginx
```

### Sprawdź certyfikat SSL:
```bash
sudo certbot certificates
```

### Odnów certyfikat manualnie:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Logi nginx:
```bash
# Error log
sudo tail -f /var/log/nginx/error.log

# Access log
sudo tail -f /var/log/nginx/access.log
```

---

**Ostatnia aktualizacja:** 2024-12-31
**Wersja:** 1.0
**Autor:** Bartosz Gaca
