import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusService } from './event-bus.service';
import { OrderCreatedHandler } from './handlers/order-created.handler';
import { CustomerCreatedHandler } from './handlers/customer-created.handler';
import { PrismaModule } from '../database/prisma.module';

/**
 * EventsModule - Global event bus module
 *
 * This module provides:
 * - EventBusService for emitting domain events
 * - Event handlers for various domain events
 * - Integration with EventLog (audit trail)
 * - Integration with WorkflowTriggers (automation)
 */
@Global()
@Module({
  imports: [
    // EventEmitter for local event handling
    EventEmitterModule.forRoot({
      // Use wildcards for event patterns
      wildcard: true,
      // Event delimiter
      delimiter: '.',
      // Maximum number of listeners (0 = unlimited)
      maxListeners: 20,
      // Log emitted events (for debugging)
      verboseMemoryLeak: true,
      // Ignore errors in event handlers
      ignoreErrors: false,
    }),
    PrismaModule,
  ],
  providers: [
    EventBusService,
    // Event handlers
    OrderCreatedHandler,
    CustomerCreatedHandler,
  ],
  exports: [EventBusService],
})
export class EventsModule {}
