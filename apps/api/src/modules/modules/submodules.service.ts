import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  ALL_SUBMODULES,
  SubmoduleDefinition,
  getSubmodulesForModule,
  getSubmoduleByCode,
  ModuleCode,
} from './submodule-registry';

/**
 * SubmoduleService - Central service for submodule management
 *
 * This service provides:
 * 1. Submodule enablement/disablement per tenant
 * 2. Dependency validation
 * 3. Conflict detection
 * 4. Access control checks
 * 5. Submodule catalog for pricing
 *
 * Example usage:
 *
 * // Enable a submodule
 * await submoduleService.enableSubmodule(tenantId, 'CRM.SEGMENTS');
 *
 * // Check if submodule is enabled
 * const isEnabled = await submoduleService.isSubmoduleEnabled(tenantId, 'CRM.SEGMENTS');
 *
 * // Get all enabled submodules for a tenant
 * const enabled = await submoduleService.getEnabledSubmodules(tenantId);
 */
@Injectable()
export class SubmodulesService {
  private readonly logger = new Logger(SubmodulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all available submodules (catalog)
   */
  getAllSubmodules(): SubmoduleDefinition[] {
    return ALL_SUBMODULES;
  }

  /**
   * Get submodules by parent module
   */
  getSubmodulesByModule(moduleCode: ModuleCode): SubmoduleDefinition[] {
    return getSubmodulesForModule(moduleCode);
  }

  /**
   * Get a specific submodule definition
   */
  getSubmodule(code: string): SubmoduleDefinition | undefined {
    return getSubmoduleByCode(code);
  }

  /**
   * Get enabled submodules for a tenant
   */
  async getEnabledSubmodules(tenantId: string): Promise<string[]> {
    const tenantSubmodules = await this.prisma.tenantSubmodule.findMany({
      where: {
        tenantId,
        isEnabled: true,
      },
      select: {
        submoduleCode: true,
      },
    });

    return tenantSubmodules.map((ts) => ts.submoduleCode);
  }

  /**
   * Get enabled submodules for a tenant with full details
   */
  async getEnabledSubmodulesWithDetails(
    tenantId: string,
  ): Promise<
    Array<{
      code: string;
      definition: SubmoduleDefinition;
      enabledAt: Date | null;
    }>
  > {
    const tenantSubmodules = await this.prisma.tenantSubmodule.findMany({
      where: {
        tenantId,
        isEnabled: true,
      },
    });

    return tenantSubmodules
      .map((ts) => {
        const definition = getSubmoduleByCode(ts.submoduleCode);
        if (!definition) {
          return null;
        }
        return {
          code: ts.submoduleCode,
          definition,
          enabledAt: ts.enabledAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  /**
   * Check if a specific submodule is enabled for a tenant
   */
  async isSubmoduleEnabled(
    tenantId: string,
    submoduleCode: string,
  ): Promise<boolean> {
    const tenantSubmodule = await this.prisma.tenantSubmodule.findFirst({
      where: {
        tenantId,
        submoduleCode,
        isEnabled: true,
      },
    });

    return !!tenantSubmodule;
  }

  /**
   * Enable a submodule for a tenant
   */
  async enableSubmodule(
    tenantId: string,
    submoduleCode: string,
    enabledById?: string,
  ): Promise<void> {
    // Get submodule definition
    const submodule = getSubmoduleByCode(submoduleCode);
    if (!submodule) {
      throw new NotFoundException(
        `Submodule ${submoduleCode} not found in registry`,
      );
    }

    // Check if submodule is active
    if (!submodule.isActive) {
      throw new BadRequestException(
        `Submodule ${submoduleCode} is not active`,
      );
    }

    // Get currently enabled submodules for this tenant
    const enabledSubmodules = await this.getEnabledSubmodules(tenantId);

    // Validate dependencies
    await this.validateDependencies(
      submoduleCode,
      submodule,
      enabledSubmodules,
    );

    // Validate conflicts
    await this.validateConflicts(submoduleCode, submodule, enabledSubmodules);

    // Enable the submodule
    const now = new Date();
    await this.prisma.tenantSubmodule.upsert({
      where: {
        tenantId_moduleCode_submoduleCode: {
          tenantId,
          moduleCode: submodule.parentModule,
          submoduleCode,
        },
      },
      create: {
        tenantId,
        moduleCode: submodule.parentModule,
        submoduleCode,
        isEnabled: true,
        enabledAt: now,
        enabledById,
      },
      update: {
        isEnabled: true,
        enabledAt: now,
        enabledById,
      },
    });

    this.logger.log(
      `Enabled submodule ${submoduleCode} for tenant ${tenantId}${enabledById ? ` by user ${enabledById}` : ''}`,
    );
  }

  /**
   * Disable a submodule for a tenant
   */
  async disableSubmodule(
    tenantId: string,
    submoduleCode: string,
  ): Promise<void> {
    // Get submodule definition
    const submodule = getSubmoduleByCode(submoduleCode);
    if (!submodule) {
      throw new NotFoundException(
        `Submodule ${submoduleCode} not found in registry`,
      );
    }

    // Cannot disable default-enabled submodules
    if (submodule.defaultEnabled) {
      throw new BadRequestException(
        `Cannot disable default-enabled submodule ${submoduleCode}`,
      );
    }

    // Get currently enabled submodules for this tenant
    const enabledSubmodules = await this.getEnabledSubmodules(tenantId);

    // Check if any enabled submodule depends on this one
    const dependents = this.findDependentSubmodules(
      submoduleCode,
      enabledSubmodules,
    );

    if (dependents.length > 0) {
      throw new BadRequestException(
        `Cannot disable ${submoduleCode}: required by ${dependents.join(', ')}`,
      );
    }

    // Disable the submodule
    await this.prisma.tenantSubmodule.updateMany({
      where: {
        tenantId,
        submoduleCode,
      },
      data: {
        isEnabled: false,
        enabledAt: null,
      },
    });

    this.logger.log(
      `Disabled submodule ${submoduleCode} for tenant ${tenantId}`,
    );
  }

  /**
   * Initialize default submodules for a new tenant
   */
  async initializeDefaultSubmodules(
    tenantId: string,
    enabledById?: string,
  ): Promise<void> {
    const defaultSubmodules = ALL_SUBMODULES.filter(
      (sm) => sm.defaultEnabled && sm.isActive,
    );

    const now = new Date();

    for (const submodule of defaultSubmodules) {
      await this.prisma.tenantSubmodule.create({
        data: {
          tenantId,
          moduleCode: submodule.parentModule,
          submoduleCode: submodule.code,
          isEnabled: true,
          enabledAt: now,
          enabledById,
        },
      });
    }

    this.logger.log(
      `Initialized ${defaultSubmodules.length} default submodules for tenant ${tenantId}`,
    );
  }

  /**
   * Batch enable submodules (with dependency resolution)
   */
  async batchEnableSubmodules(
    tenantId: string,
    submoduleCodes: string[],
    enabledById?: string,
  ): Promise<{ enabled: string[]; skipped: string[]; errors: string[] }> {
    const result = {
      enabled: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    for (const code of submoduleCodes) {
      try {
        await this.enableSubmodule(tenantId, code, enabledById);
        result.enabled.push(code);
      } catch (error) {
        if (error instanceof NotFoundException) {
          result.skipped.push(code);
        } else {
          result.errors.push(
            `${code}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    }

    return result;
  }

  /**
   * Get submodules by category
   */
  getSubmodulesByCategory(
    category: 'INCLUDED' | 'ADDON',
  ): SubmoduleDefinition[] {
    return ALL_SUBMODULES.filter((sm) => sm.category === category);
  }

  /**
   * Get addon submodules (for pricing page)
   */
  getAddonSubmodules(): SubmoduleDefinition[] {
    return ALL_SUBMODULES.filter(
      (sm) => sm.category === 'ADDON' && sm.isActive && sm.price !== null,
    );
  }

  /**
   * Validate dependencies for a submodule
   */
  private async validateDependencies(
    submoduleCode: string,
    submodule: SubmoduleDefinition,
    enabledSubmodules: string[],
  ): Promise<void> {
    const missingDeps = submodule.requiredSubmodules.filter(
      (dep) => !enabledSubmodules.includes(dep),
    );

    if (missingDeps.length > 0) {
      throw new BadRequestException(
        `Cannot enable ${submoduleCode}: missing required submodules: ${missingDeps.join(', ')}`,
      );
    }
  }

  /**
   * Validate conflicts for a submodule
   */
  private async validateConflicts(
    submoduleCode: string,
    submodule: SubmoduleDefinition,
    enabledSubmodules: string[],
  ): Promise<void> {
    const conflicts = submodule.conflictsWith.filter((conflict) =>
      enabledSubmodules.includes(conflict),
    );

    if (conflicts.length > 0) {
      throw new BadRequestException(
        `Cannot enable ${submoduleCode}: conflicts with enabled submodules: ${conflicts.join(', ')}`,
      );
    }
  }

  /**
   * Find submodules that depend on the given submodule
   */
  private findDependentSubmodules(
    submoduleCode: string,
    enabledSubmodules: string[],
  ): string[] {
    return ALL_SUBMODULES.filter(
      (sm) =>
        enabledSubmodules.includes(sm.code) &&
        sm.requiredSubmodules.includes(submoduleCode),
    ).map((sm) => sm.code);
  }

  /**
   * Get pricing information for all addon submodules
   */
  getPricingCatalog(): Array<{
    code: string;
    parentModule: ModuleCode;
    name: string;
    namePl: string;
    description: string;
    descriptionPl: string;
    price: number;
    features: string[];
    category: 'INCLUDED' | 'ADDON';
    isBeta: boolean;
  }> {
    return this.getAddonSubmodules().map((sm) => ({
      code: sm.code,
      parentModule: sm.parentModule,
      name: sm.name,
      namePl: sm.namePl,
      description: sm.description,
      descriptionPl: sm.descriptionPl,
      price: sm.price!,
      features: sm.features,
      category: sm.category,
      isBeta: sm.isBeta,
    }));
  }
}
