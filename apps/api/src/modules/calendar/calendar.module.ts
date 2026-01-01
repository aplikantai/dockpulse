import { Module, OnModuleInit } from '@nestjs/common';
import { DataBusService } from '../data-bus/data-bus.service';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import {
  ModuleCategory,
  ModuleDefinitionFactory,
  TenantPlan,
} from '../module-registry/interfaces/module-definition.interface';
import { EntityDefinitionFactory } from '../data-bus/interfaces/entity-definition.interface';
import { EntityExtensionFactory } from '../data-bus/interfaces/entity-extension.interface';
import { CalendarService } from './services/calendar.service';
import { PrismaModule } from '../database/prisma.module';
import { OrderCalendarHandler } from './handlers/order-calendar.handler';
import { CustomerCalendarHandler } from './handlers/customer-calendar.handler';

/**
 * CalendarModule - Calendar & Events management module
 *
 * This module demonstrates the plug & play architecture:
 * - Registers itself in Module Registry
 * - Extends Customer and Order entities via Data Bus
 * - Listens to order.created and customer.created events via Event Bus
 * - Registers CalendarEvent entity via Data Bus
 */
@Module({
  imports: [PrismaModule],
  providers: [CalendarService, OrderCalendarHandler, CustomerCalendarHandler],
  exports: [CalendarService],
})
export class CalendarModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Register module in Module Registry
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@calendar',
        name: 'Calendar & Events',
        description: 'Manage calendar events, reminders, and schedule deliveries',
        version: '1.0.0',
        category: ModuleCategory.SCHEDULING,
        moduleClass: CalendarModule,
        dependencies: [],
        defaultEnabled: false,
        isCore: false,
        icon: 'calendar',
        requiredPlan: TenantPlan.STARTER,
        features: [
          {
            code: 'event_management',
            name: 'Event Management',
            description: 'Create and manage calendar events',
            defaultEnabled: true,
          },
          {
            code: 'calendar_view',
            name: 'Calendar View',
            description: 'View events in calendar format',
            defaultEnabled: true,
          },
          {
            code: 'reminders',
            name: 'Reminders',
            description: 'Set reminders for important tasks',
            defaultEnabled: true,
          },
          {
            code: 'recurring_events',
            name: 'Recurring Events',
            description: 'Create recurring calendar events',
            defaultEnabled: false,
          },
        ],
        defaultConfig: {
          autoCreateDeliveryEvents: true,
          autoCreateCustomerReminders: true,
          defaultReminderDays: 2,
          defaultDeliveryDays: 7,
        },
      }),
    );

    // 2. Extend Customer entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'customer',
        moduleCode: '@calendar',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'preferredMeetingTime',
            type: 'string',
            required: false,
            ui: {
              label: 'Preferred Meeting Time',
              placeholder: 'e.g., Monday mornings, Afternoons',
              helpText: 'Customer preference for scheduling meetings',
              group: 'Calendar',
              order: 1,
              widget: 'input',
            },
            addedBy: '@calendar',
          }),
        ],
        tabs: [
          {
            code: 'calendar_events',
            label: 'Calendar Events',
            dataEndpoint: '/api/calendar/events/customer',
            icon: 'calendar',
            order: 1,
            addedBy: '@calendar',
          },
        ],
      }),
    );

    // 3. Extend Order entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'order',
        moduleCode: '@calendar',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'scheduledDeliveryDate',
            type: 'datetime',
            required: false,
            ui: {
              label: 'Scheduled Delivery Date',
              placeholder: 'Select delivery date',
              helpText: 'When this order is scheduled for delivery',
              group: 'Delivery',
              order: 1,
              widget: 'date',
            },
            addedBy: '@calendar',
          }),
        ],
        tabs: [
          {
            code: 'delivery_schedule',
            label: 'Delivery Schedule',
            dataEndpoint: '/api/calendar/events/order',
            icon: 'truck',
            order: 1,
            addedBy: '@calendar',
          },
        ],
      }),
    );

    // 4. Register CalendarEvent entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'calendar_event',
        name: 'Calendar Event',
        description: 'Calendar events, reminders, and scheduled activities',
        ownerModule: '@calendar',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
            ui: { label: 'ID' },
          }),
          EntityDefinitionFactory.createField({
            name: 'title',
            type: 'string',
            required: true,
            ui: {
              label: 'Title',
              placeholder: 'Event title',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'description',
            type: 'string',
            required: false,
            ui: {
              label: 'Description',
              placeholder: 'Event description',
              widget: 'textarea',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'startDate',
            type: 'datetime',
            required: true,
            ui: {
              label: 'Start Date',
              widget: 'date',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'endDate',
            type: 'datetime',
            required: true,
            ui: {
              label: 'End Date',
              widget: 'date',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'type',
            type: 'enum',
            required: true,
            validation: {
              enum: ['meeting', 'delivery', 'reminder', 'task', 'other'],
            },
            ui: {
              label: 'Event Type',
              widget: 'select',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'relatedEntityType',
            type: 'string',
            required: false,
            ui: {
              label: 'Related Entity Type',
              helpText: 'Type of related entity (order, customer, etc.)',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'relatedEntityId',
            type: 'string',
            required: false,
            ui: {
              label: 'Related Entity ID',
              helpText: 'ID of the related entity',
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
        ],
      }),
    );
  }
}
