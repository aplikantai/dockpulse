import { SetMetadata } from '@nestjs/common';
import { EntityDefinition } from '../interfaces/entity-definition.interface';
import { EntityExtension } from '../interfaces/entity-extension.interface';

/**
 * Metadata keys for entity decorators
 */
export const ENTITY_DEFINITION_KEY = 'databus:entity';
export const ENTITY_EXTENSION_KEY = 'databus:extension';

/**
 * @Entity() - Decorator to mark a class as an entity definition
 *
 * Usage:
 * ```typescript
 * @Entity({
 *   code: 'stock_movement',
 *   name: 'Stock Movement',
 *   baseFields: [...]
 * })
 * export class StockMovementEntity {}
 * ```
 */
export const Entity = (definition: EntityDefinition) =>
  SetMetadata(ENTITY_DEFINITION_KEY, definition);

/**
 * @ExtendEntity() - Decorator to mark a class as an entity extension
 *
 * Usage:
 * ```typescript
 * @ExtendEntity({
 *   targetEntity: 'product',
 *   moduleCode: '@stock',
 *   fields: [
 *     { name: 'stockQuantity', type: 'number', required: true }
 *   ]
 * })
 * export class ProductStockExtension {}
 * ```
 */
export const ExtendEntity = (extension: EntityExtension) =>
  SetMetadata(ENTITY_EXTENSION_KEY, extension);
