import { v4 as uuidv4 } from 'uuid';

/**
 * Base interface for all domain events in the system
 * Events are immutable facts that represent something that happened
 */
export interface DomainEvent<T = any> {
  /** Unique event ID */
  id: string;

  /** Event type (e.g., 'order.created', 'customer.updated') */
  type: string;

  /** Tenant ID (for multi-tenancy) */
  tenantId: string;

  /** Entity type (e.g., 'order', 'customer') */
  entityType: string;

  /** Entity ID */
  entityId: string;

  /** Event payload (entity data) */
  payload: T;

  /** Event metadata */
  metadata: EventMetadata;
}

/**
 * Event metadata
 */
export interface EventMetadata {
  /** User ID who triggered the event (if applicable) */
  userId?: string;

  /** Timestamp when event occurred */
  timestamp: Date;

  /** Event version (for event sourcing compatibility) */
  version: number;

  /** Correlation ID (for tracing related events) */
  correlationId?: string;

  /** Causation ID (event that caused this event) */
  causationId?: string;

  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Helper to create domain events
 */
export class DomainEventFactory {
  static create<T>(params: {
    type: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    payload: T;
    userId?: string;
    correlationId?: string;
    causationId?: string;
    context?: Record<string, any>;
  }): DomainEvent<T> {
    return {
      id: uuidv4(),
      type: params.type,
      tenantId: params.tenantId,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: params.payload,
      metadata: {
        userId: params.userId,
        timestamp: new Date(),
        version: 1,
        correlationId: params.correlationId || uuidv4(),
        causationId: params.causationId,
        context: params.context,
      },
    };
  }
}

/**
 * Event handler interface
 */
export interface IEventHandler<T = any> {
  handle(event: DomainEvent<T>): Promise<void>;
}

/**
 * Event subscription configuration
 */
export interface EventSubscription {
  /** Event type pattern (supports wildcards: 'order.*', '*.created') */
  eventType: string;

  /** Handler class */
  handler: any;

  /** Priority (higher = executed first) */
  priority?: number;

  /** Whether to retry on failure */
  retry?: boolean;

  /** Max retry attempts */
  maxRetries?: number;
}
