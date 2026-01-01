import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, IEventHandler } from '../interfaces/domain-event.interface';

/**
 * Handler for customer.created events
 *
 * Actions:
 * - Send welcome email
 * - Create default tags
 * - Notify sales team
 */
@Injectable()
export class CustomerCreatedHandler implements IEventHandler {
  private readonly logger = new Logger(CustomerCreatedHandler.name);

  @OnEvent('customer.created')
  async handle(event: DomainEvent): Promise<void> {
    this.logger.log(`Handling customer.created event [${event.id}]`);

    try {
      const customer = event.payload;

      this.logger.debug(`Customer ${customer.name} created for tenant ${event.tenantId}`);

      // Send welcome email
      await this.sendWelcomeEmail(customer, event.tenantId);

      // Notify sales team
      await this.notifySalesTeam(customer, event.tenantId);

      this.logger.log(`Customer created event handled successfully [${event.id}]`);
    } catch (error) {
      this.logger.error(`Failed to handle customer.created event: ${error.message}`);
      throw error;
    }
  }

  private async sendWelcomeEmail(customer: any, tenantId: string): Promise<void> {
    this.logger.debug(`Would send welcome email to ${customer.email}`);
    // TODO: Integrate with email service
  }

  private async notifySalesTeam(customer: any, tenantId: string): Promise<void> {
    this.logger.debug(`Would notify sales team about new customer ${customer.name}`);
    // TODO: Integrate with notification service
  }
}
