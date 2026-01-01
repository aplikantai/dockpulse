import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, IEventHandler } from '../interfaces/domain-event.interface';

/**
 * Handler for order.created events
 *
 * Actions:
 * - Send confirmation email to customer
 * - Notify warehouse (if stock module enabled)
 * - Update analytics
 */
@Injectable()
export class OrderCreatedHandler implements IEventHandler {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  @OnEvent('order.created')
  async handle(event: DomainEvent): Promise<void> {
    this.logger.log(`Handling order.created event [${event.id}]`);

    try {
      const order = event.payload;

      // 1. Log for debugging
      this.logger.debug(`Order ${order.orderNumber} created for tenant ${event.tenantId}`);

      // 2. Send email notification (would integrate with email service)
      await this.sendOrderConfirmation(order, event.tenantId);

      // 3. Update stock (would integrate with stock module if enabled)
      await this.updateStock(order, event.tenantId);

      // 4. Notify webhooks (would integrate with webhook service)
      await this.notifyWebhooks(event);

      this.logger.log(`Order created event handled successfully [${event.id}]`);
    } catch (error) {
      this.logger.error(`Failed to handle order.created event: ${error.message}`);
      throw error;
    }
  }

  private async sendOrderConfirmation(order: any, tenantId: string): Promise<void> {
    this.logger.debug(`Would send confirmation email for order ${order.orderNumber}`);
    // TODO: Integrate with email service
  }

  private async updateStock(order: any, tenantId: string): Promise<void> {
    this.logger.debug(`Would update stock for order ${order.orderNumber}`);
    // TODO: Integrate with stock module
  }

  private async notifyWebhooks(event: DomainEvent): Promise<void> {
    this.logger.debug(`Would notify webhooks for event ${event.type}`);
    // TODO: Integrate with webhook service
  }
}
