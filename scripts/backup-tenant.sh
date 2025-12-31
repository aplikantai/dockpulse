#!/bin/bash

# =========================================
# DockPulse - Backup Tenant Script
# =========================================
# Usage: ./scripts/backup-tenant.sh --slug=acme [--output=/backups]

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
OUTPUT_DIR="/var/www/dockpulse.com/backups"

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --slug=*)
      SLUG="${1#*=}"
      ;;
    --output=*)
      OUTPUT_DIR="${1#*=}"
      ;;
    --all)
      BACKUP_ALL=true
      ;;
    --help)
      echo "Usage: $0 --slug=<slug> [--output=/path/to/backups]"
      echo "       $0 --all [--output=/path/to/backups]"
      echo ""
      echo "Options:"
      echo "  --slug   Tenant identifier to backup"
      echo "  --all    Backup all tenants"
      echo "  --output Output directory [default: /var/www/dockpulse.com/backups]"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
  shift
done

# Create output directory
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

backup_tenant() {
  local slug=$1
  local tenant_db="dockpulse_tenant_${slug}"
  local backup_file="${OUTPUT_DIR}/${slug}_${TIMESTAMP}.sql.gz"

  echo -e "${YELLOW}Backing up tenant: $slug${NC}"

  # Check if database exists
  DB_EXISTS=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$tenant_db'" 2>/dev/null | xargs)

  if [ "$DB_EXISTS" != "1" ]; then
    echo -e "${RED}Warning: Database $tenant_db does not exist, skipping${NC}"
    return
  fi

  # Backup database
  PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $tenant_db | gzip > "$backup_file"

  # Get file size
  SIZE=$(du -h "$backup_file" | cut -f1)
  echo -e "${GREEN}Backup created: $backup_file ($SIZE)${NC}"
}

if [ "$BACKUP_ALL" = true ]; then
  echo -e "${BLUE}==========================================${NC}"
  echo -e "${BLUE}  DockPulse - Backup All Tenants${NC}"
  echo -e "${BLUE}==========================================${NC}"
  echo ""

  # Backup platform database first
  PLATFORM_BACKUP="${OUTPUT_DIR}/platform_${TIMESTAMP}.sql.gz"
  echo -e "${YELLOW}Backing up platform database...${NC}"
  PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $PLATFORM_DB | gzip > "$PLATFORM_BACKUP"
  SIZE=$(du -h "$PLATFORM_BACKUP" | cut -f1)
  echo -e "${GREEN}Platform backup: $PLATFORM_BACKUP ($SIZE)${NC}"
  echo ""

  # Get all tenant slugs
  SLUGS=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $PLATFORM_DB -t -c "SELECT slug FROM tenants WHERE status='active'" 2>/dev/null | xargs)

  for slug in $SLUGS; do
    backup_tenant "$slug"
  done

  echo ""
  echo -e "${GREEN}All backups completed!${NC}"
  echo -e "Location: ${BLUE}$OUTPUT_DIR${NC}"

else
  if [ -z "$SLUG" ]; then
    echo -e "${RED}Error: --slug is required (or use --all)${NC}"
    exit 1
  fi

  echo -e "${BLUE}==========================================${NC}"
  echo -e "${BLUE}  DockPulse - Backup Tenant${NC}"
  echo -e "${BLUE}==========================================${NC}"
  echo ""

  backup_tenant "$SLUG"

  echo ""
  echo -e "${GREEN}Backup completed!${NC}"
fi
