import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '../../events/interfaces/domain-event.interface';
import { CalendarService } from '../services/calendar.service';

/**
 * OrderCalendarHandler - Creates calendar events when orders are created
 *
 * This handler listens to 'order.created' events and automatically
 * creates a calendar event for scheduled delivery.
 */
@Injectable()
export class OrderCalendarHandler {
  private readonly logger = new Logger(OrderCalendarHandler.name);

  constructor(private readonly calendarService: CalendarService) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: DomainEvent): Promise<void> {
    this.logger.log(`Handling order.created event for calendar [${event.id}]`);

    const order = event.payload;

    try {
      // Calculate delivery date (7 days from now as default)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 7);

      // Use scheduledDeliveryDate from order if available
      const scheduledDate = order.scheduledDeliveryDate
        ? new Date(order.scheduledDeliveryDate)
        : deliveryDate;

      // Set delivery window (9 AM - 5 PM on delivery date)
      const startDate = new Date(scheduledDate);
      startDate.setHours(9, 0, 0, 0);

      const endDate = new Date(scheduledDate);
      endDate.setHours(17, 0, 0, 0);

      // Create calendar event for delivery
      await this.calendarService.createEvent({
        tenantId: event.tenantId,
        title: `Delivery: Order ${order.orderNumber}`,
        description: `Scheduled delivery for order ${order.orderNumber}. Customer: ${order.customerName || 'N/A'}`,
        startDate,
        endDate,
        type: 'delivery',
        relatedEntityType: 'order',
        relatedEntityId: order.id,
        userId: event.metadata.userId,
      });

      this.logger.log(
        `Created delivery calendar event for order ${order.orderNumber} on ${scheduledDate.toLocaleDateString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create calendar event for order ${order.orderNumber}: ${error.message}`,
      );
      // Don't throw - order should still be created even if calendar event fails
    }
  }
}
