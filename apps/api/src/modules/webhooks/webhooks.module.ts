import { Module, OnModuleInit } from '@nestjs/common';
import { DataBusService } from '../data-bus/data-bus.service';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import {
  ModuleCategory,
  ModuleDefinitionFactory,
  TenantPlan,
} from '../module-registry/interfaces/module-definition.interface';
import { EntityDefinitionFactory } from '../data-bus/interfaces/entity-definition.interface';
import { WebhooksService } from './services/webhooks.service';
import { PrismaModule } from '../database/prisma.module';
import { UniversalWebhookHandler } from './handlers/universal-webhook.handler';

/**
 * WebhooksModule - Outbound webhooks and event subscriptions module
 *
 * This module demonstrates the plug & play architecture:
 * - Registers itself in Module Registry
 * - Registers webhook_endpoint and webhook_delivery entities via Data Bus
 * - Listens to ALL events (*) via Event Bus
 * - Sends HTTP POST to configured webhook endpoints
 * - Implements retry logic with exponential backoff
 */
@Module({
  imports: [PrismaModule],
  providers: [WebhooksService, UniversalWebhookHandler],
  exports: [WebhooksService],
})
export class WebhooksModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Register module in Module Registry
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@webhooks',
        name: 'Webhooks & Integrations',
        description: 'Send real-time event notifications to external services via webhooks',
        version: '1.0.0',
        category: ModuleCategory.INTEGRATION,
        moduleClass: WebhooksModule,
        dependencies: [],
        defaultEnabled: false,
        isCore: false,
        icon: 'webhook',
        requiredPlan: TenantPlan.STARTER,
        features: [
          {
            code: 'outbound_webhooks',
            name: 'Outbound Webhooks',
            description: 'Send HTTP POST requests to external endpoints when events occur',
            defaultEnabled: true,
          },
          {
            code: 'event_subscriptions',
            name: 'Event Subscriptions',
            description: 'Subscribe to specific event types for webhook delivery',
            defaultEnabled: true,
          },
          {
            code: 'retry_logic',
            name: 'Automatic Retry',
            description: 'Automatically retry failed webhook deliveries with exponential backoff',
            defaultEnabled: true,
          },
          {
            code: 'webhook_logs',
            name: 'Webhook Logs',
            description: 'Track all webhook delivery attempts and responses',
            defaultEnabled: true,
          },
        ],
        defaultConfig: {
          maxRetries: 3,
          retryDelay: 1000, // 1 second initial delay
          timeout: 5000, // 5 second timeout
          enableSignatures: true,
        },
      }),
    );

    // 2. Register webhook_endpoint entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'webhook_endpoint',
        name: 'Webhook Endpoint',
        description: 'External webhook endpoints for event notifications',
        ownerModule: '@webhooks',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
            ui: { label: 'ID' },
          }),
          EntityDefinitionFactory.createField({
            name: 'url',
            type: 'string',
            required: true,
            ui: {
              label: 'Webhook URL',
              placeholder: 'https://api.example.com/webhooks/dockpulse',
              helpText: 'External URL to receive webhook POST requests',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'events',
            type: 'json',
            required: true,
            ui: {
              label: 'Subscribed Events',
              placeholder: '["order.created", "invoice.paid"]',
              helpText: 'Array of event types to subscribe to (use ["*"] for all events)',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'secret',
            type: 'string',
            required: false,
            ui: {
              label: 'Webhook Secret',
              placeholder: 'whsec_...',
              helpText: 'Secret key for signing webhook payloads (HMAC SHA-256)',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'enabled',
            type: 'boolean',
            required: true,
            ui: {
              label: 'Enabled',
              helpText: 'Enable or disable this webhook endpoint',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'tenantId',
            type: 'string',
            required: true,
            ui: { label: 'Tenant ID' },
          }),
          EntityDefinitionFactory.createField({
            name: 'createdAt',
            type: 'datetime',
            required: true,
            ui: { label: 'Created At' },
          }),
          EntityDefinitionFactory.createField({
            name: 'updatedAt',
            type: 'datetime',
            required: true,
            ui: { label: 'Updated At' },
          }),
        ],
      }),
    );

    // 3. Register webhook_delivery entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'webhook_delivery',
        name: 'Webhook Delivery',
        description: 'Webhook delivery attempts and logs',
        ownerModule: '@webhooks',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
            ui: { label: 'ID' },
          }),
          EntityDefinitionFactory.createField({
            name: 'webhookEndpointId',
            type: 'string',
            required: true,
            ui: {
              label: 'Webhook Endpoint ID',
              helpText: 'Related webhook endpoint',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'eventType',
            type: 'string',
            required: true,
            ui: {
              label: 'Event Type',
              placeholder: 'order.created',
              helpText: 'Type of event that triggered this delivery',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'payload',
            type: 'json',
            required: true,
            ui: {
              label: 'Payload',
              helpText: 'Event payload sent to webhook endpoint',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            required: true,
            validation: {
              enum: ['pending', 'success', 'failed'],
            },
            ui: {
              label: 'Status',
              widget: 'select',
              helpText: 'Delivery status',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'attempts',
            type: 'number',
            required: true,
            ui: {
              label: 'Attempts',
              placeholder: '0',
              helpText: 'Number of delivery attempts',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'lastAttempt',
            type: 'datetime',
            required: false,
            ui: {
              label: 'Last Attempt',
              widget: 'date',
              helpText: 'Timestamp of last delivery attempt',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'response',
            type: 'json',
            required: false,
            ui: {
              label: 'Response',
              helpText: 'Response from webhook endpoint',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'tenantId',
            type: 'string',
            required: true,
            ui: { label: 'Tenant ID' },
          }),
          EntityDefinitionFactory.createField({
            name: 'createdAt',
            type: 'datetime',
            required: true,
            ui: { label: 'Created At' },
          }),
          EntityDefinitionFactory.createField({
            name: 'updatedAt',
            type: 'datetime',
            required: true,
            ui: { label: 'Updated At' },
          }),
        ],
      }),
    );
  }
}
