import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '../../events/interfaces/domain-event.interface';
import { WebhooksService } from '../services/webhooks.service';

/**
 * UniversalWebhookHandler - Listens to ALL events and sends webhooks
 *
 * This handler listens to the wildcard event pattern ('**') which matches all events.
 * It checks if the tenant has any webhook endpoints configured for the event type,
 * and sends HTTP POST requests to all matching endpoints.
 *
 * Features:
 * - Listens to all domain events
 * - Checks for matching webhook subscriptions
 * - Sends webhooks asynchronously (doesn't block event processing)
 * - Implements retry logic with exponential backoff
 * - Logs all delivery attempts
 */
@Injectable()
export class UniversalWebhookHandler {
  private readonly logger = new Logger(UniversalWebhookHandler.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Handle all events using the wildcard pattern
   * The '**' pattern matches all events in NestJS EventEmitter2
   */
  @OnEvent('**')
  async handleAllEvents(event: DomainEvent): Promise<void> {
    // Skip webhook-related events to avoid infinite loops
    if (
      event.type.startsWith('webhook_endpoint.') ||
      event.type.startsWith('webhook_delivery.')
    ) {
      return;
    }

    this.logger.debug(
      `Universal webhook handler received event: ${event.type} [${event.id}]`,
    );

    try {
      // Check if tenant has webhook endpoints for this event type
      const hasWebhooks = await this.webhooksService.hasWebhookEndpoints({
        tenantId: event.tenantId,
        eventType: event.type,
      });

      if (!hasWebhooks) {
        this.logger.debug(
          `No webhook endpoints configured for event ${event.type} in tenant ${event.tenantId}`,
        );
        return;
      }

      // Get all matching webhook endpoints
      const endpoints = await this.webhooksService.getWebhookEndpointsForEvent({
        tenantId: event.tenantId,
        eventType: event.type,
      });

      this.logger.log(
        `Found ${endpoints.length} webhook endpoint(s) for event ${event.type}`,
      );

      // Send webhooks to all matching endpoints (asynchronously)
      for (const endpoint of endpoints) {
        // Don't await - send webhooks in the background
        this.webhooksService
          .sendWebhook({
            webhookEndpoint: endpoint,
            event,
          })
          .catch((error) => {
            this.logger.error(
              `Error sending webhook to ${endpoint.url}: ${error.message}`,
            );
          });
      }
    } catch (error) {
      this.logger.error(
        `Failed to process webhook for event ${event.type}: ${error.message}`,
      );
      // Don't throw - webhook failures shouldn't block event processing
    }
  }
}
