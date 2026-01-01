import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRegistry } from './registry/module-registry';
import {
  ModuleDefinition,
  ModuleCategory,
  ModuleStatus,
  TenantPlan,
} from './interfaces/module-definition.interface';
import { PrismaService } from '../database/prisma.service';

/**
 * ModuleRegistryService - Central service for module management
 *
 * This service provides:
 * 1. Module registration and discovery
 * 2. Per-tenant module enablement/disablement
 * 3. Dependency validation
 * 4. Feature flag management
 * 5. Module configuration
 *
 * Example usage:
 *
 * // Register a module
 * moduleRegistry.register({
 *   code: '@stock',
 *   name: 'Stock Management',
 *   version: '1.0.0',
 *   category: ModuleCategory.INVENTORY,
 *   moduleClass: StockModule,
 *   dependencies: ['@products'],
 * });
 *
 * // Enable module for tenant
 * await moduleRegistry.enableModule(tenantId, '@stock');
 *
 * // Check if module is enabled
 * const isEnabled = await moduleRegistry.isModuleEnabled(tenantId, '@stock');
 */
@Injectable()
export class ModuleRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModuleRegistryService.name);

  constructor(
    private readonly registry: ModuleRegistry,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Register core modules
    this.registerCoreModules();
    this.logger.log('ModuleRegistry initialized - core modules registered');
  }

  /**
   * Register a module
   */
  register(module: ModuleDefinition): void {
    this.registry.registerModule(module);
  }

  /**
   * Get a module definition
   */
  getModule(moduleCode: string): ModuleDefinition | undefined {
    return this.registry.getModule(moduleCode);
  }

  /**
   * Get all available modules
   */
  getAllModules(): ModuleDefinition[] {
    return this.registry.getAllModules();
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
    return this.registry.getModulesByCategory(category);
  }

  /**
   * Get module catalog (for API)
   */
  getModuleCatalog(): any[] {
    return this.registry.getModuleCatalog();
  }

  /**
   * Enable a module for a tenant
   */
  async enableModule(
    tenantId: string,
    moduleCode: string,
    config?: Record<string, any>,
  ): Promise<void> {
    const module = this.registry.getModule(moduleCode);
    if (!module) {
      throw new Error(`Module ${moduleCode} not found`);
    }

    // Get tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { modules: true },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Check plan requirements
    const tenantPlan = (tenant.settings as any)?.plan || TenantPlan.FREE;
    if (this.isPlanRequired(module.requiredPlan, tenantPlan)) {
      throw new Error(
        `Module ${moduleCode} requires ${module.requiredPlan} plan or higher`,
      );
    }

    // Get currently enabled modules
    const enabledModules = tenant.modules
      .filter((m) => m.isEnabled)
      .map((m) => m.moduleCode);

    // Check dependencies
    const dependencies = this.registry.getModuleDependencies(moduleCode);
    const missingDeps = dependencies.filter(
      (dep) => !enabledModules.includes(dep),
    );
    if (missingDeps.length > 0) {
      throw new Error(
        `Cannot enable ${moduleCode}: missing dependencies: ${missingDeps.join(', ')}`,
      );
    }

    // Check compatibility
    for (const enabledModule of enabledModules) {
      if (!this.registry.areModulesCompatible(moduleCode, enabledModule)) {
        throw new Error(
          `Module ${moduleCode} is incompatible with ${enabledModule}`,
        );
      }
    }

    // Enable module
    const finalConfig = { ...module.defaultConfig, ...config };

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
        config: finalConfig as any,
      },
      update: {
        isEnabled: true,
        config: finalConfig as any,
      },
    });

    this.logger.log(`Enabled module ${moduleCode} for tenant ${tenantId}`);
  }

  /**
   * Disable a module for a tenant
   */
  async disableModule(tenantId: string, moduleCode: string): Promise<void> {
    const module = this.registry.getModule(moduleCode);
    if (!module) {
      throw new Error(`Module ${moduleCode} not found`);
    }

    // Cannot disable core modules
    if (module.isCore) {
      throw new Error(`Cannot disable core module ${moduleCode}`);
    }

    // Check if other modules depend on this
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { modules: true },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const enabledModules = tenant.modules
      .filter((m) => m.isEnabled && m.moduleCode !== moduleCode)
      .map((m) => m.moduleCode);

    const dependents = this.registry.getDependentModules(moduleCode);
    const enabledDependents = dependents.filter((dep) =>
      enabledModules.includes(dep),
    );

    if (enabledDependents.length > 0) {
      throw new Error(
        `Cannot disable ${moduleCode}: required by ${enabledDependents.join(', ')}`,
      );
    }

    // Disable module
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

    this.logger.log(`Disabled module ${moduleCode} for tenant ${tenantId}`);
  }

  /**
   * Check if a module is enabled for a tenant
   */
  async isModuleEnabled(
    tenantId: string,
    moduleCode: string,
  ): Promise<boolean> {
    const tenantModule = await this.prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleCode: {
          tenantId,
          moduleCode,
        },
      },
    });

    return tenantModule?.isEnabled || false;
  }

  /**
   * Get enabled modules for a tenant
   */
  async getEnabledModules(tenantId: string): Promise<ModuleStatus[]> {
    const tenantModules = await this.prisma.tenantModule.findMany({
      where: {
        tenantId,
        isEnabled: true,
      },
    });

    return tenantModules.map((tm) => ({
      moduleCode: tm.moduleCode,
      isEnabled: tm.isEnabled,
      config: tm.config as Record<string, any>,
      enabledFeatures: [], // TODO: Implement feature tracking
      installedAt: tm.createdAt,
      updatedAt: tm.updatedAt,
    }));
  }

  /**
   * Update module configuration
   */
  async updateModuleConfig(
    tenantId: string,
    moduleCode: string,
    config: Record<string, any>,
  ): Promise<void> {
    await this.prisma.tenantModule.update({
      where: {
        tenantId_moduleCode: {
          tenantId,
          moduleCode,
        },
      },
      data: {
        config: config as any,
      },
    });

    this.logger.log(
      `Updated config for module ${moduleCode} in tenant ${tenantId}`,
    );
  }

  /**
   * Initialize default modules for a new tenant
   */
  async initializeDefaultModules(tenantId: string): Promise<void> {
    const defaultModules = this.registry.getDefaultEnabledModules();

    for (const moduleCode of defaultModules) {
      const module = this.registry.getModule(moduleCode);
      if (!module) {
        continue;
      }

      await this.prisma.tenantModule.create({
        data: {
          tenantId,
          moduleCode,
          isEnabled: true,
          config: module.defaultConfig as any,
        },
      });
    }

    this.logger.log(
      `Initialized ${defaultModules.length} default modules for tenant ${tenantId}`,
    );
  }

  /**
   * Check if a plan is sufficient for required plan
   */
  private isPlanRequired(
    requiredPlan: TenantPlan | undefined,
    currentPlan: TenantPlan,
  ): boolean {
    if (!requiredPlan) {
      return false;
    }

    const planHierarchy = [
      TenantPlan.FREE,
      TenantPlan.STARTER,
      TenantPlan.PROFESSIONAL,
      TenantPlan.ENTERPRISE,
    ];

    const requiredIndex = planHierarchy.indexOf(requiredPlan);
    const currentIndex = planHierarchy.indexOf(currentPlan);

    return currentIndex < requiredIndex;
  }

  /**
   * Register core modules
   */
  private registerCoreModules(): void {
    // @customers module (core)
    this.register({
      code: '@customers',
      name: 'Customers',
      description: 'Customer management',
      version: '1.0.0',
      category: ModuleCategory.CORE,
      moduleClass: Object, // Placeholder
      isCore: true,
      defaultEnabled: true,
      icon: 'users',
    });

    // @orders module (core)
    this.register({
      code: '@orders',
      name: 'Orders',
      description: 'Order management',
      version: '1.0.0',
      category: ModuleCategory.CORE,
      moduleClass: Object, // Placeholder
      isCore: true,
      defaultEnabled: true,
      dependencies: ['@customers', '@products'],
      icon: 'shopping-cart',
    });

    // @products module (core)
    this.register({
      code: '@products',
      name: 'Products',
      description: 'Product catalog',
      version: '1.0.0',
      category: ModuleCategory.CORE,
      moduleClass: Object, // Placeholder
      isCore: true,
      defaultEnabled: true,
      icon: 'package',
    });

    // @quotes module (core)
    this.register({
      code: '@quotes',
      name: 'Quotes',
      description: 'Quote management',
      version: '1.0.0',
      category: ModuleCategory.CORE,
      moduleClass: Object, // Placeholder
      isCore: true,
      defaultEnabled: true,
      dependencies: ['@customers', '@products'],
      icon: 'file-text',
    });

    this.logger.log('Registered 4 core modules: @customers, @orders, @products, @quotes');
  }
}
