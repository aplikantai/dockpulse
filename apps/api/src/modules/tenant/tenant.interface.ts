export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  branding?: any;
  settings?: any;
}

export const TENANT_CONTEXT = 'TENANT_CONTEXT';
