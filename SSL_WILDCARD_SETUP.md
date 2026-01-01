# Wildcard SSL Configuration for *.dockpulse.com

## Overview

Wildcard SSL certificates allow securing all subdomains under `*.dockpulse.com` with a single certificate.

## Requirements

1. **DNS Provider API Access** - Cloudflare, Route53, or similar
2. **Certbot with DNS plugin** - For automated DNS challenge
3. **Domain ownership verification** - Via DNS TXT records

## Option 1: Automated with Cloudflare (Recommended)

### Install Cloudflare DNS plugin

```bash
apt-get install python3-certbot-dns-cloudflare
```

### Create Cloudflare API credentials

```bash
mkdir -p /root/.secrets
cat > /root/.secrets/cloudflare.ini << 'CFEOF'
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
CFEOF
chmod 600 /root/.secrets/cloudflare.ini
```

### Obtain wildcard certificate

```bash
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d dockpulse.com \
  -d *.dockpulse.com \
  --email admin@dockpulse.com \
  --agree-tos \
  --non-interactive
```

## Option 2: Manual DNS Challenge

### Request certificate

```bash
certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d dockpulse.com \
  -d *.dockpulse.com \
  --email admin@dockpulse.com \
  --agree-tos
```

### Follow prompts

Certbot will ask you to create TXT records:

```
_acme-challenge.dockpulse.com TXT "random-string-here"
```

Add these to your DNS provider, wait for propagation (5-10 minutes), then continue.

## Nginx Configuration

### Update main site config

```nginx
# /etc/nginx/sites-available/dockpulse

# Wildcard SSL redirect
server {
    listen 80;
    server_name *.dockpulse.com;
    return 301 https://$host$request_uri;
}

# Main application
server {
    listen 443 ssl http2;
    server_name dockpulse.com www.dockpulse.com;

    ssl_certificate /etc/letsencrypt/live/dockpulse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dockpulse.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API
server {
    listen 443 ssl http2;
    server_name api.dockpulse.com;

    ssl_certificate /etc/letsencrypt/live/dockpulse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dockpulse.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel
server {
    listen 443 ssl http2;
    server_name admin.dockpulse.com;

    ssl_certificate /etc/letsencrypt/live/dockpulse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dockpulse.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Tenant subdomains (*.dockpulse.com)
server {
    listen 443 ssl http2;
    server_name ~^(?<tenant>[^.]+)\.dockpulse\.com$;

    ssl_certificate /etc/letsencrypt/live/dockpulse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dockpulse.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Pass tenant slug to application
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Tenant-Slug $tenant;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Auto-renewal

Wildcard certificates auto-renew via certbot:

```bash
# Check renewal
certbot renew --dry-run

# Auto-renewal is configured in cron
# /etc/cron.d/certbot
```

## Verification

```bash
# Check certificate
openssl s_client -connect dockpulse.com:443 -servername dockpulse.com < /dev/null 2>/dev/null | openssl x509 -text | grep -A2 "Subject Alternative Name"

# Should show:
# DNS:dockpulse.com, DNS:*.dockpulse.com
```

## Current Status

- ✅ dockpulse.com - SSL configured
- ✅ app.dockpulse.com - SSL configured
- ⏳ *.dockpulse.com - Wildcard pending (requires DNS setup)

## Next Steps

1. Set up Cloudflare or DNS provider API access
2. Run automated certbot command
3. Update Nginx configuration
4. Test with tenant subdomains (tenant1.dockpulse.com, tenant2.dockpulse.com)
