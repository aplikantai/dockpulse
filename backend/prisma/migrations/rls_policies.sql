-- DockPulse SaaS - Row Level Security Policies
-- Wykonaj po migracji Prisma: npx prisma db execute --file prisma/migrations/rls_policies.sql

-- Enable RLS na tabelach tenant-scoped
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderStatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientUser" ENABLE ROW LEVEL SECURITY;

-- Funkcja helper do ustawiania tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_uuid::text, true);
END;
$$ LANGUAGE plpgsql;

-- Funkcja helper do pobierania tenant context
CREATE OR REPLACE FUNCTION get_tenant_context()
RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant', true), '')::uuid;
END;
$$ LANGUAGE plpgsql;

-- Policy dla Order
DROP POLICY IF EXISTS tenant_isolation_order ON "Order";
CREATE POLICY tenant_isolation_order ON "Order"
  USING ("tenantId" = get_tenant_context());

-- Policy dla Customer
DROP POLICY IF EXISTS tenant_isolation_customer ON "Customer";
CREATE POLICY tenant_isolation_customer ON "Customer"
  USING ("tenantId" = get_tenant_context());

-- Policy dla Product
DROP POLICY IF EXISTS tenant_isolation_product ON "Product";
CREATE POLICY tenant_isolation_product ON "Product"
  USING ("tenantId" = get_tenant_context());

-- Policy dla Attachment
DROP POLICY IF EXISTS tenant_isolation_attachment ON "Attachment";
CREATE POLICY tenant_isolation_attachment ON "Attachment"
  USING ("tenantId" = get_tenant_context());

-- Policy dla AuditEvent
DROP POLICY IF EXISTS tenant_isolation_audit ON "AuditEvent";
CREATE POLICY tenant_isolation_audit ON "AuditEvent"
  USING ("tenantId" = get_tenant_context());

-- Policy dla Membership
DROP POLICY IF EXISTS tenant_isolation_membership ON "Membership";
CREATE POLICY tenant_isolation_membership ON "Membership"
  USING ("tenantId" = get_tenant_context());

-- Policy dla OrderItem (przez Order)
DROP POLICY IF EXISTS tenant_isolation_order_item ON "OrderItem";
CREATE POLICY tenant_isolation_order_item ON "OrderItem"
  USING (
    EXISTS (
      SELECT 1 FROM "Order" o
      WHERE o.id = "orderId"
      AND o."tenantId" = get_tenant_context()
    )
  );

-- Policy dla OrderComment (przez Order)
DROP POLICY IF EXISTS tenant_isolation_order_comment ON "OrderComment";
CREATE POLICY tenant_isolation_order_comment ON "OrderComment"
  USING (
    EXISTS (
      SELECT 1 FROM "Order" o
      WHERE o.id = "orderId"
      AND o."tenantId" = get_tenant_context()
    )
  );

-- Policy dla OrderStatusHistory (przez Order)
DROP POLICY IF EXISTS tenant_isolation_order_status_history ON "OrderStatusHistory";
CREATE POLICY tenant_isolation_order_status_history ON "OrderStatusHistory"
  USING (
    EXISTS (
      SELECT 1 FROM "Order" o
      WHERE o.id = "orderId"
      AND o."tenantId" = get_tenant_context()
    )
  );

-- Policy dla ClientUser
DROP POLICY IF EXISTS tenant_isolation_client_user ON "ClientUser";
CREATE POLICY tenant_isolation_client_user ON "ClientUser"
  USING ("tenantId" = get_tenant_context());

-- Bypass RLS dla service role (dla migracji/seed)
-- W produkcji utworz osobnego usera z BYPASSRLS
-- ALTER USER dockpulse_service BYPASSRLS;
