import { SetMetadata } from '@nestjs/common';
import { ModuleDefinition } from '../interfaces/module-definition.interface';

/**
 * Metadata key for module decorator
 */
export const DOCKPULSE_MODULE_KEY = 'dockpulse:module';

/**
 * @DockPulseModule() - Decorator to mark a NestJS module as a DockPulse module
 *
 * Usage:
 * ```typescript
 * @DockPulseModule({
 *   code: '@stock',
 *   name: 'Stock Management',
 *   version: '1.0.0',
 *   category: ModuleCategory.INVENTORY,
 *   dependencies: ['@products'],
 * })
 * @Module({
 *   imports: [...],
 *   providers: [...],
 * })
 * export class StockModule implements OnModuleInit {
 *   // ...
 * }
 * ```
 */
export const DockPulseModule = (
  definition: Omit<ModuleDefinition, 'moduleClass'>,
) => SetMetadata(DOCKPULSE_MODULE_KEY, definition);
