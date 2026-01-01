import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ModuleRegistryService } from '../../module-registry/module-registry.service';
import {
  PlatformStatsDto,
  TenantListDto,
  TenantDetailDto,
  ModuleCatalogItemDto,
  CreateTenantDto,
} from '../dto/platform-stats.dto';

/**
 * AdminService - Business logic for Platform Admin Panel
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRegistry: ModuleRegistryService,
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
      },
    });

    const totalTenants = allTenants.length;
    const activeTenants = allTenants.filter(t => {
      // Active = has users who logged in within last 30 days
      return t.users.some(u => {
        if (!u.lastLogin) return false;
        const daysSinceLogin = (Date.now() - u.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLogin <= 30;
      });
    }).length;

    const tenantsByPlan: { [key: string]: number } = {};
    allTenants.forEach(t => {
      const plan = 'FREE'; // TODO: Add plan field to Tenant model
      tenantsByPlan[plan] = (tenantsByPlan[plan] || 0) + 1;
    });

    // Modules stats
    const allModules = this.moduleRegistry.getAllModules();
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

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        inactive: totalTenants - activeTenants,
        byPlan: tenantsByPlan,
      },
      modules: {
        total: allModules.length,
        installed: totalInstallations,
        byModule: modulesByModule,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
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
    };
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
      const moduleDef = this.moduleRegistry.getModule(tm.moduleCode);
      return {
        code: tm.moduleCode,
        name: moduleDef?.name || tm.moduleCode,
        version: moduleDef?.version || '1.0.0',
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
    const allModules = this.moduleRegistry.getAllModules();

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
      name: mod.name,
      description: mod.description,
      version: mod.version,
      category: mod.category,
      author: mod.author,
      minPlan: mod.minPlan,
      dependencies: mod.dependencies,
      installations: installCountMap[mod.code] || 0,
      features: mod.features.map(f => ({
        code: f.code,
        name: f.name,
        description: f.description,
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

    await this.moduleRegistry.installModule(tenantId, moduleCode);

    this.logger.log(`Module ${moduleCode} installed successfully for tenant ${tenantId}`);
  }

  /**
   * Uninstall module from tenant
   */
  async uninstallModuleFromTenant(tenantId: string, moduleCode: string): Promise<void> {
    this.logger.log(`Platform Admin uninstalling module ${moduleCode} from tenant ${tenantId}`);

    await this.moduleRegistry.uninstallModule(tenantId, moduleCode);

    this.logger.log(`Module ${moduleCode} uninstalled from tenant ${tenantId}`);
  }
}
