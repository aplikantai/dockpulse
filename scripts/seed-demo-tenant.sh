#!/bin/bash

# =========================================
# DockPulse - Seed Demo Tenant (test.dockpulse.com)
# =========================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Creating demo tenant: test.dockpulse.com${NC}"

# Configuration
SLUG="test"
NAME="DockPulse Demo"
ADMIN_EMAIL="demo@dockpulse.com"
ADMIN_PASSWORD="Demo123!"
TEMPLATE="services"

# Database config
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-dockpulse}"
DB_PASS="${DB_PASS:-PHJ20qgFqP8YAGsBo2MPRBp6XFnnPAHn}"
PLATFORM_DB="dockpulse_platform"
TENANT_DB="dockpulse_tenant_${SLUG}"

# Step 1: Create tenant using existing script (if exists)
if [ -f "./scripts/create-tenant.sh" ]; then
  echo -e "${YELLOW}Running create-tenant.sh script...${NC}"
  ./scripts/create-tenant.sh \
    --slug=$SLUG \
    --name="$NAME" \
    --template=$TEMPLATE \
    --admin-email=$ADMIN_EMAIL \
    --admin-password=$ADMIN_PASSWORD
else
  echo -e "${YELLOW}create-tenant.sh not found, creating tenant manually...${NC}"

  # Create tenant manually
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $PLATFORM_DB << EOF
INSERT INTO tenants (id, slug, name, template, status, created_at, updated_at)
VALUES (gen_random_uuid(), '$SLUG', '$NAME', '$TEMPLATE', 'active', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;
EOF
fi

# Step 2: Enable ALL modules
echo -e "${YELLOW}Enabling all modules...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $PLATFORM_DB << 'EOF'
UPDATE tenants
SET settings = jsonb_set(
  COALESCE(settings, '{}'),
  '{modules}',
  '["customers", "products", "orders", "quotes", "inventory", "reports", "portal", "notifications", "ai-assistant"]'::jsonb
)
WHERE slug = 'test';

UPDATE tenants
SET settings = jsonb_set(
  COALESCE(settings, '{}'),
  '{branding}',
  '{
    "companyName": "DockPulse Demo",
    "logoUrl": "/assets/dockpulse-logo.svg",
    "faviconUrl": "/favicon.ico",
    "colors": {
      "primary": "#6366F1",
      "secondary": "#8B5CF6",
      "accent": "#22D3EE"
    }
  }'::jsonb
)
WHERE slug = 'test';
EOF

# Step 3: Seed demo data (if tenant database exists)
echo -e "${YELLOW}Seeding demo data...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $PLATFORM_DB << 'EOF'

-- Get tenant ID
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'test' LIMIT 1;

  -- Seed customers (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    INSERT INTO customers (id, tenant_id, name, phone, email, company_name, nip, created_at, updated_at)
    VALUES
      (gen_random_uuid(), tenant_uuid, 'Jan Kowalski', '+48500100200', 'jan@example.com', 'Kowalski Sp. z o.o.', '1234567890', NOW(), NOW()),
      (gen_random_uuid(), tenant_uuid, 'Anna Nowak', '+48600200300', 'anna@example.com', 'Nowak i Wspólnicy', '0987654321', NOW(), NOW()),
      (gen_random_uuid(), tenant_uuid, 'Piotr Wiśniewski', '+48700300400', 'piotr@example.com', 'Tech Solutions', '1122334455', NOW(), NOW()),
      (gen_random_uuid(), tenant_uuid, 'Maria Dąbrowska', '+48800400500', 'maria@example.com', 'Dąbrowska Design', '5544332211', NOW(), NOW()),
      (gen_random_uuid(), tenant_uuid, 'Tomasz Zieliński', '+48900500600', 'tomasz@example.com', 'Green Energy', '6677889900', NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Seed products (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    INSERT INTO products (id, tenant_id, name, sku, price, unit, description, is_active, created_at, updated_at)
    VALUES
      (gen_random_uuid(), tenant_uuid, 'Konsultacja IT', 'KONS-001', 200.00, 'godz.', 'Konsultacja techniczna IT', true, NOW(), NOW()),
      (gen_random_uuid(), tenant_uuid, 'Wdrożenie systemu', 'WDRO-001', 5000.00, 'szt.', 'Pełne wdrożenie systemu', true, NOW(), NOW()),
      (gen_random_uuid(), tenant_uuid, 'Wsparcie techniczne', 'WSPA-001', 150.00, 'godz.', 'Zdalne wsparcie techniczne', true, NOW(), NOW()),
      (gen_random_uuid(), tenant_uuid, 'Szkolenie użytkowników', 'SZKOL-001', 1500.00, 'dzień', 'Szkolenie dla zespołu', true, NOW(), NOW()),
      (gen_random_uuid(), tenant_uuid, 'Hosting aplikacji', 'HOST-001', 500.00, 'mies.', 'Hosting w chmurze', true, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
EOF

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Demo Tenant Created Successfully!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "URL:      https://test.dockpulse.com"
echo -e "Login:    demo@dockpulse.com"
echo -e "Password: Demo123!"
echo ""
echo -e "Features enabled:"
echo -e "  ✅ All modules active"
echo -e "  ✅ 5 sample customers"
echo -e "  ✅ 5 sample products"
echo -e "  ✅ Custom branding (Indigo theme)"
echo ""
