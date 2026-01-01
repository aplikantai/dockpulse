/**
 * DTOs for Platform Admin API
 */

export interface PlatformStatsDto {
  tenants: {
    total: number;
    active: number;
    inactive: number;
    byPlan: {
      [key: string]: number;
    };
  };
  modules: {
    total: number;
    installed: number; // Total installations across all tenants
    byModule: {
      [moduleCode: string]: {
        name: string;
        installations: number;
      };
    };
  };
  users: {
    total: number;
    active: number; // Active in last 30 days
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
  domain?: string;
  ownerEmail: string;
  ownerName?: string;
}

export interface UpdateTenantPlanDto {
  tenantId: string;
}
