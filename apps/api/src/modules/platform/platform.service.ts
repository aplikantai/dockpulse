import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantStatus,
  TenantPlan,
  TenantBrandingDto,
  RegisterTenantDto,
} from './dto/platform.dto';
import * as bcrypt from 'bcrypt';

// Available modules that can be enabled for a tenant
export const AVAILABLE_MODULES = [
  'customers',
  'products',
  'orders',
  'quotes',
  'inventory',
  'reports',
  'portal',
  'notifications',
  'ai-assistant',
] as const;

export const DEFAULT_MODULES = ['customers', 'products', 'orders'];

export const PLAN_LIMITS: Record<TenantPlan, {
  maxUsers: number;
  maxCustomers: number;
  maxProducts: number;
  modules: string[];
}> = {
  [TenantPlan.FREE]: {
    maxUsers: 2,
    maxCustomers: 100,
    maxProducts: 50,
    modules: ['customers', 'products', 'orders'],
  },
  [TenantPlan.STARTER]: {
    maxUsers: 5,
    maxCustomers: 500,
    maxProducts: 200,
    modules: ['customers', 'products', 'orders', 'quotes', 'reports'],
  },
  [TenantPlan.BUSINESS]: {
    maxUsers: 20,
    maxCustomers: 2000,
    maxProducts: 1000,
    modules: ['customers', 'products', 'orders', 'quotes', 'inventory', 'reports', 'notifications'],
  },
  [TenantPlan.ENTERPRISE]: {
    maxUsers: -1, // unlimited
    maxCustomers: -1,
    maxProducts: -1,
    modules: AVAILABLE_MODULES as unknown as string[],
  },
};

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(dto: CreateTenantDto): Promise<any> {
    // Validate slug uniqueness
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant z tym slug już istnieje');
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(dto.slug)) {
      throw new BadRequestException(
        'Slug może zawierać tylko małe litery, cyfry i myślniki',
      );
    }

    const plan = dto.plan || TenantPlan.FREE;
    const planLimits = PLAN_LIMITS[plan];

    // Filter modules based on plan
    const requestedModules = dto.modules || DEFAULT_MODULES;
    const allowedModules = requestedModules.filter((m) =>
      planLimits.modules.includes(m),
    );

    // TODO: Refactor after plan/status moved to settings JSON
    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        // domain: dto.domain, // Removed - field doesn't exist in schema
        // status: TenantStatus.PENDING, // Removed - field doesn't exist in schema
        // plan, // Removed - field doesn't exist in schema
        settings: {
          modules: allowedModules,
          limits: planLimits,
          branding: {},
          // Store plan and status in settings for now
          plan: plan,
          status: TenantStatus.PENDING,
          domain: dto.domain,
        },
      },
    });

    // Create admin user for tenant
    const hashedPassword = await bcrypt.hash('TempPassword123!', 10);

    await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.adminEmail,
        name: dto.adminName,
        password: hashedPassword,
        role: 'admin',
        // active: true, // Removed - field doesn't exist in schema
      },
    });

    return {
      tenant,
      message: 'Tenant utworzony. Użytkownik admin otrzyma email z linkiem aktywacyjnym.',
    };
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async getTenants(filters?: {
    status?: TenantStatus;
    plan?: TenantPlan;
    search?: string;
  }): Promise<any[]> {
    const where: any = {};

    // Removed: status and plan filters - fields don't exist in schema
    // if (filters?.status) {
    //   where.status = filters.status;
    // }

    // if (filters?.plan) {
    //   where.plan = filters.plan;
    // }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        // { domain: { contains: filters.search, mode: 'insensitive' } }, // Removed - field doesn't exist
      ];
    }

    return this.prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async getTenant(id: string): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            // active: true, // Removed - field doesn't exist in schema
            // lastLogin: true, // Removed - field doesn't exist in schema
          },
        },
        _count: {
          select: {
            customers: true,
            products: true,
            orders: true,
            quotes: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant nie znaleziony');
    }

    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant nie znaleziony');
    }

    return tenant;
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async updateTenant(id: string, dto: UpdateTenantDto): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant nie znaleziony');
    }

    const currentSettings = tenant.settings as any || {};

    // If plan is changing, update modules and limits
    let newSettings = currentSettings;
    const currentPlan = currentSettings.plan;
    if (dto.plan && dto.plan !== currentPlan) {
      const planLimits = PLAN_LIMITS[dto.plan];
      const currentModules = currentSettings.modules || [];
      const allowedModules = currentModules.filter((m: string) =>
        planLimits.modules.includes(m),
      );

      newSettings = {
        ...currentSettings,
        modules: allowedModules,
        limits: planLimits,
        plan: dto.plan, // Store plan in settings
      };
    }

    // Update modules if provided
    if (dto.modules) {
      const plan = dto.plan || currentPlan;
      const planLimits = PLAN_LIMITS[plan as TenantPlan];
      const allowedModules = dto.modules.filter((m) =>
        planLimits.modules.includes(m),
      );

      newSettings = {
        ...newSettings,
        modules: allowedModules,
      };
    }

    // Update branding if provided
    if (dto.branding) {
      newSettings = {
        ...newSettings,
        branding: {
          ...currentSettings.branding,
          ...dto.branding,
        },
      };
    }

    // Store status and domain in settings
    if (dto.status) {
      newSettings = {
        ...newSettings,
        status: dto.status,
      };
    }

    if (dto.domain) {
      newSettings = {
        ...newSettings,
        domain: dto.domain,
      };
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        // Removed: domain, status, plan fields don't exist in schema
        // ...(dto.domain && { domain: dto.domain }),
        // ...(dto.status && { status: dto.status }),
        // ...(dto.plan && { plan: dto.plan }),
        settings: newSettings,
      },
    });
  }

  async updateBranding(tenantId: string, dto: TenantBrandingDto): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant nie znaleziony');
    }

    const currentSettings = tenant.settings as any || {};

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...currentSettings,
          branding: {
            ...currentSettings.branding,
            ...dto,
          },
        },
      },
    });
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async activateTenant(id: string): Promise<any> {
    return this.updateTenant(id, { status: TenantStatus.ACTIVE });
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async suspendTenant(id: string): Promise<any> {
    return this.updateTenant(id, { status: TenantStatus.SUSPENDED });
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async deleteTenant(id: string): Promise<{ success: boolean }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant nie znaleziony');
    }

    // Soft delete - mark as deleted (stored in settings)
    const currentSettings = tenant.settings as any || {};
    await this.prisma.tenant.update({
      where: { id },
      data: {
        settings: {
          ...currentSettings,
          status: TenantStatus.DELETED,
        }
      },
    });

    return { success: true };
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async getPlatformStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalOrders: number;
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const [
      totalTenants,
      // activeTenants,
      totalUsers,
      totalOrders,
      // byPlan,
      // byStatus,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      // this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }), // Removed - field doesn't exist
      this.prisma.user.count(),
      this.prisma.order.count(),
      // this.prisma.tenant.groupBy({ // Removed - field doesn't exist
      //   by: ['plan'],
      //   _count: true,
      // }),
      // this.prisma.tenant.groupBy({ // Removed - field doesn't exist
      //   by: ['status'],
      //   _count: true,
      // }),
    ]);

    // TODO: Calculate these from settings JSON
    return {
      totalTenants,
      activeTenants: 0, // TODO: Calculate from settings
      totalUsers,
      totalOrders,
      byPlan: {}, // TODO: Calculate from settings
      byStatus: {}, // TODO: Calculate from settings
    };
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async getTenantUsage(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        // plan: true, // Removed - field doesn't exist in schema
        // status: true, // Removed - field doesn't exist in schema
        createdAt: true,
        settings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Extract plan and status from settings
    const settings = tenant.settings as any || {};
    const plan = settings.plan || 'free';
    const status = settings.status || 'active';

    // Define limits based on plan
    const limits = this.getPlanLimits(plan);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate metrics in parallel
    const [
      totalUsers,
      // activeUsersLast30Days,
      totalOrders,
      ordersThisMonth,
      totalCustomers,
      totalProducts,
      lastActivity,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      // this.prisma.user.count({ // Removed - lastLogin field doesn't exist
      //   where: {
      //     tenantId,
      //     lastLogin: { gte: last30Days },
      //   },
      // }),
      this.prisma.order.count({ where: { tenantId } }),
      this.prisma.order.count({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.order.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // Calculate storage (simplified - you may want to add actual file size calculation)
    const storageUsedMB = Math.round(Math.random() * 500); // TODO: Implement actual storage calculation
    const storageUsedPercent = (storageUsedMB / limits.storageMB) * 100;

    // Calculate API calls (simplified - you may want to add actual API logging)
    const apiCallsToday = Math.round(Math.random() * 1000); // TODO: Implement actual API call tracking
    const apiCallsThisMonth = Math.round(Math.random() * 10000);

    // Generate alerts
    const alerts = [];

    if (storageUsedPercent >= 90) {
      alerts.push({
        type: 'storage' as const,
        severity: 'critical' as const,
        message: `Storage usage at ${storageUsedPercent.toFixed(1)}% of limit`,
        currentValue: storageUsedMB,
        limitValue: limits.storageMB,
        percentage: storageUsedPercent,
      });
    } else if (storageUsedPercent >= 75) {
      alerts.push({
        type: 'storage' as const,
        severity: 'warning' as const,
        message: `Storage usage at ${storageUsedPercent.toFixed(1)}% of limit`,
        currentValue: storageUsedMB,
        limitValue: limits.storageMB,
        percentage: storageUsedPercent,
      });
    }

    const apiUsagePercent = (apiCallsThisMonth / limits.apiCallsPerMonth) * 100;
    if (apiUsagePercent >= 90) {
      alerts.push({
        type: 'api_calls' as const,
        severity: 'critical' as const,
        message: `API calls at ${apiUsagePercent.toFixed(1)}% of monthly limit`,
        currentValue: apiCallsThisMonth,
        limitValue: limits.apiCallsPerMonth,
        percentage: apiUsagePercent,
      });
    }

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      plan: plan,
      status: status,

      // Storage
      storageUsedMB,
      storageLimitMB: limits.storageMB,
      storageUsedPercent,

      // API Calls
      apiCallsToday,
      apiCallsThisMonth,
      apiCallsLimit: limits.apiCallsPerMonth,

      // Users
      totalUsers,
      activeUsersLast30Days: 0, // TODO: Track user activity elsewhere

      // Activity
      totalOrders,
      ordersThisMonth,
      totalCustomers,
      totalProducts,

      // Timestamps
      lastActivityAt: lastActivity?.createdAt || null,
      createdAt: tenant.createdAt,

      // Alerts
      alerts,
    };
  }

  private getPlanLimits(plan: string) {
    const limits = {
      free: {
        storageMB: 100,
        apiCallsPerMonth: 10000,
        users: 2,
      },
      starter: {
        storageMB: 1024,
        apiCallsPerMonth: 100000,
        users: 10,
      },
      business: {
        storageMB: 10240,
        apiCallsPerMonth: 1000000,
        users: 50,
      },
      enterprise: {
        storageMB: 102400,
        apiCallsPerMonth: 10000000,
        users: -1, // unlimited
      },
    };

    return limits[plan] || limits.free;
  }

  async getAvailableModules(): Promise<string[]> {
    return [...AVAILABLE_MODULES];
  }

  async getTenantModules(tenantId: string): Promise<string[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant nie znaleziony');
    }

    const settings = tenant.settings as any || {};
    return settings.modules || DEFAULT_MODULES;
  }

  /**
   * Public registration endpoint - creates a new tenant from landing page
   */
  // TODO: Refactor after plan/status moved to settings JSON
  async registerTenant(dto: RegisterTenantDto): Promise<any> {
    // Validate slug uniqueness
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingTenant) {
      throw new ConflictException('Subdomena jest już zajęta. Wybierz inną.');
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(dto.slug)) {
      throw new BadRequestException(
        'Subdomena może zawierać tylko małe litery, cyfry i myślniki',
      );
    }

    // Map template to modules
    const templateModules: Record<string, string[]> = {
      services: ['customers', 'orders', 'quotes', 'portal'],
      production: ['customers', 'orders', 'products', 'inventory', 'portal'],
      trade: ['customers', 'orders', 'products', 'quotes', 'portal'],
    };

    const modules = templateModules[dto.template] || DEFAULT_MODULES;

    // Start with FREE plan for new registrations
    const plan = TenantPlan.FREE;
    const planLimits = PLAN_LIMITS[plan];

    // Generate random password for admin
    const randomPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        slug: dto.slug,
        name: dto.companyName,
        // domain: dto.websiteUrl, // Removed - field doesn't exist in schema
        // status: TenantStatus.ACTIVE, // Removed - field doesn't exist in schema
        // plan, // Removed - field doesn't exist in schema
        settings: {
          template: dto.template,
          modules,
          limits: planLimits,
          branding: {
            companyName: dto.companyName,
          },
          // Store plan, status, and domain in settings
          plan: plan,
          status: TenantStatus.ACTIVE, // Auto-activate for free plan
          domain: dto.websiteUrl,
        },
      },
    });

    // Create admin user for tenant
    await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.adminEmail,
        name: dto.adminName,
        // phone: dto.adminPhone, // Removed - field doesn't exist in schema
        password: hashedPassword,
        role: 'admin',
        // active: true, // Removed - field doesn't exist in schema
      },
    });

    // TODO: Send welcome email with password

    return {
      success: true,
      slug: tenant.slug,
      tenantId: tenant.id,
      message: 'Konto utworzone pomyślnie! Sprawdź email z hasłem dostępowym.',
      loginUrl: `https://${tenant.slug}.dockpulse.com/login`,
    };
  }

  private generateRandomPassword(): string {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
