/**
 * DTOs for Platform Admin API
 */

export interface PlatformStatsDto {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    inactive: number;
    byPlan: {
      [key: string]: number;
    };
  };
  modules: {
    code: string;
    name: string;
    installations: number;
  }[];
  users: {
    total: number;
    active: number; // Active in last 30 days
  };
  revenue: {
    mrr: number;
    arr: number;
    growth: number;
  };
  recentTenants: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    plan: string;
  }[];
  issues: {
    suspendedTenants: number;
    failedPayments: number;
    expiredTrials: number;
  };
  storage: {
    totalUsed: number; // In bytes
    byTenant: {
      tenantId: string;
      tenantName: string;
      used: number;
    }[];
  };
  events: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  charts: {
    tenantsOverTime: {
      date: string;
      total: number;
      new: number;
    }[];
    mrrGrowth: {
      date: string;
      mrr: number;
      growth: number;
    }[];
  };
}

export interface TenantListDto {
  id: string;
  name: string;
  domain?: string;
  createdAt: Date;
  usersCount: number;
  modulesCount: number;
  storageUsed: number;
  lastActivity?: Date;
}

export interface TenantDetailDto extends TenantListDto {
  installedModules: {
    code: string;
    name: string;
    version: string;
    enabled: boolean;
    installedAt: Date;
  }[];
  users: {
    id: string;
    email: string;
    name?: string;
    role: string;
    lastLogin?: Date;
  }[];
  recentEvents: {
    id: string;
    eventType: string;
    entityType: string;
    createdAt: Date;
  }[];
}

export interface ModuleCatalogItemDto {
  code: string;
  name: string;
  description: string;
  version: string;
  category: string;
  author: string;
  minPlan: string;
  dependencies: string[];
  installations: number; // How many tenants installed this
  features: {
    code: string;
    name: string;
    description: string;
  }[];
}

export interface CreateTenantDto {
  name: string;
  slug?: string;
  domain?: string;
  template?: string;
  plan?: string;
  ownerEmail: string;
  ownerName?: string;
  ownerPassword?: string;
  settings?: Record<string, any>;
  branding?: Record<string, any>;
}

export interface UpdateTenantDto {
  name?: string;
  slug?: string;
  domain?: string;
  template?: string;
  plan?: string;
  status?: 'active' | 'suspended' | 'deleted';
  settings?: Record<string, any>;
  branding?: Record<string, any>;
}

export interface TenantUserDto {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface CreateTenantUserDto {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role: string;
  permissions?: string[];
}

export interface UpdateTenantUserDto {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  active?: boolean;
  permissions?: string[];
}

export interface TenantStatsDto {
  orders: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  customers: {
    total: number;
    thisMonth: number;
  };
  products: {
    total: number;
    active: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
}
