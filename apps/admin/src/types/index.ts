export enum TenantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  template: 'services' | 'production' | 'trade';
  status: TenantStatus;
  plan: TenantPlan;
  branding?: any;
  settings?: {
    modules?: string[];
    limits?: any;
    ai?: {
      openrouterApiKey?: string;
      models?: {
        text?: string;
        vision?: string;
        code?: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    customers: number;
    products: number;
    orders: number;
  };
}

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalOrders: number;
  byPlan: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface Module {
  code: string;
  name: string;
  description: string;
  icon: string;
}
