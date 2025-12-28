-- DockPulse Database Initialization
-- This script runs when PostgreSQL container starts for the first time

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dockpulse_platform TO dockpulse;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'DockPulse platform database initialized successfully';
END $$;
