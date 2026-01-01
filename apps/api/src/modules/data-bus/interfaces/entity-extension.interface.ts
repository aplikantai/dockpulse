import {
  FieldDefinition,
  RelationDefinition,
  EntityHook,
} from './entity-definition.interface';

/**
 * EntityExtension - Defines how a module extends an existing entity
 */
export interface EntityExtension {
  /**
   * Target entity to extend (e.g., 'customer', 'order', 'product')
   */
  targetEntity: string;

  /**
   * Module that provides this extension
   */
  moduleCode: string;

  /**
   * Additional fields to add
   */
  fields?: FieldDefinition[];

  /**
   * Additional relations to add
   */
  relations?: RelationDefinition[];

  /**
   * Lifecycle hooks to register
   */
  hooks?: {
    beforeCreate?: EntityHook[];
    afterCreate?: EntityHook[];
    beforeUpdate?: EntityHook[];
    afterUpdate?: EntityHook[];
    beforeDelete?: EntityHook[];
    afterDelete?: EntityHook[];
    beforeRead?: EntityHook[];
    afterRead?: EntityHook[];
  };

  /**
   * Custom actions to add to the entity
   */
  actions?: EntityAction[];

  /**
   * UI tab to add to the entity detail page
   */
  tabs?: EntityTab[];

  /**
   * Metadata
   */
  metadata?: Record<string, any>;
}

/**
 * EntityAction - Custom action that can be performed on an entity
 */
export interface EntityAction {
  /**
   * Action code (e.g., 'generate_invoice', 'send_email')
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
   * Action handler
   */
  handler: (context: ActionContext) => Promise<any>;

  /**
   * Icon for UI
   */
  icon?: string;

  /**
   * Is this action available in bulk?
   */
  bulk?: boolean;

  /**
   * Permissions required
   */
  permissions?: string[];

  /**
   * Module that added this action
   */
  addedBy?: string;
}

/**
 * ActionContext - Context passed to action handlers
 */
export interface ActionContext {
  tenantId: string;
  entityCode: string;
  entityId: string;
  data: any;
  userId?: string;
  params?: Record<string, any>;
}

/**
 * EntityTab - Custom tab for entity detail page
 */
export interface EntityTab {
  /**
   * Tab code (e.g., 'stock_movements', 'calendar_events')
   */
  code: string;

  /**
   * Tab label
   */
  label: string;

  /**
   * Component to render (for frontend)
   */
  component?: string;

  /**
   * API endpoint to fetch data
   */
  dataEndpoint?: string;

  /**
   * Order
   */
  order?: number;

  /**
   * Icon
   */
  icon?: string;

  /**
   * Module that added this tab
   */
  addedBy?: string;
}

/**
 * Factory for creating entity extensions
 */
export class EntityExtensionFactory {
  /**
   * Create an entity extension
   */
  static create(params: {
    targetEntity: string;
    moduleCode: string;
    fields?: FieldDefinition[];
    relations?: RelationDefinition[];
    hooks?: EntityExtension['hooks'];
    actions?: EntityAction[];
    tabs?: EntityTab[];
  }): EntityExtension {
    return {
      targetEntity: params.targetEntity,
      moduleCode: params.moduleCode,
      fields: params.fields || [],
      relations: params.relations || [],
      hooks: params.hooks || {},
      actions: params.actions || [],
      tabs: params.tabs || [],
    };
  }
}
