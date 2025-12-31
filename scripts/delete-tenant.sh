#!/bin/bash

# =========================================
# DockPulse - Delete Tenant Script
# =========================================
# Usage: ./scripts/delete-tenant.sh --slug=acme [--force]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="dockpulse"
DB_PASS="PHJ20qgFqP8YAGsBo2MPRBp6XFnnPAHn"
PLATFORM_DB="dockpulse_platform"
FORCE=false

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --slug=*)
      SLUG="${1#*=}"
      ;;
    --force)
      FORCE=true
      ;;
    --help)
      echo "Usage: $0 --slug=<slug> [--force]"
      echo ""
      echo "Options:"
      echo "  --slug   Tenant identifier to delete"
      echo "  --force  Skip confirmation prompt"
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

TENANT_DB="dockpulse_tenant_${SLUG}"

# Check if tenant exists
EXISTING=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $PLATFORM_DB -t -c "SELECT COUNT(*) FROM tenants WHERE slug='$SLUG'" 2>/dev/null | xargs)

if [ "$EXISTING" -eq 0 ]; then
  echo -e "${RED}Error: Tenant '$SLUG' does not exist!${NC}"
  exit 1
fi

echo -e "${RED}==========================================${NC}"
echo -e "${RED}  WARNING: DELETING TENANT${NC}"
echo -e "${RED}==========================================${NC}"
echo ""
echo -e "Slug:     ${YELLOW}$SLUG${NC}"
echo -e "Database: ${YELLOW}$TENANT_DB${NC}"
echo ""
echo -e "${RED}This will permanently delete:${NC}"
echo -e "  - All tenant data"
echo -e "  - All users"
echo -e "  - All customers"
echo -e "  - All orders"
echo -e "  - The entire database"
echo ""

if [ "$FORCE" = false ]; then
  read -p "Type '$SLUG' to confirm deletion: " CONFIRM
  if [ "$CONFIRM" != "$SLUG" ]; then
    echo -e "${YELLOW}Deletion cancelled.${NC}"
    exit 0
  fi
fi

echo ""
echo -e "${YELLOW}[1/3] Removing tenant from platform...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $PLATFORM_DB -c "DELETE FROM tenants WHERE slug='$SLUG';" 2>/dev/null
echo -e "${GREEN}Tenant removed from platform${NC}"

echo -e "${YELLOW}[2/3] Dropping tenant database...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $TENANT_DB;" 2>/dev/null
echo -e "${GREEN}Database dropped${NC}"

echo -e "${YELLOW}[3/3] Cleaning up uploads...${NC}"
rm -rf "/var/www/dockpulse.com/uploads/tenants/$SLUG" 2>/dev/null || true
echo -e "${GREEN}Uploads cleaned${NC}"

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Tenant '$SLUG' deleted successfully${NC}"
echo -e "${GREEN}==========================================${NC}"
