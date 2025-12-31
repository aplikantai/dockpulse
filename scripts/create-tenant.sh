#!/bin/bash

# =========================================
# DockPulse - Create Tenant Script
# =========================================
# Usage: ./scripts/create-tenant.sh --slug=acme --name="ACME Corp" --template=services --admin-email=admin@acme.com

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEMPLATE="services"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="dockpulse"
DB_PASS="PHJ20qgFqP8YAGsBo2MPRBp6XFnnPAHn"
PLATFORM_DB="dockpulse_platform"

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --slug=*)
      SLUG="${1#*=}"
      ;;
    --name=*)
      NAME="${1#*=}"
      ;;
    --template=*)
      TEMPLATE="${1#*=}"
      ;;
    --admin-email=*)
      ADMIN_EMAIL="${1#*=}"
      ;;
    --admin-password=*)
      ADMIN_PASSWORD="${1#*=}"
      ;;
    --help)
      echo "Usage: $0 --slug=<slug> --name=<name> [--template=services|production|trade] [--admin-email=<email>] [--admin-password=<password>]"
      echo ""
      echo "Options:"
      echo "  --slug           Unique tenant identifier (subdomain)"
      echo "  --name           Company name"
      echo "  --template       Business template (services, production, trade) [default: services]"
      echo "  --admin-email    Admin user email [optional]"
      echo "  --admin-password Admin user password [optional, auto-generated if not provided]"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
  shift
done

# Validate required arguments
if [ -z "$SLUG" ]; then
  echo -e "${RED}Error: --slug is required${NC}"
  exit 1
fi

if [ -z "$NAME" ]; then
  echo -e "${RED}Error: --name is required${NC}"
  exit 1
fi

# Validate slug format (lowercase, alphanumeric, hyphens)
if ! [[ "$SLUG" =~ ^[a-z0-9-]+$ ]]; then
  echo -e "${RED}Error: Slug must be lowercase alphanumeric with hyphens only${NC}"
  exit 1
fi

# Validate template
if [[ ! "$TEMPLATE" =~ ^(services|production|trade)$ ]]; then
  echo -e "${RED}Error: Template must be: services, production, or trade${NC}"
  exit 1
fi

TENANT_DB="dockpulse_tenant_${SLUG}"

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  DockPulse - Creating Tenant${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""
echo -e "Slug:     ${GREEN}$SLUG${NC}"
echo -e "Name:     ${GREEN}$NAME${NC}"
echo -e "Template: ${GREEN}$TEMPLATE${NC}"
echo -e "Database: ${GREEN}$TENANT_DB${NC}"
echo ""

# Step 1: Check if tenant already exists
echo -e "${YELLOW}[1/6] Checking if tenant exists...${NC}"
EXISTING=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $PLATFORM_DB -t -c "SELECT COUNT(*) FROM tenants WHERE slug='$SLUG'" 2>/dev/null | xargs)

if [ "$EXISTING" -gt 0 ]; then
  echo -e "${RED}Error: Tenant '$SLUG' already exists!${NC}"
  exit 1
fi

# Step 2: Create tenant database
echo -e "${YELLOW}[2/6] Creating tenant database...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $TENANT_DB OWNER $DB_USER;" 2>/dev/null || {
  echo -e "${RED}Error: Failed to create database${NC}"
  exit 1
}
echo -e "${GREEN}Database $TENANT_DB created${NC}"

# Step 3: Run Prisma migrations on tenant database
echo -e "${YELLOW}[3/6] Running database migrations...${NC}"
cd /var/www/dockpulse.com

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$TENANT_DB" \
  npx prisma db push --schema=./apps/api/prisma/schema.prisma --skip-generate 2>/dev/null || {
  echo -e "${RED}Error: Failed to run migrations${NC}"
  # Cleanup: drop the created database
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $TENANT_DB;" 2>/dev/null
  exit 1
}
echo -e "${GREEN}Migrations completed${NC}"

# Step 4: Register tenant in platform database
echo -e "${YELLOW}[4/6] Registering tenant in platform...${NC}"
TENANT_ID=$(uuidgen)
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $PLATFORM_DB -c "
  INSERT INTO tenants (id, slug, name, template, settings, branding, created_at, updated_at)
  VALUES (
    '$TENANT_ID',
    '$SLUG',
    '$NAME',
    '$TEMPLATE',
    '{\"modules\": {}, \"fields\": {}}',
    '{\"logoUrl\": \"/assets/default-logo.png\", \"faviconUrl\": \"/favicon.ico\", \"colors\": {\"primary\": \"#2B579A\", \"secondary\": \"#4472C4\", \"accent\": \"#70AD47\"}}',
    NOW(),
    NOW()
  );
" 2>/dev/null || {
  echo -e "${RED}Error: Failed to register tenant${NC}"
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $TENANT_DB;" 2>/dev/null
  exit 1
}
echo -e "${GREEN}Tenant registered with ID: $TENANT_ID${NC}"

# Step 5: Seed default modules for template
echo -e "${YELLOW}[5/6] Seeding default modules...${NC}"

# Define modules per template
case "$TEMPLATE" in
  services)
    MODULES="@customers,@orders,@products,@quotes,@portal,@calendar"
    ;;
  production)
    MODULES="@customers,@orders,@products,@quotes,@portal,@stock,@production"
    ;;
  trade)
    MODULES="@customers,@orders,@products,@quotes,@portal,@stock,@invoicing"
    ;;
esac

IFS=',' read -ra MODULE_ARRAY <<< "$MODULES"
for MODULE in "${MODULE_ARRAY[@]}"; do
  MODULE_ID=$(uuidgen)
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TENANT_DB -c "
    INSERT INTO tenant_modules (id, tenant_id, module_code, is_enabled, config, created_at, updated_at)
    VALUES ('$MODULE_ID', '$TENANT_ID', '$MODULE', true, '{}', NOW(), NOW())
    ON CONFLICT DO NOTHING;
  " 2>/dev/null
done
echo -e "${GREEN}Modules seeded: $MODULES${NC}"

# Step 6: Create admin user if email provided
if [ -n "$ADMIN_EMAIL" ]; then
  echo -e "${YELLOW}[6/6] Creating admin user...${NC}"

  # Generate password if not provided
  if [ -z "$ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 12)
    echo -e "${YELLOW}Generated password: ${GREEN}$ADMIN_PASSWORD${NC}"
  fi

  # Hash password using bcrypt (via node)
  HASHED_PASSWORD=$(node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 10));")

  USER_ID=$(uuidgen)
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TENANT_DB -c "
    INSERT INTO users (id, tenant_id, email, password, name, role, created_at, updated_at)
    VALUES ('$USER_ID', '$TENANT_ID', '$ADMIN_EMAIL', '$HASHED_PASSWORD', 'Administrator', 'admin', NOW(), NOW());
  " 2>/dev/null || {
    echo -e "${YELLOW}Warning: Could not create admin user (user table might not exist yet)${NC}"
  }
  echo -e "${GREEN}Admin user created: $ADMIN_EMAIL${NC}"
else
  echo -e "${YELLOW}[6/6] Skipping admin user creation (no email provided)${NC}"
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Tenant Created Successfully!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "URL:      ${BLUE}https://${SLUG}.dockpulse.com${NC}"
echo -e "Database: ${BLUE}$TENANT_DB${NC}"
echo -e "Template: ${BLUE}$TEMPLATE${NC}"
if [ -n "$ADMIN_EMAIL" ]; then
  echo -e "Admin:    ${BLUE}$ADMIN_EMAIL${NC}"
fi
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Configure DNS: Add CNAME record for ${SLUG}.dockpulse.com"
echo -e "2. Login at: https://${SLUG}.dockpulse.com/login"
echo -e "3. Run auto-branding from settings to customize appearance"
echo ""
