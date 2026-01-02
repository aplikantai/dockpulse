import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  PlatformStatsDto,
  TenantListDto,
  TenantDetailDto,
  ModuleCatalogItemDto,
  CreateTenantDto,
} from '../dto/platform-stats.dto';
import {
  MODULE_REGISTRY,
  getAllModules,
  getModuleByCode,
  ModuleCode,
} from '../../platform/module-registry';

/**
 * AdminService - Business logic for Platform Admin Panel
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(): Promise<PlatformStatsDto> {
    this.logger.log('Fetching platform statistics...');

    // Tenants stats
    const allTenants = await this.prisma.tenant.findMany({
      include: {
        users: true,
        modules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalTenants = allTenants.length;

    // Active tenants = has users who logged in within last 30 days
    const activeTenants = allTenants.filter(t => {
      return t.users.some(u => {
        if (!u.lastLogin) return false;
        const daysSinceLogin = (Date.now() - u.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLogin <= 30;
      });
    }).length;

    // Trial tenants = created within last 14 days (mock for now - TODO: add trial field)
    const trialTenants = allTenants.filter(t => {
      const daysSinceCreation = (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 14;
    }).length;

    // Suspended tenants (mock - TODO: add status field)
    const suspendedTenants = 0;

    const tenantsByPlan: { [key: string]: number } = {};
    allTenants.forEach(t => {
      const plan = 'FREE'; // TODO: Add plan field to Tenant model
      tenantsByPlan[plan] = (tenantsByPlan[plan] || 0) + 1;
    });

    // Modules stats
    const allModules = getAllModules();
    const moduleInstallations: { [code: string]: number } = {};

    // Count installations from TenantModule table
    const tenantModules = await this.prisma.tenantModule.groupBy({
      by: ['moduleCode'],
      _count: {
        moduleCode: true,
      },
    });

    tenantModules.forEach(tm => {
      moduleInstallations[tm.moduleCode] = tm._count.moduleCode;
    });

    const modulesByModule: { [code: string]: { name: string; installations: number } } = {};
    allModules.forEach(mod => {
      modulesByModule[mod.code] = {
        name: mod.name,
        installations: moduleInstallations[mod.code] || 0,
      };
    });

    const totalInstallations = Object.values(moduleInstallations).reduce((sum, count) => sum + count, 0);

    // Users stats
    const allUsers = await this.prisma.user.findMany();
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => {
      if (!u.lastLogin) return false;
      const daysSinceLogin = (Date.now() - u.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLogin <= 30;
    }).length;

    // Storage stats (mock for now - TODO: implement real storage tracking)
    const storageByTenant = allTenants.map(t => ({
      tenantId: t.id,
      tenantName: t.name,
      used: 0, // TODO: Calculate real storage
    }));

    // Events stats
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [events24h, events7d, events30d] = await Promise.all([
      this.prisma.eventLog.count({ where: { createdAt: { gte: last24h } } }),
      this.prisma.eventLog.count({ where: { createdAt: { gte: last7d } } }),
      this.prisma.eventLog.count({ where: { createdAt: { gte: last30d } } }),
    ]);

    // Calculate MRR and ARR (mock for now - TODO: integrate with real billing)
    const modulesByCode = allModules.reduce((acc, mod) => {
      acc[mod.code] = mod;
      return acc;
    }, {} as Record<string, any>);

    let totalMRR = 0;
    allTenants.forEach(t => {
      t.modules.forEach(tm => {
        if (tm.isEnabled) {
          const moduleDef = modulesByCode[tm.moduleCode];
          if (moduleDef && moduleDef.price) {
            totalMRR += moduleDef.price;
          }
        }
      });
    });

    const totalARR = totalMRR * 12;
    const revenueGrowth = 15.5; // Mock - TODO: calculate real growth

    // Get top modules with installation counts
    const topModules = Object.entries(modulesByModule)
      .sort((a, b) => b[1].installations - a[1].installations)
      .slice(0, 5)
      .map(([code, data]) => ({
        code,
        name: data.name,
        installations: data.installations,
      }));

    // Get recent tenants
    const recentTenants = allTenants.slice(0, 5).map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      createdAt: t.createdAt.toISOString(),
      plan: 'FREE', // TODO: Add real plan
    }));

    // Calculate issues
    const expiredTrials = allTenants.filter(t => {
      const daysSinceCreation = (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation > 14 && daysSinceCreation <= 16; // Trial expired 0-2 days ago
    }).length;

    // Generate chart data for last 12 months
    const tenantsOverTime = await this.generateTenantsOverTimeData(allTenants);
    const mrrGrowthData = await this.generateMRRGrowthData(allTenants, modulesByCode);

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        trial: trialTenants,
        suspended: suspendedTenants,
        inactive: totalTenants - activeTenants,
        byPlan: tenantsByPlan,
      },
      modules: topModules,
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      revenue: {
        mrr: totalMRR,
        arr: totalARR,
        growth: revenueGrowth,
      },
      recentTenants,
      issues: {
        suspendedTenants,
        failedPayments: 0, // TODO: Add real billing data
        expiredTrials,
      },
      storage: {
        totalUsed: 0, // TODO: Calculate total
        byTenant: storageByTenant,
      },
      events: {
        last24h: events24h,
        last7d: events7d,
        last30d: events30d,
      },
      charts: {
        tenantsOverTime,
        mrrGrowth: mrrGrowthData,
      },
    };
  }

  /**
   * Generate tenants over time data (last 12 months)
   */
  private async generateTenantsOverTimeData(allTenants: any[]): Promise<{
    date: string;
    total: number;
    new: number;
  }[]> {
    const now = new Date();
    const data = [];

    // Generate data for last 12 months
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      // Count tenants created up to this month
      const totalByMonth = allTenants.filter(
        t => new Date(t.createdAt) <= monthEnd,
      ).length;

      // Count new tenants in this month
      const newInMonth = allTenants.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;

      data.push({
        date: targetDate.toLocaleDateString('pl-PL', {
          month: 'short',
          year: 'numeric',
        }),
        total: totalByMonth,
        new: newInMonth,
      });
    }

    return data;
  }

  /**
   * Generate MRR growth data (last 12 months)
   */
  private async generateMRRGrowthData(
    allTenants: any[],
    modulesByCode: Record<string, any>,
  ): Promise<{
    date: string;
    mrr: number;
    growth: number;
  }[]> {
    const now = new Date();
    const data = [];
    let previousMRR = 0;

    // Generate data for last 12 months
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      // Calculate MRR for tenants that existed at end of this month
      let monthMRR = 0;
      const existingTenants = allTenants.filter(
        t => new Date(t.createdAt) <= monthEnd,
      );

      existingTenants.forEach(tenant => {
        tenant.modules.forEach(tm => {
          // Only count modules that were enabled
          if (tm.isEnabled) {
            const moduleDef = modulesByCode[tm.moduleCode];
            if (moduleDef && moduleDef.price) {
              monthMRR += moduleDef.price;
            }
          }
        });
      });

      // Calculate growth percentage
      const growth = previousMRR > 0 ? ((monthMRR - previousMRR) / previousMRR) * 100 : 0;

      data.push({
        date: targetDate.toLocaleDateString('pl-PL', {
          month: 'short',
          year: 'numeric',
        }),
        mrr: Math.round(monthMRR),
        growth: Math.round(growth * 10) / 10, // Round to 1 decimal
      });

      previousMRR = monthMRR;
    }

    return data;
  }

  /**
   * Get list of all tenants
   */
  async getTenants(): Promise<TenantListDto[]> {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        users: {
          orderBy: { lastLogin: 'desc' },
          take: 1,
        },
        modules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map(t => ({
      id: t.id,
      name: t.name,
      domain: undefined, // TODO: Add domain field
      createdAt: t.createdAt,
      usersCount: t.users.length,
      modulesCount: t.modules.length,
      storageUsed: 0, // TODO: Calculate storage
      lastActivity: t.users[0]?.lastLogin,
    }));
  }

  /**
   * Get tenant details
   */
  async getTenantDetail(tenantId: string): Promise<TenantDetailDto> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      include: {
        users: {
          orderBy: { lastLogin: 'desc' },
        },
        modules: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Get recent events
    const recentEvents = await this.prisma.eventLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Map installed modules with details from registry
    const installedModules = tenant.modules.map(tm => {
      const moduleDef = getModuleByCode(tm.moduleCode as ModuleCode);
      return {
        code: tm.moduleCode,
        name: moduleDef?.namePl || moduleDef?.name || tm.moduleCode,
        version: '1.0.0',
        enabled: tm.isEnabled,
        installedAt: tm.createdAt,
      };
    });

    return {
      id: tenant.id,
      name: tenant.name,
      domain: undefined,
      createdAt: tenant.createdAt,
      usersCount: tenant.users.length,
      modulesCount: tenant.modules.length,
      storageUsed: 0,
      lastActivity: tenant.users[0]?.lastLogin,
      installedModules,
      users: tenant.users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name || undefined,
        role: u.role,
        lastLogin: u.lastLogin || undefined,
      })),
      recentEvents: recentEvents.map(e => ({
        id: e.id,
        eventType: e.eventType,
        entityType: e.entityType,
        createdAt: e.createdAt,
      })),
    };
  }

  /**
   * Get module catalog
   */
  async getModuleCatalog(): Promise<ModuleCatalogItemDto[]> {
    const allModules = getAllModules();

    // Get installation counts
    const installationCounts = await this.prisma.tenantModule.groupBy({
      by: ['moduleCode'],
      _count: {
        moduleCode: true,
      },
    });

    const installCountMap: { [code: string]: number } = {};
    installationCounts.forEach(ic => {
      installCountMap[ic.moduleCode] = ic._count.moduleCode;
    });

    return allModules.map(mod => ({
      code: mod.code,
      name: mod.namePl || mod.name,
      description: mod.descriptionPl || mod.description,
      version: '1.0.0',
      category: mod.category,
      author: 'DockPulse',
      minPlan: mod.price ? 'STARTER' : 'FREE',
      dependencies: mod.dependencies?.map(d => d.toString()) || [],
      installations: installCountMap[mod.code] || 0,
      features: mod.features.map(f => ({
        code: f,
        name: f,
        description: f,
      })),
    }));
  }

  /**
   * Create new tenant
   */
  async createTenant(dto: CreateTenantDto): Promise<TenantDetailDto> {
    this.logger.log(`Creating new tenant: ${dto.name}`);

    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug,
        users: {
          create: {
            email: dto.ownerEmail,
            name: dto.ownerName,
            role: 'ADMIN',
            password: 'TEMP_PASSWORD_CHANGE_ME', // TODO: Generate secure password and send email
          },
        },
      },
      include: {
        users: true,
        modules: true,
      },
    });

    this.logger.log(`Tenant created: ${tenant.id}`);

    return {
      id: tenant.id,
      name: tenant.name,
      domain: undefined,
      createdAt: tenant.createdAt,
      usersCount: tenant.users.length,
      modulesCount: 0,
      storageUsed: 0,
      lastActivity: undefined,
      installedModules: [],
      users: tenant.users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name || undefined,
        role: u.role,
        lastLogin: u.lastLogin || undefined,
      })),
      recentEvents: [],
    };
  }

  /**
   * Install module for tenant (Platform Admin can force-install)
   */
  async installModuleForTenant(tenantId: string, moduleCode: string): Promise<void> {
    this.logger.log(`Platform Admin installing module ${moduleCode} for tenant ${tenantId}`);

    // Verify module exists
    const moduleDef = getModuleByCode(moduleCode as ModuleCode);
    if (!moduleDef) {
      throw new Error(`Module ${moduleCode} not found in registry`);
    }

    // Install (upsert)
    await this.prisma.tenantModule.upsert({
      where: {
        tenantId_moduleCode: {
          tenantId,
          moduleCode,
        },
      },
      create: {
        tenantId,
        moduleCode,
        isEnabled: true,
        config: {},
      },
      update: {
        isEnabled: true,
      },
    });

    this.logger.log(`Module ${moduleCode} installed successfully for tenant ${tenantId}`);
  }

  /**
   * Uninstall module from tenant
   */
  async uninstallModuleFromTenant(tenantId: string, moduleCode: string): Promise<void> {
    this.logger.log(`Platform Admin uninstalling module ${moduleCode} from tenant ${tenantId}`);

    // Soft delete - just disable
    await this.prisma.tenantModule.update({
      where: {
        tenantId_moduleCode: {
          tenantId,
          moduleCode,
        },
      },
      data: {
        isEnabled: false,
      },
    });

    this.logger.log(`Module ${moduleCode} uninstalled from tenant ${tenantId}`);
  }
}
