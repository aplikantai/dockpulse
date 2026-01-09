import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import {
  PlatformStatsDto,
  TenantListDto,
  TenantDetailDto,
  ModuleCatalogItemDto,
  CreateTenantDto,
  UpdateTenantDto,
  TenantUserDto,
  CreateTenantUserDto,
  UpdateTenantUserDto,
  TenantStatsDto,
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

  // ============================================
  // PLATFORM ADMIN USER MANAGEMENT
  // ============================================

  /**
   * Get all platform admins
   */
  async getPlatformAdmins() {
    this.logger.log('Fetching all platform admins');

    const admins = await this.prisma.user.findMany({
      where: {
        role: 'PLATFORM_ADMIN',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return admins;
  }

  /**
   * Create new platform admin
   */
  async createPlatformAdmin(dto: { email: string; password: string; name: string }) {
    this.logger.log(`Creating new platform admin: ${dto.email}`);

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: 'PLATFORM_ADMIN',
        tenantId: null, // Platform admins don't belong to any tenant
        active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Platform admin created: ${admin.id}`);
    return admin;
  }

  /**
   * Update platform admin
   */
  async updatePlatformAdmin(adminId: string, dto: { email?: string; name?: string }) {
    this.logger.log(`Updating platform admin: ${adminId}`);

    const admin = await this.prisma.user.update({
      where: {
        id: adminId,
      },
      data: {
        email: dto.email,
        name: dto.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  /**
   * Change platform admin password
   */
  async changeAdminPassword(adminId: string, newPassword: string) {
    this.logger.log(`Changing password for platform admin: ${adminId}`);

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password changed successfully for admin: ${adminId}`);
  }

  /**
   * Delete platform admin
   */
  async deletePlatformAdmin(adminId: string) {
    this.logger.log(`Deleting platform admin: ${adminId}`);

    // Check if it's the last admin
    const adminCount = await this.prisma.user.count({
      where: { role: 'PLATFORM_ADMIN' },
    });

    if (adminCount <= 1) {
      throw new Error('Cannot delete the last platform admin');
    }

    await this.prisma.user.delete({
      where: { id: adminId },
    });

    this.logger.log(`Platform admin deleted: ${adminId}`);
  }

  // ============================================
  // TENANT MANAGEMENT (FULL CRUD)
  // ============================================

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, dto: UpdateTenantDto): Promise<TenantDetailDto> {
    this.logger.log(`Updating tenant: ${tenantId}`);

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Build update data
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.slug !== undefined) updateData.slug = dto.slug;

    // Store settings in JSON fields (using existing settings field or creating new one)
    if (dto.settings !== undefined || dto.branding !== undefined || dto.domain !== undefined || dto.plan !== undefined || dto.status !== undefined) {
      const currentSettings = (existingTenant as any).settings || {};
      updateData.settings = {
        ...currentSettings,
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.plan !== undefined && { plan: dto.plan }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.branding !== undefined && { branding: dto.branding }),
        ...(dto.settings !== undefined && dto.settings),
      };
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
      include: {
        users: true,
        modules: true,
      },
    });

    this.logger.log(`Tenant updated: ${tenantId}`);

    return this.getTenantDetail(tenantId);
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string, reason?: string): Promise<TenantDetailDto> {
    this.logger.log(`Suspending tenant: ${tenantId}, reason: ${reason || 'Not specified'}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const currentSettings = (tenant as any).settings || {};

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...currentSettings,
          status: 'suspended',
          suspendedAt: new Date().toISOString(),
          suspendReason: reason || 'Suspended by platform admin',
        },
      },
    });

    // Optionally deactivate all users
    await this.prisma.user.updateMany({
      where: { tenantId },
      data: { active: false },
    });

    this.logger.log(`Tenant suspended: ${tenantId}`);

    return this.getTenantDetail(tenantId);
  }

  /**
   * Reactivate suspended tenant
   */
  async reactivateTenant(tenantId: string): Promise<TenantDetailDto> {
    this.logger.log(`Reactivating tenant: ${tenantId}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const currentSettings = (tenant as any).settings || {};

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...currentSettings,
          status: 'active',
          suspendedAt: null,
          suspendReason: null,
          reactivatedAt: new Date().toISOString(),
        },
      },
    });

    // Reactivate admin users
    await this.prisma.user.updateMany({
      where: {
        tenantId,
        role: 'ADMIN',
      },
      data: { active: true },
    });

    this.logger.log(`Tenant reactivated: ${tenantId}`);

    return this.getTenantDetail(tenantId);
  }

  /**
   * Delete tenant (soft delete - marks as deleted)
   */
  async deleteTenant(tenantId: string): Promise<void> {
    this.logger.log(`Deleting tenant: ${tenantId}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const currentSettings = (tenant as any).settings || {};

    // Soft delete - mark as deleted
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...currentSettings,
          status: 'deleted',
          deletedAt: new Date().toISOString(),
        },
      },
    });

    // Deactivate all users
    await this.prisma.user.updateMany({
      where: { tenantId },
      data: { active: false },
    });

    // Disable all modules
    await this.prisma.tenantModule.updateMany({
      where: { tenantId },
      data: { isEnabled: false },
    });

    this.logger.log(`Tenant deleted (soft): ${tenantId}`);
  }

  /**
   * Permanently delete tenant (hard delete)
   * WARNING: This deletes all tenant data permanently!
   */
  async permanentlyDeleteTenant(tenantId: string): Promise<void> {
    this.logger.log(`PERMANENTLY deleting tenant: ${tenantId}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Delete in correct order (respecting foreign keys)
    await this.prisma.$transaction(async (tx) => {
      // Delete event logs
      await tx.eventLog.deleteMany({ where: { tenantId } });

      // Delete tenant modules
      await tx.tenantModule.deleteMany({ where: { tenantId } });

      // Delete users
      await tx.user.deleteMany({ where: { tenantId } });

      // Finally delete tenant
      await tx.tenant.delete({ where: { id: tenantId } });
    });

    this.logger.log(`Tenant permanently deleted: ${tenantId}`);
  }

  // ============================================
  // TENANT USER MANAGEMENT
  // ============================================

  /**
   * Get all users for a tenant
   */
  async getTenantUsers(tenantId: string): Promise<TenantUserDto[]> {
    this.logger.log(`Fetching users for tenant: ${tenantId}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const users = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name || undefined,
      firstName: (u as any).firstName || undefined,
      lastName: (u as any).lastName || undefined,
      role: u.role,
      active: u.active,
      lastLogin: u.lastLogin || undefined,
      createdAt: u.createdAt,
    }));
  }

  /**
   * Create user for tenant
   */
  async createTenantUser(tenantId: string, dto: CreateTenantUserDto): Promise<TenantUserDto> {
    this.logger.log(`Creating user for tenant: ${tenantId}, email: ${dto.email}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Check if email already exists in this tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException(`User with email ${dto.email} already exists in this tenant`);
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : await bcrypt.hash('TEMP_PASSWORD_' + Date.now(), 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name || `${dto.firstName || ''} ${dto.lastName || ''}`.trim() || undefined,
        password: hashedPassword,
        role: dto.role as UserRole,
        active: true,
      },
    });

    this.logger.log(`User created: ${user.id} for tenant: ${tenantId}`);

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      firstName: (user as any).firstName || undefined,
      lastName: (user as any).lastName || undefined,
      role: user.role,
      active: user.active,
      lastLogin: user.lastLogin || undefined,
      createdAt: user.createdAt,
    };
  }

  /**
   * Update tenant user
   */
  async updateTenantUser(tenantId: string, userId: string, dto: UpdateTenantUserDto): Promise<TenantUserDto> {
    this.logger.log(`Updating user ${userId} for tenant ${tenantId}`);

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found in tenant ${tenantId}`);
    }

    const updateData: any = {};
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.active !== undefined) updateData.active = dto.active;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    this.logger.log(`User updated: ${userId}`);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || undefined,
      firstName: (updatedUser as any).firstName || undefined,
      lastName: (updatedUser as any).lastName || undefined,
      role: updatedUser.role,
      active: updatedUser.active,
      lastLogin: updatedUser.lastLogin || undefined,
      createdAt: updatedUser.createdAt,
    };
  }

  /**
   * Delete tenant user
   */
  async deleteTenantUser(tenantId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting user ${userId} from tenant ${tenantId}`);

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found in tenant ${tenantId}`);
    }

    // Check if this is the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: {
          tenantId,
          role: 'ADMIN',
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user of the tenant');
      }
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    this.logger.log(`User deleted: ${userId}`);
  }

  /**
   * Reset tenant user password
   */
  async resetTenantUserPassword(tenantId: string, userId: string, newPassword?: string): Promise<{ temporaryPassword?: string }> {
    this.logger.log(`Resetting password for user ${userId} in tenant ${tenantId}`);

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found in tenant ${tenantId}`);
    }

    const bcrypt = require('bcrypt');
    const password = newPassword || this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password reset for user: ${userId}`);

    // If no password was provided, return the generated one
    if (!newPassword) {
      return { temporaryPassword: password };
    }

    return {};
  }

  /**
   * Generate temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // ============================================
  // TENANT STATISTICS
  // ============================================

  /**
   * Get detailed statistics for a specific tenant
   */
  async getTenantStats(tenantId: string): Promise<TenantStatsDto> {
    this.logger.log(`Fetching statistics for tenant: ${tenantId}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Orders statistics
    const [totalOrders, ordersThisMonth, ordersLastMonth] = await Promise.all([
      this.prisma.order.count({ where: { tenantId } }),
      this.prisma.order.count({
        where: {
          tenantId,
          createdAt: { gte: thisMonthStart },
        },
      }),
      this.prisma.order.count({
        where: {
          tenantId,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),
    ]);

    // Customers statistics
    const [totalCustomers, customersThisMonth] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.customer.count({
        where: {
          tenantId,
          createdAt: { gte: thisMonthStart },
        },
      }),
    ]);

    // Products statistics
    const [totalProducts, activeProducts] = await Promise.all([
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.product.count({
        where: {
          tenantId,
          active: true,
        },
      }),
    ]);

    // Revenue statistics (from orders)
    const [revenueThisMonth, revenueLastMonth, revenueTotal] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: { gte: thisMonthStart },
        },
        _sum: { totalGross: true },
      }),
      this.prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        _sum: { totalGross: true },
      }),
      this.prisma.order.aggregate({
        where: { tenantId },
        _sum: { totalGross: true },
      }),
    ]);

    return {
      orders: {
        total: totalOrders,
        thisMonth: ordersThisMonth,
        lastMonth: ordersLastMonth,
      },
      customers: {
        total: totalCustomers,
        thisMonth: customersThisMonth,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      revenue: {
        total: revenueTotal._sum.totalGross?.toNumber() || 0,
        thisMonth: revenueThisMonth._sum.totalGross?.toNumber() || 0,
        lastMonth: revenueLastMonth._sum.totalGross?.toNumber() || 0,
      },
    };
  }
}
