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

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        domain: dto.domain,
        status: TenantStatus.PENDING,
        plan,
        settings: {
          modules: allowedModules,
          limits: planLimits,
          branding: {},
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
        active: true,
      },
    });

    return {
      tenant,
      message: 'Tenant utworzony. Użytkownik admin otrzyma email z linkiem aktywacyjnym.',
    };
  }

  async getTenants(filters?: {
    status?: TenantStatus;
    plan?: TenantPlan;
    search?: string;
  }): Promise<any[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.plan) {
      where.plan = filters.plan;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { domain: { contains: filters.search, mode: 'insensitive' } },
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
            active: true,
            lastLogin: true,
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

  async updateTenant(id: string, dto: UpdateTenantDto): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant nie znaleziony');
    }

    const currentSettings = tenant.settings as any || {};

    // If plan is changing, update modules and limits
    let newSettings = currentSettings;
    if (dto.plan && dto.plan !== tenant.plan) {
      const planLimits = PLAN_LIMITS[dto.plan];
      const currentModules = currentSettings.modules || [];
      const allowedModules = currentModules.filter((m: string) =>
        planLimits.modules.includes(m),
      );

      newSettings = {
        ...currentSettings,
        modules: allowedModules,
        limits: planLimits,
      };
    }

    // Update modules if provided
    if (dto.modules) {
      const plan = dto.plan || tenant.plan;
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

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.domain && { domain: dto.domain }),
        ...(dto.status && { status: dto.status }),
        ...(dto.plan && { plan: dto.plan }),
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

  async activateTenant(id: string): Promise<any> {
    return this.updateTenant(id, { status: TenantStatus.ACTIVE });
  }

  async suspendTenant(id: string): Promise<any> {
    return this.updateTenant(id, { status: TenantStatus.SUSPENDED });
  }

  async deleteTenant(id: string): Promise<{ success: boolean }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant nie znaleziony');
    }

    // Soft delete - mark as deleted
    await this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.DELETED },
    });

    return { success: true };
  }

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
      activeTenants,
      totalUsers,
      totalOrders,
      byPlan,
      byStatus,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.tenant.groupBy({
        by: ['plan'],
        _count: true,
      }),
      this.prisma.tenant.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalOrders,
      byPlan: byPlan.reduce(
        (acc, item) => ({ ...acc, [item.plan]: item._count }),
        {},
      ),
      byStatus: byStatus.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count }),
        {},
      ),
    };
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
}
