import { SetMetadata } from '@nestjs/common';

export const EVENT_HANDLER_METADATA = 'EVENT_HANDLER';

/**
 * Decorator to mark a class as an event handler
 *
 * @param eventType - Event type pattern (supports wildcards: 'order.*', '*.created')
 * @param options - Handler options
 *
 * @example
 * ```typescript
 * @EventHandler('order.created')
 * export class OrderCreatedHandler implements IEventHandler {
 *   async handle(event: DomainEvent) {
 *     // Handle order created event
 *   }
 * }
 * ```
 */
export function EventHandler(
  eventType: string,
  options?: {
    priority?: number;
    retry?: boolean;
    maxRetries?: number;
  },
) {
  return SetMetadata(EVENT_HANDLER_METADATA, {
    eventType,
    ...options,
  });
}
