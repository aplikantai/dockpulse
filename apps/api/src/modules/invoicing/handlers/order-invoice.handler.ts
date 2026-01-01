import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '../../events/interfaces/domain-event.interface';
import { InvoicingService } from '../services/invoicing.service';

/**
 * OrderInvoiceHandler - Automatically generates invoices when orders are completed
 *
 * This handler listens to 'order.completed' events and automatically
 * generates invoices for completed orders.
 */
@Injectable()
export class OrderInvoiceHandler {
  private readonly logger = new Logger(OrderInvoiceHandler.name);

  constructor(private readonly invoicingService: InvoicingService) {}

  @OnEvent('order.completed')
  async handleOrderCompleted(event: DomainEvent): Promise<void> {
    this.logger.log(`Handling order.completed event for invoicing [${event.id}]`);

    const order = event.payload;

    try {
      // Auto-generate invoice for completed order
      const invoice = await this.invoicingService.generateInvoiceFromOrder({
        tenantId: event.tenantId,
        orderId: order.id,
        userId: event.metadata.userId,
      });

      this.logger.log(
        `Successfully generated invoice ${invoice.invoiceNumber} for order ${order.orderNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate invoice for order ${order.orderNumber}: ${error.message}`,
      );
      // Don't throw - order should still be marked as completed even if invoice generation fails
    }
  }
}
