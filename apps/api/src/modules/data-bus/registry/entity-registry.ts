import { Injectable, Logger } from '@nestjs/common';
import {
  EntityDefinition,
  FieldDefinition,
  RelationDefinition,
} from '../interfaces/entity-definition.interface';
import { EntityExtension } from '../interfaces/entity-extension.interface';

/**
 * EntityRegistry - In-memory registry of all entities and their extensions
 *
 * This is the core of the Data Bus - it maintains a registry of:
 * - Core entities (Customer, Order, Product, Quote)
 * - Module-provided entities (StockMovement, CalendarEvent, Invoice)
 * - Extensions to entities (fields, relations, hooks, actions, tabs)
 */
@Injectable()
export class EntityRegistry {
  private readonly logger = new Logger(EntityRegistry.name);

  /**
   * Map of entity code -> entity definition
   */
  private entities: Map<string, EntityDefinition> = new Map();

  /**
   * Map of entity code -> extensions
   */
  private extensions: Map<string, EntityExtension[]> = new Map();

  /**
   * Register a core or module-provided entity
   */
  registerEntity(entity: EntityDefinition): void {
    if (this.entities.has(entity.code)) {
      this.logger.warn(
        `Entity ${entity.code} is already registered. Overwriting.`,
      );
    }

    this.entities.set(entity.code, entity);
    this.logger.log(`Registered entity: ${entity.code} (${entity.name})`);
  }

  /**
   * Register an extension to an existing entity
   */
  registerExtension(extension: EntityExtension): void {
    const targetEntity = extension.targetEntity;

    if (!this.entities.has(targetEntity)) {
      throw new Error(
        `Cannot extend entity ${targetEntity} - entity not found. Register the entity first.`,
      );
    }

    // Get or create extensions array for this entity
    const existingExtensions = this.extensions.get(targetEntity) || [];
    existingExtensions.push(extension);
    this.extensions.set(targetEntity, existingExtensions);

    // Apply extension to entity definition
    this.applyExtension(targetEntity, extension);

    this.logger.log(
      `Registered extension from module ${extension.moduleCode} to entity ${targetEntity}`,
    );
  }

  /**
   * Get an entity definition (with all extensions applied)
   */
  getEntity(entityCode: string): EntityDefinition | undefined {
    return this.entities.get(entityCode);
  }

  /**
   * Get all registered entities
   */
  getAllEntities(): EntityDefinition[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get all extensions for an entity
   */
  getExtensions(entityCode: string): EntityExtension[] {
    return this.extensions.get(entityCode) || [];
  }

  /**
   * Check if an entity is registered
   */
  hasEntity(entityCode: string): boolean {
    return this.entities.has(entityCode);
  }

  /**
   * Get all fields for an entity (base + extended)
   */
  getFields(entityCode: string): FieldDefinition[] {
    const entity = this.entities.get(entityCode);
    if (!entity) {
      return [];
    }

    return [...entity.baseFields, ...entity.extendedFields];
  }

  /**
   * Get a specific field
   */
  getField(entityCode: string, fieldName: string): FieldDefinition | undefined {
    const fields = this.getFields(entityCode);
    return fields.find((f) => f.name === fieldName);
  }

  /**
   * Get all relations for an entity
   */
  getRelations(entityCode: string): RelationDefinition[] {
    const entity = this.entities.get(entityCode);
    return entity?.relations || [];
  }

  /**
   * Apply an extension to an entity
   */
  private applyExtension(
    entityCode: string,
    extension: EntityExtension,
  ): void {
    const entity = this.entities.get(entityCode);
    if (!entity) {
      return;
    }

    // Add fields
    if (extension.fields && extension.fields.length > 0) {
      extension.fields.forEach((field) => {
        field.addedBy = extension.moduleCode;
        entity.extendedFields.push(field);
      });
      this.logger.debug(
        `Added ${extension.fields.length} fields to ${entityCode}`,
      );
    }

    // Add relations
    if (extension.relations && extension.relations.length > 0) {
      extension.relations.forEach((relation) => {
        relation.addedBy = extension.moduleCode;
        entity.relations.push(relation);
      });
      this.logger.debug(
        `Added ${extension.relations.length} relations to ${entityCode}`,
      );
    }

    // Add hooks
    if (extension.hooks) {
      Object.keys(extension.hooks).forEach((hookType) => {
        const hooks = extension.hooks[hookType as keyof typeof extension.hooks];
        if (hooks && Array.isArray(hooks)) {
          hooks.forEach((hook) => {
            hook.addedBy = extension.moduleCode;
          });
          const entityHooks = entity.hooks[hookType as keyof typeof entity.hooks];
          if (Array.isArray(entityHooks)) {
            entityHooks.push(...hooks);
          }
        }
      });
      this.logger.debug(`Added hooks to ${entityCode}`);
    }

    // Store extension metadata
    if (!entity.metadata) {
      entity.metadata = {};
    }
    if (!entity.metadata.extensions) {
      entity.metadata.extensions = [];
    }
    entity.metadata.extensions.push({
      module: extension.moduleCode,
      fieldsCount: extension.fields?.length || 0,
      relationsCount: extension.relations?.length || 0,
      actionsCount: extension.actions?.length || 0,
      tabsCount: extension.tabs?.length || 0,
    });
  }

  /**
   * Get entity schema for API response
   */
  getEntitySchema(entityCode: string): any {
    const entity = this.getEntity(entityCode);
    if (!entity) {
      return null;
    }

    return {
      code: entity.code,
      name: entity.name,
      description: entity.description,
      fields: this.getFields(entityCode).map((f) => ({
        name: f.name,
        type: f.type,
        required: f.required,
        visible: f.visible,
        ui: f.ui,
        validation: f.validation,
        addedBy: f.addedBy,
      })),
      relations: entity.relations.map((r) => ({
        name: r.name,
        targetEntity: r.targetEntity,
        type: r.type,
        required: r.required,
        addedBy: r.addedBy,
      })),
      extensions: entity.metadata?.extensions || [],
    };
  }

  /**
   * Clear all registrations (for testing)
   */
  clear(): void {
    this.entities.clear();
    this.extensions.clear();
    this.logger.log('Cleared entity registry');
  }
}
