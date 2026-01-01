/**
 * EntityDefinition - Defines what an entity looks like in the system
 */
export interface EntityDefinition {
  /**
   * Entity code (e.g., 'customer', 'order', 'product')
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
   * Base fields (from Prisma schema)
   */
  baseFields: FieldDefinition[];

  /**
   * Extended fields (added by modules)
   */
  extendedFields: FieldDefinition[];

  /**
   * Relations to other entities
   */
  relations: RelationDefinition[];

  /**
   * Hooks for entity lifecycle events
   */
  hooks: EntityHooks;

  /**
   * Module that owns this entity (null for core entities)
   */
  ownerModule?: string;

  /**
   * Metadata
   */
  metadata?: Record<string, any>;
}

/**
 * FieldDefinition - Defines a single field on an entity
 */
export interface FieldDefinition {
  /**
   * Field name (e.g., 'email', 'phone', 'stockQuantity')
   */
  name: string;

  /**
   * Field type
   */
  type: FieldType;

  /**
   * Is this field required?
   */
  required?: boolean;

  /**
   * Default value
   */
  defaultValue?: any;

  /**
   * Validation rules
   */
  validation?: FieldValidation;

  /**
   * UI hints (label, placeholder, etc.)
   */
  ui?: FieldUI;

  /**
   * Module that added this field (null for base fields)
   */
  addedBy?: string;

  /**
   * Is this field visible?
   */
  visible?: boolean;

  /**
   * Metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Field types supported by the system
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'url'
  | 'json'
  | 'enum'
  | 'relation';

/**
 * Field validation rules
 */
export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  custom?: (value: any) => boolean | Promise<boolean>;
}

/**
 * UI hints for field rendering
 */
export interface FieldUI {
  label?: string;
  placeholder?: string;
  helpText?: string;
  group?: string;
  order?: number;
  widget?: 'input' | 'textarea' | 'select' | 'checkbox' | 'date' | 'custom';
}

/**
 * RelationDefinition - Defines a relationship to another entity
 */
export interface RelationDefinition {
  /**
   * Relation name (e.g., 'orders', 'customer')
   */
  name: string;

  /**
   * Target entity code
   */
  targetEntity: string;

  /**
   * Relation type
   */
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';

  /**
   * Foreign key field (for many-to-one, one-to-one)
   */
  foreignKey?: string;

  /**
   * Is this relation required?
   */
  required?: boolean;

  /**
   * Cascade delete?
   */
  cascadeDelete?: boolean;

  /**
   * Module that added this relation (null for base relations)
   */
  addedBy?: string;
}

/**
 * EntityHooks - Lifecycle hooks for entities
 */
export interface EntityHooks {
  beforeCreate?: EntityHook[];
  afterCreate?: EntityHook[];
  beforeUpdate?: EntityHook[];
  afterUpdate?: EntityHook[];
  beforeDelete?: EntityHook[];
  afterDelete?: EntityHook[];
  beforeRead?: EntityHook[];
  afterRead?: EntityHook[];
}

/**
 * EntityHook - A single hook function
 */
export interface EntityHook {
  name: string;
  handler: (context: HookContext) => Promise<void> | void;
  priority?: number;
  addedBy?: string;
}

/**
 * HookContext - Context passed to hook handlers
 */
export interface HookContext {
  tenantId: string;
  entityCode: string;
  action: 'create' | 'update' | 'delete' | 'read';
  data: any;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Factory for creating entity definitions
 */
export class EntityDefinitionFactory {
  /**
   * Create a basic entity definition
   */
  static create(params: {
    code: string;
    name: string;
    description?: string;
    baseFields?: FieldDefinition[];
    ownerModule?: string;
  }): EntityDefinition {
    return {
      code: params.code,
      name: params.name,
      description: params.description,
      baseFields: params.baseFields || [],
      extendedFields: [],
      relations: [],
      hooks: {
        beforeCreate: [],
        afterCreate: [],
        beforeUpdate: [],
        afterUpdate: [],
        beforeDelete: [],
        afterDelete: [],
        beforeRead: [],
        afterRead: [],
      },
      ownerModule: params.ownerModule,
    };
  }

  /**
   * Create a field definition
   */
  static createField(params: {
    name: string;
    type: FieldType;
    required?: boolean;
    defaultValue?: any;
    validation?: FieldValidation;
    ui?: FieldUI;
    addedBy?: string;
  }): FieldDefinition {
    return {
      name: params.name,
      type: params.type,
      required: params.required || false,
      defaultValue: params.defaultValue,
      validation: params.validation,
      ui: params.ui,
      addedBy: params.addedBy,
      visible: true,
    };
  }

  /**
   * Create a relation definition
   */
  static createRelation(params: {
    name: string;
    targetEntity: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    foreignKey?: string;
    required?: boolean;
    cascadeDelete?: boolean;
    addedBy?: string;
  }): RelationDefinition {
    return {
      name: params.name,
      targetEntity: params.targetEntity,
      type: params.type,
      foreignKey: params.foreignKey,
      required: params.required || false,
      cascadeDelete: params.cascadeDelete || false,
      addedBy: params.addedBy,
    };
  }
}
