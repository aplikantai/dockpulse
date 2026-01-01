import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventBusService } from '../../events/event-bus.service';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';

/**
 * WebhooksService - Handles webhook operations
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Create a webhook endpoint
   */
  async createWebhookEndpoint(params: {
    tenantId: string;
    url: string;
    events: string[];
    secret?: string;
    userId?: string;
  }): Promise<any> {
    const { tenantId, url, events, secret, userId } = params;

    this.logger.debug(`Creating webhook endpoint for tenant ${tenantId}: ${url}`);

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Invalid webhook URL: ${url}`);
    }

    // Create webhook endpoint (stored in metadata for now)
    // In a real implementation, this would be stored in a dedicated webhook_endpoints table
    const webhookEndpoint = {
      id: this.generateId(),
      url,
      events,
      secret: secret || this.generateSecret(),
      enabled: true,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in tenant metadata or a dedicated table
    // For now, we'll emit an event to track this
    await this.eventBus.emitEvent({
      type: 'webhook_endpoint.created',
      tenantId,
      entityType: 'webhook_endpoint',
      entityId: webhookEndpoint.id,
      payload: webhookEndpoint,
      userId,
    });

    this.logger.log(`Created webhook endpoint ${webhookEndpoint.id} for ${url}`);

    return webhookEndpoint;
  }

  /**
   * Delete a webhook endpoint
   */
  async deleteWebhookEndpoint(params: {
    tenantId: string;
    endpointId: string;
    userId?: string;
  }): Promise<void> {
    const { tenantId, endpointId, userId } = params;

    this.logger.debug(`Deleting webhook endpoint ${endpointId}`);

    // Emit deletion event
    await this.eventBus.emitEvent({
      type: 'webhook_endpoint.deleted',
      tenantId,
      entityType: 'webhook_endpoint',
      entityId: endpointId,
      payload: { endpointId },
      userId,
    });

    this.logger.log(`Deleted webhook endpoint ${endpointId}`);
  }

  /**
   * Send webhook to an endpoint
   */
  async sendWebhook(params: {
    webhookEndpoint: any;
    event: any;
    attempt?: number;
  }): Promise<void> {
    const { webhookEndpoint, event, attempt = 1 } = params;

    const deliveryId = this.generateId();
    const maxRetries = 3;

    this.logger.debug(
      `Sending webhook to ${webhookEndpoint.url} for event ${event.type} (attempt ${attempt}/${maxRetries})`,
    );

    // Create delivery record
    const delivery: {
      id: string;
      webhookEndpointId: string;
      eventType: string;
      payload: any;
      status: 'pending' | 'success' | 'failed';
      attempts: number;
      lastAttempt: string;
      response: any;
      tenantId: string;
      createdAt: string;
      updatedAt: string;
    } = {
      id: deliveryId,
      webhookEndpointId: webhookEndpoint.id,
      eventType: event.type,
      payload: event,
      status: 'pending',
      attempts: attempt,
      lastAttempt: new Date().toISOString(),
      response: null,
      tenantId: event.tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Prepare payload
      const payload = {
        id: event.id,
        type: event.type,
        tenantId: event.tenantId,
        entityType: event.entityType,
        entityId: event.entityId,
        data: event.payload,
        timestamp: event.metadata.timestamp,
      };

      // Generate signature if secret is provided
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'DockPulse-Webhooks/1.0',
        'X-DockPulse-Event': event.type,
        'X-DockPulse-Delivery': deliveryId,
      };

      if (webhookEndpoint.secret) {
        const signature = this.generateSignature(payload, webhookEndpoint.secret);
        headers['X-DockPulse-Signature'] = signature;
      }

      // Send HTTP POST request
      const response = await axios.post(webhookEndpoint.url, payload, {
        headers,
        timeout: 5000, // 5 second timeout
        validateStatus: (status) => status >= 200 && status < 300,
      });

      // Success
      delivery.status = 'success';
      delivery.response = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      };

      this.logger.log(
        `Successfully delivered webhook to ${webhookEndpoint.url} for event ${event.type}`,
      );

      // Store delivery record (emit event for now)
      await this.eventBus.emitEvent({
        type: 'webhook_delivery.success',
        tenantId: event.tenantId,
        entityType: 'webhook_delivery',
        entityId: deliveryId,
        payload: delivery,
      });
    } catch (error) {
      // Failure
      delivery.status = 'failed';
      delivery.response = this.extractErrorResponse(error);

      this.logger.error(
        `Failed to deliver webhook to ${webhookEndpoint.url} for event ${event.type}: ${error.message}`,
      );

      // Store delivery record (emit event for now)
      await this.eventBus.emitEvent({
        type: 'webhook_delivery.failed',
        tenantId: event.tenantId,
        entityType: 'webhook_delivery',
        entityId: deliveryId,
        payload: delivery,
      });

      // Retry with exponential backoff
      if (attempt < maxRetries) {
        const retryDelay = this.calculateRetryDelay(attempt);
        this.logger.log(
          `Scheduling retry for webhook ${webhookEndpoint.url} in ${retryDelay}ms`,
        );

        setTimeout(() => {
          this.sendWebhook({
            webhookEndpoint,
            event,
            attempt: attempt + 1,
          });
        }, retryDelay);
      } else {
        this.logger.error(
          `Max retries (${maxRetries}) reached for webhook ${webhookEndpoint.url}`,
        );
      }
    }
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(params: { tenantId: string }): Promise<void> {
    const { tenantId } = params;

    this.logger.debug(`Retrying failed webhook deliveries for tenant ${tenantId}`);

    // In a real implementation, this would query failed deliveries from a database
    // and retry them with exponential backoff

    // For now, we'll just log
    this.logger.log(`Would retry failed deliveries for tenant ${tenantId}`);
  }

  /**
   * Get webhook logs for an endpoint
   */
  async getWebhookLogs(params: {
    tenantId: string;
    endpointId?: string;
    limit?: number;
  }): Promise<any[]> {
    const { tenantId, endpointId, limit = 100 } = params;

    this.logger.debug(
      `Fetching webhook logs for tenant ${tenantId}, endpoint ${endpointId}`,
    );

    // Get webhook delivery events from event log
    const events = await this.eventBus.getEventHistory({
      tenantId,
      entityType: 'webhook_delivery',
      limit,
    });

    // Filter by endpoint if specified
    const logs = events
      .filter((event) => {
        if (!endpointId) return true;
        return event.payload.webhookEndpointId === endpointId;
      })
      .map((event) => event.payload);

    this.logger.debug(`Found ${logs.length} webhook logs`);

    return logs;
  }

  /**
   * Get all webhook endpoints for a tenant
   */
  async getWebhookEndpoints(params: { tenantId: string }): Promise<any[]> {
    const { tenantId } = params;

    this.logger.debug(`Fetching webhook endpoints for tenant ${tenantId}`);

    // Get webhook endpoint creation events from event log
    const events = await this.eventBus.getEventHistory({
      tenantId,
      entityType: 'webhook_endpoint',
    });

    // Extract created endpoints (filter out deleted ones)
    const createdEvents = events.filter(
      (event) => event.type === 'webhook_endpoint.created',
    );
    const deletedEvents = events.filter(
      (event) => event.type === 'webhook_endpoint.deleted',
    );
    const deletedIds = new Set(
      deletedEvents.map((event) => event.payload.endpointId),
    );

    const endpoints = createdEvents
      .map((event) => event.payload)
      .filter((endpoint) => !deletedIds.has(endpoint.id));

    this.logger.debug(`Found ${endpoints.length} webhook endpoints`);

    return endpoints;
  }

  /**
   * Check if tenant has webhook endpoints for event type
   */
  async hasWebhookEndpoints(params: {
    tenantId: string;
    eventType: string;
  }): Promise<boolean> {
    const { tenantId, eventType } = params;

    const endpoints = await this.getWebhookEndpoints({ tenantId });

    const matchingEndpoints = endpoints.filter((endpoint) => {
      if (!endpoint.enabled) return false;

      // Check if endpoint subscribes to this event
      const events = endpoint.events as string[];
      return events.includes('*') || events.includes(eventType);
    });

    return matchingEndpoints.length > 0;
  }

  /**
   * Get webhook endpoints for event type
   */
  async getWebhookEndpointsForEvent(params: {
    tenantId: string;
    eventType: string;
  }): Promise<any[]> {
    const { tenantId, eventType } = params;

    const endpoints = await this.getWebhookEndpoints({ tenantId });

    return endpoints.filter((endpoint) => {
      if (!endpoint.enabled) return false;

      // Check if endpoint subscribes to this event
      const events = endpoint.events as string[];
      return events.includes('*') || events.includes(eventType);
    });
  }

  /**
   * Generate webhook signature (HMAC SHA-256)
   */
  private generateSignature(payload: any, secret: string): string {
    const data = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    const baseDelay = 1000; // 1 second
    return baseDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Extract error response from axios error
   */
  private extractErrorResponse(error: any): any {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        headers: axiosError.response?.headers,
        data: axiosError.response?.data,
        error: axiosError.message,
      };
    }

    return {
      error: error.message || 'Unknown error',
    };
  }

  /**
   * Generate unique ID (simple implementation)
   */
  private generateId(): string {
    return `whk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(32).toString('hex')}`;
  }
}
