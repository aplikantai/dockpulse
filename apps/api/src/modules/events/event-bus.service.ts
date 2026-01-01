import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { PrismaService } from '../database/prisma.service';
import { DomainEvent, DomainEventFactory } from './interfaces/domain-event.interface';

/**
 * EventBusService - Central event bus for the entire system
 *
 * Responsibilities:
 * 1. Emit events locally (EventEmitter2)
 * 2. Publish events to Redis (distributed)
 * 3. Persist events to EventLog (audit trail)
 * 4. Trigger WorkflowTriggers (automation)
 */
@Injectable()
export class EventBusService implements OnModuleInit {
  private readonly logger = new Logger(EventBusService.name);
  private redisPublisher: Redis;
  private redisSubscriber: Redis;
  private readonly EVENTS_CHANNEL = 'dockpulse:events';

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {
    // Initialize Redis clients
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    this.redisPublisher = new Redis(redisConfig);
    this.redisSubscriber = new Redis(redisConfig);
  }

  async onModuleInit() {
    // Subscribe to Redis events channel
    await this.redisSubscriber.subscribe(this.EVENTS_CHANNEL);

    this.redisSubscriber.on('message', async (channel, message) => {
      if (channel === this.EVENTS_CHANNEL) {
        try {
          const event: DomainEvent = JSON.parse(message);
          // Re-emit locally for handlers in this instance
          this.eventEmitter.emit(event.type, event);
        } catch (error) {
          this.logger.error(`Failed to process Redis event: ${error.message}`);
        }
      }
    });

    this.logger.log('EventBus initialized and subscribed to Redis');
  }

  /**
   * Emit a domain event
   * This is the main entry point for publishing events
   */
  async emit<T>(event: DomainEvent<T>): Promise<void> {
    try {
      this.logger.debug(`Emitting event: ${event.type} [${event.id}]`);

      // 1. Persist to EventLog (audit trail)
      await this.persistEvent(event);

      // 2. Emit locally for immediate handlers
      this.eventEmitter.emit(event.type, event);

      // 3. Publish to Redis for distributed handling
      await this.publishToRedis(event);

      // 4. Trigger WorkflowTriggers (if any)
      await this.triggerWorkflows(event);

      this.logger.debug(`Event emitted successfully: ${event.type} [${event.id}]`);
    } catch (error) {
      this.logger.error(`Failed to emit event ${event.type}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Emit event using factory (convenience method)
   */
  async emitEvent<T>(params: {
    type: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    payload: T;
    userId?: string;
    correlationId?: string;
    context?: Record<string, any>;
  }): Promise<void> {
    const event = DomainEventFactory.create(params);
    await this.emit(event);
  }

  /**
   * Persist event to database (EventLog)
   */
  private async persistEvent(event: DomainEvent): Promise<void> {
    try {
      await this.prisma.eventLog.create({
        data: {
          id: event.id,
          tenantId: event.tenantId,
          eventType: event.type,
          entityType: event.entityType,
          entityId: event.entityId,
          userId: event.metadata.userId,
          payload: event.payload as any,
          metadata: {
            version: event.metadata.version,
            correlationId: event.metadata.correlationId,
            causationId: event.metadata.causationId,
            context: event.metadata.context,
          } as any,
          createdAt: event.metadata.timestamp,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to persist event to database: ${error.message}`);
      // Don't throw - event processing should continue even if persistence fails
    }
  }

  /**
   * Publish event to Redis (distributed)
   */
  private async publishToRedis(event: DomainEvent): Promise<void> {
    try {
      const message = JSON.stringify(event);
      await this.redisPublisher.publish(this.EVENTS_CHANNEL, message);
    } catch (error) {
      this.logger.error(`Failed to publish to Redis: ${error.message}`);
      // Don't throw - local handlers should still work
    }
  }

  /**
   * Trigger WorkflowTriggers based on event
   */
  private async triggerWorkflows(event: DomainEvent): Promise<void> {
    try {
      // Find matching workflow triggers
      const triggers = await this.prisma.workflowTrigger.findMany({
        where: {
          tenantId: event.tenantId,
          isEnabled: true,
          eventType: event.type,
        },
      });

      for (const trigger of triggers) {
        try {
          // Evaluate conditions (if any)
          const shouldTrigger = this.evaluateTriggerConditions(
            trigger.conditions as any,
            event,
          );

          if (shouldTrigger) {
            this.logger.log(
              `Triggering workflow: ${trigger.name} for event ${event.type}`,
            );

            // Execute actions
            await this.executeTriggerActions(trigger, event);

            // Log execution
            await this.prisma.workflowExecution.create({
              data: {
                triggerId: trigger.id,
                tenantId: trigger.tenantId,
                eventId: event.id,
                status: 'SUCCESS',
                executedAt: new Date(),
              },
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to execute workflow trigger ${trigger.id}: ${error.message}`,
          );

          // Log failure
          await this.prisma.workflowExecution.create({
            data: {
              triggerId: trigger.id,
              tenantId: trigger.tenantId,
              eventId: event.id,
              status: 'FAILED',
              error: error.message,
              executedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to trigger workflows: ${error.message}`);
      // Don't throw - event processing should continue
    }
  }

  /**
   * Evaluate trigger conditions
   */
  private evaluateTriggerConditions(
    conditions: any,
    event: DomainEvent,
  ): boolean {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions = always trigger
    }

    // TODO: Implement condition evaluation logic
    // For now, always return true
    return true;
  }

  /**
   * Execute trigger actions
   */
  private async executeTriggerActions(
    trigger: any,
    event: DomainEvent,
  ): Promise<void> {
    const actions = trigger.actions as any;

    if (!actions || !Array.isArray(actions)) {
      return;
    }

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_email':
            this.logger.log(`Would send email: ${action.config?.to}`);
            // TODO: Integrate with email service
            break;

          case 'send_sms':
            this.logger.log(`Would send SMS: ${action.config?.to}`);
            // TODO: Integrate with SMS service
            break;

          case 'webhook':
            this.logger.log(`Would call webhook: ${action.config?.url}`);
            // TODO: Integrate with webhook service
            break;

          case 'update_field':
            this.logger.log(
              `Would update field: ${action.config?.field} = ${action.config?.value}`,
            );
            // TODO: Implement field update logic
            break;

          default:
            this.logger.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        this.logger.error(`Failed to execute action ${action.type}: ${error.message}`);
      }
    }
  }

  /**
   * Get event history for entity
   */
  async getEventHistory(params: {
    tenantId: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
  }): Promise<DomainEvent[]> {
    const events = await this.prisma.eventLog.findMany({
      where: {
        tenantId: params.tenantId,
        entityType: params.entityType,
        entityId: params.entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
    });

    return events.map((event) => ({
      id: event.id,
      type: event.eventType,
      tenantId: event.tenantId,
      entityType: event.entityType,
      entityId: event.entityId,
      payload: event.payload as any,
      metadata: {
        userId: event.userId,
        timestamp: event.createdAt,
        version: (event.metadata as any)?.version || 1,
        correlationId: (event.metadata as any)?.correlationId,
        causationId: (event.metadata as any)?.causationId,
        context: (event.metadata as any)?.context,
      },
    }));
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    await this.redisPublisher.quit();
    await this.redisSubscriber.quit();
    this.logger.log('EventBus shut down');
  }
}
