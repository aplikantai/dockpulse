import { Type } from '@nestjs/common';

/**
 * ModuleDefinition - Defines a DockPulse module
 */
export interface ModuleDefinition {
  /**
   * Module code (e.g., '@stock', '@calendar', '@invoicing')
   */
  code: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Version (semver)
   */
  version: string;

  /**
   * Module category
   */
  category: ModuleCategory;

  /**
   * NestJS module class
   */
  moduleClass: Type<any>;

  /**
   * Module dependencies (other modules that must be enabled)
   */
  dependencies?: string[];

  /**
   * Incompatible modules (cannot be enabled together)
   */
  incompatibleWith?: string[];

  /**
   * Default enabled for new tenants?
   */
  defaultEnabled?: boolean;

  /**
   * Is this a core module? (cannot be disabled)
   */
  isCore?: boolean;

  /**
   * Icon for UI
   */
  icon?: string;

  /**
   * Pricing tier required (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
   */
  requiredPlan?: TenantPlan;

  /**
   * Features provided by this module
   */
  features?: ModuleFeature[];

  /**
   * Configuration schema (for module settings)
   */
  configSchema?: any;

  /**
   * Default configuration
   */
  defaultConfig?: Record<string, any>;

  /**
   * Metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Module categories
 */
export enum ModuleCategory {
  CORE = 'core', // Core modules (customers, orders, products)
  INVENTORY = 'inventory', // Stock, warehouses
  SALES = 'sales', // Quotes, invoices
  SCHEDULING = 'scheduling', // Calendar, appointments
  AUTOMATION = 'automation', // Workflows, webhooks
  INTEGRATION = 'integration', // External integrations
  ANALYTICS = 'analytics', // Reports, dashboards
  OTHER = 'other',
}

/**
 * Tenant plans
 */
export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

/**
 * ModuleFeature - A feature provided by a module
 */
export interface ModuleFeature {
  /**
   * Feature code (e.g., 'stock_tracking', 'barcode_scanning')
   */
  code: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Is this feature enabled by default?
   */
  defaultEnabled?: boolean;

  /**
   * Configuration schema for this feature
   */
  configSchema?: any;
}

/**
 * ModuleStatus - Status of a module for a tenant
 */
export interface ModuleStatus {
  /**
   * Module code
   */
  moduleCode: string;

  /**
   * Is enabled?
   */
  isEnabled: boolean;

  /**
   * Configuration
   */
  config: Record<string, any>;

  /**
   * Enabled features
   */
  enabledFeatures: string[];

  /**
   * Installation date
   */
  installedAt?: Date;

  /**
   * Last updated
   */
  updatedAt?: Date;
}

/**
 * Factory for creating module definitions
 */
export class ModuleDefinitionFactory {
  /**
   * Create a module definition
   */
  static create(params: {
    code: string;
    name: string;
    description?: string;
    version: string;
    category: ModuleCategory;
    moduleClass: Type<any>;
    dependencies?: string[];
    incompatibleWith?: string[];
    defaultEnabled?: boolean;
    isCore?: boolean;
    icon?: string;
    requiredPlan?: TenantPlan;
    features?: ModuleFeature[];
    configSchema?: any;
    defaultConfig?: Record<string, any>;
  }): ModuleDefinition {
    return {
      code: params.code,
      name: params.name,
      description: params.description,
      version: params.version,
      category: params.category,
      moduleClass: params.moduleClass,
      dependencies: params.dependencies || [],
      incompatibleWith: params.incompatibleWith || [],
      defaultEnabled: params.defaultEnabled || false,
      isCore: params.isCore || false,
      icon: params.icon,
      requiredPlan: params.requiredPlan || TenantPlan.FREE,
      features: params.features || [],
      configSchema: params.configSchema,
      defaultConfig: params.defaultConfig || {},
    };
  }
}
