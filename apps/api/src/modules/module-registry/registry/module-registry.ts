import { Injectable, Logger } from '@nestjs/common';
import {
  ModuleDefinition,
  ModuleCategory,
  ModuleStatus,
} from '../interfaces/module-definition.interface';

/**
 * ModuleRegistry - Central registry for all DockPulse modules
 *
 * This registry maintains:
 * - All available modules in the system
 * - Module dependencies and compatibility
 * - Module metadata and features
 */
@Injectable()
export class ModuleRegistry {
  private readonly logger = new Logger(ModuleRegistry.name);

  /**
   * Map of module code -> module definition
   */
  private modules: Map<string, ModuleDefinition> = new Map();

  /**
   * Register a module
   */
  registerModule(module: ModuleDefinition): void {
    if (this.modules.has(module.code)) {
      this.logger.warn(
        `Module ${module.code} is already registered. Overwriting.`,
      );
    }

    // Validate dependencies
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        if (!this.modules.has(dep)) {
          this.logger.warn(
            `Module ${module.code} depends on ${dep}, which is not yet registered`,
          );
        }
      }
    }

    this.modules.set(module.code, module);
    this.logger.log(
      `Registered module: ${module.code} (${module.name}) v${module.version}`,
    );
  }

  /**
   * Get a module definition
   */
  getModule(moduleCode: string): ModuleDefinition | undefined {
    return this.modules.get(moduleCode);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
    return Array.from(this.modules.values()).filter(
      (m) => m.category === category,
    );
  }

  /**
   * Get core modules (cannot be disabled)
   */
  getCoreModules(): ModuleDefinition[] {
    return Array.from(this.modules.values()).filter((m) => m.isCore === true);
  }

  /**
   * Check if a module is registered
   */
  hasModule(moduleCode: string): boolean {
    return this.modules.has(moduleCode);
  }

  /**
   * Validate module compatibility
   * Returns true if modules can be enabled together
   */
  areModulesCompatible(
    moduleCode1: string,
    moduleCode2: string,
  ): boolean {
    const module1 = this.modules.get(moduleCode1);
    const module2 = this.modules.get(moduleCode2);

    if (!module1 || !module2) {
      return false;
    }

    // Check if modules are incompatible
    if (module1.incompatibleWith?.includes(moduleCode2)) {
      return false;
    }
    if (module2.incompatibleWith?.includes(moduleCode1)) {
      return false;
    }

    return true;
  }

  /**
   * Get module dependencies (recursive)
   */
  getModuleDependencies(moduleCode: string): string[] {
    const module = this.modules.get(moduleCode);
    if (!module || !module.dependencies) {
      return [];
    }

    const allDeps = new Set<string>();
    const queue = [...module.dependencies];

    while (queue.length > 0) {
      const dep = queue.shift()!;
      if (allDeps.has(dep)) {
        continue;
      }

      allDeps.add(dep);
      const depModule = this.modules.get(dep);
      if (depModule && depModule.dependencies) {
        queue.push(...depModule.dependencies);
      }
    }

    return Array.from(allDeps);
  }

  /**
   * Validate that all dependencies are satisfied
   */
  validateDependencies(enabledModules: string[]): {
    valid: boolean;
    missing: string[];
    conflicts: string[];
  } {
    const missing = new Set<string>();
    const conflicts: string[] = [];
    const enabledSet = new Set(enabledModules);

    // Check dependencies
    for (const moduleCode of enabledModules) {
      const module = this.modules.get(moduleCode);
      if (!module) {
        continue;
      }

      // Check if dependencies are enabled
      if (module.dependencies) {
        for (const dep of module.dependencies) {
          if (!enabledSet.has(dep)) {
            missing.add(dep);
          }
        }
      }

      // Check for incompatible modules
      if (module.incompatibleWith) {
        for (const incompatible of module.incompatibleWith) {
          if (enabledSet.has(incompatible)) {
            conflicts.push(
              `${moduleCode} is incompatible with ${incompatible}`,
            );
          }
        }
      }
    }

    return {
      valid: missing.size === 0 && conflicts.length === 0,
      missing: Array.from(missing),
      conflicts,
    };
  }

  /**
   * Get modules that depend on a given module
   */
  getDependentModules(moduleCode: string): string[] {
    const dependents: string[] = [];

    for (const [code, module] of this.modules.entries()) {
      if (module.dependencies?.includes(moduleCode)) {
        dependents.push(code);
      }
    }

    return dependents;
  }

  /**
   * Get default enabled modules
   */
  getDefaultEnabledModules(): string[] {
    return Array.from(this.modules.values())
      .filter((m) => m.defaultEnabled === true || m.isCore === true)
      .map((m) => m.code);
  }

  /**
   * Get module features
   */
  getModuleFeatures(moduleCode: string): any[] {
    const module = this.modules.get(moduleCode);
    return module?.features || [];
  }

  /**
   * Get module catalog (for API responses)
   */
  getModuleCatalog(): any[] {
    return Array.from(this.modules.values()).map((m) => ({
      code: m.code,
      name: m.name,
      description: m.description,
      version: m.version,
      category: m.category,
      icon: m.icon,
      requiredPlan: m.requiredPlan,
      isCore: m.isCore,
      defaultEnabled: m.defaultEnabled,
      dependencies: m.dependencies,
      incompatibleWith: m.incompatibleWith,
      features: m.features?.map((f) => ({
        code: f.code,
        name: f.name,
        description: f.description,
        defaultEnabled: f.defaultEnabled,
      })),
    }));
  }

  /**
   * Clear all registrations (for testing)
   */
  clear(): void {
    this.modules.clear();
    this.logger.log('Cleared module registry');
  }
}
