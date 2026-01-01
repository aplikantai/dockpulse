import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '../../events/interfaces/domain-event.interface';
import { StockService } from '../services/stock.service';

/**
 * OrderStockHandler - Handles stock deduction when orders are created
 *
 * This handler listens to 'order.created' events and automatically
 * deducts stock for ordered products.
 */
@Injectable()
export class OrderStockHandler {
  private readonly logger = new Logger(OrderStockHandler.name);

  constructor(private readonly stockService: StockService) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: DomainEvent): Promise<void> {
    this.logger.log(`Handling order.created event [${event.id}]`);

    const order = event.payload;

    if (!order.items || order.items.length === 0) {
      this.logger.debug(`Order ${order.id} has no items, skipping stock deduction`);
      return;
    }

    try {
      // Deduct stock for each item
      for (const item of order.items) {
        await this.stockService.deductStock({
          tenantId: event.tenantId,
          productId: item.productId,
          quantity: item.quantity,
          reason: `Order ${order.orderNumber}`,
          reference: order.id,
          userId: event.metadata.userId,
        });

        this.logger.debug(
          `Deducted ${item.quantity} units of product ${item.productId} for order ${order.orderNumber}`,
        );
      }

      this.logger.log(
        `Successfully deducted stock for order ${order.orderNumber} (${order.items.length} items)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to deduct stock for order ${order.orderNumber}: ${error.message}`,
      );
      // Don't throw - we want the order to be created even if stock deduction fails
      // TODO: Emit a 'stock.deduction.failed' event for manual handling
    }
  }
}
