import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EntityRegistry } from './registry/entity-registry';
import {
  EntityDefinition,
  EntityDefinitionFactory,
  FieldDefinition,
  HookContext,
} from './interfaces/entity-definition.interface';
import {
  EntityExtension,
  ActionContext,
} from './interfaces/entity-extension.interface';

/**
 * DataBusService - Central service for entity registration and management
 *
 * This service provides:
 * 1. Entity registration (core + module entities)
 * 2. Entity extension (fields, relations, hooks, actions, tabs)
 * 3. Entity schema retrieval
 * 4. Hook execution
 * 5. Action execution
 *
 * Example usage:
 *
 * // Register a core entity
 * dataBus.registerEntity({
 *   code: 'customer',
 *   name: 'Customer',
 *   baseFields: [...]
 * });
 *
 * // Extend an entity
 * dataBus.extend({
 *   targetEntity: 'product',
 *   moduleCode: '@stock',
 *   fields: [
 *     { name: 'stockQuantity', type: 'number', required: true },
 *     { name: 'reorderLevel', type: 'number' }
 *   ]
 * });
 *
 * // Execute hooks
 * await dataBus.executeHooks('afterCreate', {
 *   tenantId: '...',
 *   entityCode: 'order',
 *   action: 'create',
 *   data: order
 * });
 */
@Injectable()
export class DataBusService implements OnModuleInit {
  private readonly logger = new Logger(DataBusService.name);

  constructor(private readonly registry: EntityRegistry) {}

  async onModuleInit() {
    // Register core entities
    this.registerCoreEntities();
    this.logger.log('DataBus initialized - core entities registered');
  }

  /**
   * Register an entity
   */
  registerEntity(entity: EntityDefinition): void {
    this.registry.registerEntity(entity);
  }

  /**
   * Extend an existing entity
   */
  extend(extension: EntityExtension): void {
    this.registry.registerExtension(extension);
  }

  /**
   * Get an entity definition
   */
  getEntity(entityCode: string): EntityDefinition | undefined {
    return this.registry.getEntity(entityCode);
  }

  /**
   * Get all entities
   */
  getAllEntities(): EntityDefinition[] {
    return this.registry.getAllEntities();
  }

  /**
   * Get entity schema (for API responses)
   */
  getEntitySchema(entityCode: string): any {
    return this.registry.getEntitySchema(entityCode);
  }

  /**
   * Get all fields for an entity
   */
  getFields(entityCode: string): FieldDefinition[] {
    return this.registry.getFields(entityCode);
  }

  /**
   * Execute lifecycle hooks
   */
  async executeHooks(
    hookType: keyof EntityDefinition['hooks'],
    context: HookContext,
  ): Promise<void> {
    const entity = this.registry.getEntity(context.entityCode);
    if (!entity) {
      return;
    }

    const hooks = entity.hooks[hookType];
    if (!hooks || hooks.length === 0) {
      return;
    }

    // Sort by priority (higher priority first)
    const sortedHooks = [...hooks].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0),
    );

    this.logger.debug(
      `Executing ${sortedHooks.length} ${hookType} hooks for ${context.entityCode}`,
    );

    // Execute hooks sequentially
    for (const hook of sortedHooks) {
      try {
        await hook.handler(context);
        this.logger.debug(`Executed hook: ${hook.name} (${hook.addedBy})`);
      } catch (error) {
        this.logger.error(
          `Failed to execute hook ${hook.name}: ${error.message}`,
        );
        // Continue with other hooks even if one fails
      }
    }
  }

  /**
   * Execute an entity action
   */
  async executeAction(
    entityCode: string,
    actionCode: string,
    context: ActionContext,
  ): Promise<any> {
    const extensions = this.registry.getExtensions(entityCode);

    for (const extension of extensions) {
      const action = extension.actions?.find((a) => a.code === actionCode);
      if (action) {
        this.logger.log(
          `Executing action ${actionCode} on ${entityCode} (${extension.moduleCode})`,
        );

        try {
          return await action.handler(context);
        } catch (error) {
          this.logger.error(
            `Failed to execute action ${actionCode}: ${error.message}`,
          );
          throw error;
        }
      }
    }

    throw new Error(
      `Action ${actionCode} not found for entity ${entityCode}`,
    );
  }

  /**
   * Get available actions for an entity
   */
  getActions(entityCode: string): any[] {
    const extensions = this.registry.getExtensions(entityCode);
    const actions: any[] = [];

    extensions.forEach((extension) => {
      if (extension.actions) {
        extension.actions.forEach((action) => {
          actions.push({
            code: action.code,
            name: action.name,
            description: action.description,
            icon: action.icon,
            bulk: action.bulk,
            permissions: action.permissions,
            addedBy: extension.moduleCode,
          });
        });
      }
    });

    return actions;
  }

  /**
   * Get available tabs for an entity
   */
  getTabs(entityCode: string): any[] {
    const extensions = this.registry.getExtensions(entityCode);
    const tabs: any[] = [];

    extensions.forEach((extension) => {
      if (extension.tabs) {
        extension.tabs.forEach((tab) => {
          tabs.push({
            code: tab.code,
            label: tab.label,
            component: tab.component,
            dataEndpoint: tab.dataEndpoint,
            order: tab.order,
            icon: tab.icon,
            addedBy: extension.moduleCode,
          });
        });
      }
    });

    // Sort by order
    return tabs.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Register core entities (Customer, Order, Product, Quote)
   */
  private registerCoreEntities(): void {
    // Customer
    this.registerEntity(
      EntityDefinitionFactory.create({
        code: 'customer',
        name: 'Customer',
        description: 'Customer entity',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'name',
            type: 'string',
            required: true,
            ui: { label: 'Name', placeholder: 'Enter customer name' },
          }),
          EntityDefinitionFactory.createField({
            name: 'email',
            type: 'email',
            ui: { label: 'Email', placeholder: 'customer@example.com' },
          }),
          EntityDefinitionFactory.createField({
            name: 'phone',
            type: 'phone',
            ui: { label: 'Phone', placeholder: '+48 123 456 789' },
          }),
          EntityDefinitionFactory.createField({
            name: 'company',
            type: 'string',
            ui: { label: 'Company', placeholder: 'Company name' },
          }),
          EntityDefinitionFactory.createField({
            name: 'address',
            type: 'json',
            ui: { label: 'Address' },
          }),
          EntityDefinitionFactory.createField({
            name: 'notes',
            type: 'string',
            ui: { label: 'Notes', widget: 'textarea' },
          }),
          EntityDefinitionFactory.createField({
            name: 'tags',
            type: 'json',
            ui: { label: 'Tags' },
          }),
        ],
      }),
    );

    // Order
    this.registerEntity(
      EntityDefinitionFactory.create({
        code: 'order',
        name: 'Order',
        description: 'Order entity',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'orderNumber',
            type: 'string',
            required: true,
            ui: { label: 'Order Number' },
          }),
          EntityDefinitionFactory.createField({
            name: 'customerId',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            required: true,
            defaultValue: 'new',
            validation: {
              enum: ['new', 'processing', 'ready', 'completed', 'cancelled'],
            },
            ui: { label: 'Status' },
          }),
          EntityDefinitionFactory.createField({
            name: 'totalNet',
            type: 'number',
            required: true,
            ui: { label: 'Total Net' },
          }),
          EntityDefinitionFactory.createField({
            name: 'totalGross',
            type: 'number',
            required: true,
            ui: { label: 'Total Gross' },
          }),
          EntityDefinitionFactory.createField({
            name: 'notes',
            type: 'string',
            ui: { label: 'Notes', widget: 'textarea' },
          }),
        ],
      }),
    );

    // Product
    this.registerEntity(
      EntityDefinitionFactory.create({
        code: 'product',
        name: 'Product',
        description: 'Product entity',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'sku',
            type: 'string',
            required: true,
            ui: { label: 'SKU' },
          }),
          EntityDefinitionFactory.createField({
            name: 'name',
            type: 'string',
            required: true,
            ui: { label: 'Name', placeholder: 'Product name' },
          }),
          EntityDefinitionFactory.createField({
            name: 'description',
            type: 'string',
            ui: { label: 'Description', widget: 'textarea' },
          }),
          EntityDefinitionFactory.createField({
            name: 'price',
            type: 'number',
            required: true,
            ui: { label: 'Price' },
          }),
          EntityDefinitionFactory.createField({
            name: 'unit',
            type: 'string',
            defaultValue: 'szt',
            ui: { label: 'Unit' },
          }),
          EntityDefinitionFactory.createField({
            name: 'category',
            type: 'string',
            ui: { label: 'Category' },
          }),
          EntityDefinitionFactory.createField({
            name: 'stock',
            type: 'number',
            defaultValue: 0,
            ui: { label: 'Stock' },
          }),
          EntityDefinitionFactory.createField({
            name: 'active',
            type: 'boolean',
            defaultValue: true,
            ui: { label: 'Active', widget: 'checkbox' },
          }),
        ],
      }),
    );

    // Quote
    this.registerEntity(
      EntityDefinitionFactory.create({
        code: 'quote',
        name: 'Quote',
        description: 'Quote entity',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'quoteNumber',
            type: 'string',
            required: true,
            ui: { label: 'Quote Number' },
          }),
          EntityDefinitionFactory.createField({
            name: 'customerId',
            type: 'string',
            required: true,
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            required: true,
            defaultValue: 'draft',
            validation: {
              enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
            },
            ui: { label: 'Status' },
          }),
          EntityDefinitionFactory.createField({
            name: 'validUntil',
            type: 'date',
            ui: { label: 'Valid Until' },
          }),
          EntityDefinitionFactory.createField({
            name: 'totalNet',
            type: 'number',
            required: true,
            ui: { label: 'Total Net' },
          }),
          EntityDefinitionFactory.createField({
            name: 'totalGross',
            type: 'number',
            required: true,
            ui: { label: 'Total Gross' },
          }),
          EntityDefinitionFactory.createField({
            name: 'notes',
            type: 'string',
            ui: { label: 'Notes', widget: 'textarea' },
          }),
        ],
      }),
    );

    this.logger.log('Registered 4 core entities: customer, order, product, quote');
  }
}
