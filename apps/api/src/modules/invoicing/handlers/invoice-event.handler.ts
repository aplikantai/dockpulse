import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '../../events/interfaces/domain-event.interface';

/**
 * InvoiceEventHandler - Handles invoice lifecycle events
 *
 * This handler listens to invoice events and performs actions such as:
 * - Sending invoice emails when invoice is created
 * - Emitting payment received events when invoice is paid
 */
@Injectable()
export class InvoiceEventHandler {
  private readonly logger = new Logger(InvoiceEventHandler.name);

  @OnEvent('invoice.created')
  async handleInvoiceCreated(event: DomainEvent): Promise<void> {
    this.logger.log(`Handling invoice.created event [${event.id}]`);

    const invoice = event.payload;

    try {
      // Send invoice to customer (email)
      // TODO: Integrate with email service
      this.logger.log(
        `Would send invoice ${invoice.invoiceNumber} to customer ${invoice.customerId} via email`,
      );

      // In a real implementation, this would:
      // 1. Fetch customer email from database
      // 2. Generate PDF invoice
      // 3. Send email with PDF attachment
      // 4. Update invoice status to 'sent'

      this.logger.log(
        `Invoice ${invoice.invoiceNumber} created successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send invoice ${invoice.invoiceNumber}: ${error.message}`,
      );
    }
  }

  @OnEvent('invoice.paid')
  async handleInvoicePaid(event: DomainEvent): Promise<void> {
    this.logger.log(`Handling invoice.paid event [${event.id}]`);

    const payment = event.payload;

    try {
      // Additional actions when invoice is paid
      // - Update customer account balance
      // - Send payment confirmation email
      // - Trigger accounting integration

      this.logger.log(
        `Invoice ${payment.invoiceId} marked as paid. Amount: ${payment.amount}`,
      );

      // Note: order.payment_received event is already emitted by InvoicingService.markInvoiceAsPaid()
    } catch (error) {
      this.logger.error(
        `Failed to process paid invoice ${payment.invoiceId}: ${error.message}`,
      );
    }
  }

  @OnEvent('invoice.status_updated')
  async handleInvoiceStatusUpdated(event: DomainEvent): Promise<void> {
    this.logger.log(`Handling invoice.status_updated event [${event.id}]`);

    const { invoiceId, status, previousStatus } = event.payload;

    try {
      this.logger.log(
        `Invoice ${invoiceId} status changed: ${previousStatus} -> ${status}`,
      );

      // Handle status-specific actions
      switch (status) {
        case 'sent':
          this.logger.log(`Invoice ${invoiceId} has been sent to customer`);
          break;
        case 'overdue':
          this.logger.log(`Invoice ${invoiceId} is now overdue - sending reminder`);
          // TODO: Send overdue reminder email
          break;
        case 'cancelled':
          this.logger.log(`Invoice ${invoiceId} has been cancelled`);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle status update for invoice ${invoiceId}: ${error.message}`,
      );
    }
  }
}
