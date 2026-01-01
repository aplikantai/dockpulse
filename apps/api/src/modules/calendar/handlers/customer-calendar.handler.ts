import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '../../events/interfaces/domain-event.interface';
import { CalendarService } from '../services/calendar.service';

/**
 * CustomerCalendarHandler - Creates calendar reminders when customers are created
 *
 * This handler listens to 'customer.created' events and automatically
 * creates a reminder to schedule the first meeting with the customer.
 */
@Injectable()
export class CustomerCalendarHandler {
  private readonly logger = new Logger(CustomerCalendarHandler.name);

  constructor(private readonly calendarService: CalendarService) {}

  @OnEvent('customer.created')
  async handleCustomerCreated(event: DomainEvent): Promise<void> {
    this.logger.log(`Handling customer.created event for calendar [${event.id}]`);

    const customer = event.payload;

    try {
      // Schedule reminder for 2 days from now (9 AM - 10 AM)
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 2);
      reminderDate.setHours(9, 0, 0, 0);

      const endDate = new Date(reminderDate);
      endDate.setHours(10, 0, 0, 0);

      // Create calendar reminder for first meeting
      await this.calendarService.createEvent({
        tenantId: event.tenantId,
        title: `Schedule First Meeting: ${customer.name || customer.companyName}`,
        description: `Reminder to schedule initial meeting with new customer: ${customer.name || customer.companyName}. Email: ${customer.email || 'N/A'}, Phone: ${customer.phone || 'N/A'}`,
        startDate: reminderDate,
        endDate,
        type: 'reminder',
        relatedEntityType: 'customer',
        relatedEntityId: customer.id,
        userId: event.metadata.userId,
      });

      this.logger.log(
        `Created first meeting reminder for customer ${customer.name || customer.companyName}`,
      );

      // If customer has preferredMeetingTime, create a note about it
      if (customer.preferredMeetingTime) {
        this.logger.debug(
          `Customer ${customer.id} prefers meetings at: ${customer.preferredMeetingTime}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create calendar reminder for customer ${customer.id}: ${error.message}`,
      );
      // Don't throw - customer should still be created even if calendar event fails
    }
  }
}
