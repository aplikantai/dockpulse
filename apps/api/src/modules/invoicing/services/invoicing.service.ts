import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventBusService } from '../../events/event-bus.service';

/**
 * InvoicingService - Handles invoice operations
 */
@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Generate invoice from order
   */
  async generateInvoiceFromOrder(params: {
    tenantId: string;
    orderId: string;
    userId?: string;
  }): Promise<any> {
    const { tenantId, orderId, userId } = params;

    this.logger.debug(`Generating invoice for order ${orderId}`);

    // Get order details
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
      include: {
        customer: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Calculate amounts
    const amount = Number(order.totalNet) || 0;
    const taxRate = 0.0; // TODO: Get from module config or customer settings
    const taxAmount = amount * taxRate;
    const totalAmount = Number(order.totalGross) || amount;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Calculate due date (default NET 30)
    const invoiceDate = new Date();
    const dueDate = new Date();
    // TODO: Get payment terms from customer settings when metadata field is added
    const paymentTerms = 'NET 30'; // Default payment terms
    const dueDays = this.parsePaymentTerms(paymentTerms);
    dueDate.setDate(dueDate.getDate() + dueDays);

    // Create invoice (stored in metadata for now)
    // In a real implementation, this would be stored in a dedicated invoices table
    const invoice = {
      id: this.generateId(),
      invoiceNumber,
      orderId: order.id,
      customerId: order.customerId,
      amount,
      taxAmount,
      totalAmount,
      status: 'draft',
      dueDate: dueDate.toISOString(),
      paidDate: null,
      tenantId,
      createdAt: invoiceDate.toISOString(),
    };

    // Update order with invoice details
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...(order.metadata as any),
          invoiceNumber,
          invoiceStatus: 'draft',
          invoiceDate: invoiceDate.toISOString(),
          dueDate: dueDate.toISOString(),
        },
      },
    });

    // Emit invoice.created event
    await this.eventBus.emitEvent({
      type: 'invoice.created',
      tenantId,
      entityType: 'invoice',
      entityId: invoice.id,
      payload: invoice,
      userId,
    });

    this.logger.log(
      `Generated invoice ${invoiceNumber} for order ${order.orderNumber}`,
    );

    return invoice;
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(params: {
    tenantId: string;
    invoiceId: string;
    orderId: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    userId?: string;
  }): Promise<void> {
    const { tenantId, invoiceId, orderId, status, userId } = params;

    this.logger.debug(`Updating invoice ${invoiceId} status to ${status}`);

    // Get order
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Update order metadata
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...(order.metadata as any),
          invoiceStatus: status,
        },
      },
    });

    // Emit invoice.status_updated event
    await this.eventBus.emitEvent({
      type: 'invoice.status_updated',
      tenantId,
      entityType: 'invoice',
      entityId: invoiceId,
      payload: {
        invoiceId,
        orderId,
        status,
        previousStatus: (order.metadata as any)?.invoiceStatus,
      },
      userId,
    });

    this.logger.log(`Updated invoice ${invoiceId} status to ${status}`);
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(params: {
    tenantId: string;
    invoiceId: string;
    orderId: string;
    paidDate?: Date;
    userId?: string;
  }): Promise<void> {
    const { tenantId, invoiceId, orderId, paidDate, userId } = params;

    this.logger.debug(`Marking invoice ${invoiceId} as paid`);

    const paymentDate = paidDate || new Date();

    // Get order
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Update order metadata
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...(order.metadata as any),
          invoiceStatus: 'paid',
          paidDate: paymentDate.toISOString(),
        },
      },
    });

    // Emit invoice.paid event
    await this.eventBus.emitEvent({
      type: 'invoice.paid',
      tenantId,
      entityType: 'invoice',
      entityId: invoiceId,
      payload: {
        invoiceId,
        orderId,
        paidDate: paymentDate,
        amount: (order.metadata as any)?.totalAmount || Number(order.totalGross),
      },
      userId,
    });

    // Emit order.payment_received event
    await this.eventBus.emitEvent({
      type: 'order.payment_received',
      tenantId,
      entityType: 'order',
      entityId: orderId,
      payload: {
        orderId,
        invoiceId,
        paidDate: paymentDate,
        amount: Number(order.totalGross),
      },
      userId,
    });

    this.logger.log(`Marked invoice ${invoiceId} as paid`);
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(tenantId: string): Promise<any[]> {
    this.logger.debug(`Fetching overdue invoices for tenant ${tenantId}`);

    const today = new Date();

    // Find orders with overdue invoices
    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
      },
      include: {
        customer: true,
      },
    });

    // Filter orders with overdue invoices
    const overdueInvoices = orders
      .filter((order) => {
        const metadata = order.metadata as any;
        if (!metadata?.invoiceStatus || !metadata?.dueDate) {
          return false;
        }

        const status = metadata.invoiceStatus;
        const dueDate = new Date(metadata.dueDate);

        // Invoice is overdue if status is not 'paid' or 'cancelled' and due date has passed
        return (
          (status === 'draft' || status === 'sent' || status === 'overdue') &&
          dueDate < today
        );
      })
      .map((order) => {
        const metadata = order.metadata as any;
        return {
          id: metadata.invoiceId || this.generateId(),
          invoiceNumber: metadata.invoiceNumber,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customer?.name,
          amount: metadata.amount || Number(order.totalNet),
          taxAmount: metadata.taxAmount || 0,
          totalAmount: metadata.totalAmount || Number(order.totalGross),
          status: metadata.invoiceStatus,
          dueDate: metadata.dueDate,
          daysPastDue: Math.floor(
            (today.getTime() - new Date(metadata.dueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          tenantId,
        };
      });

    // Update status to 'overdue' for overdue invoices
    for (const invoice of overdueInvoices) {
      if (invoice.status !== 'overdue') {
        await this.updateInvoiceStatus({
          tenantId,
          invoiceId: invoice.id,
          orderId: invoice.orderId,
          status: 'overdue',
        });
      }
    }

    this.logger.debug(`Found ${overdueInvoices.length} overdue invoices`);

    return overdueInvoices;
  }

  /**
   * Generate invoice number
   */
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    // Get count of orders with invoices
    const count = await this.prisma.order.count({
      where: {
        tenantId,
        metadata: {
          path: ['invoiceNumber'],
          not: null,
        },
      },
    });

    const nextNumber = count + 1;
    const prefix = 'INV-'; // TODO: Get from module config
    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Parse payment terms to days (e.g., "NET 30" -> 30)
   */
  private parsePaymentTerms(terms: string): number {
    if (!terms) {
      return 30; // Default to 30 days
    }

    const match = terms.match(/NET\s*(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }

    return 30; // Default to 30 days
  }

  /**
   * Generate unique ID (simple implementation)
   */
  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
