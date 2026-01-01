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
import { InvoicingService } from './services/invoicing.service';
import { PrismaModule } from '../database/prisma.module';
import { OrderInvoiceHandler } from './handlers/order-invoice.handler';
import { InvoiceEventHandler } from './handlers/invoice-event.handler';

/**
 * InvoicingModule - Invoicing & Billing management module
 *
 * This module demonstrates the plug & play architecture:
 * - Registers itself in Module Registry
 * - Extends Order and Customer entities via Data Bus
 * - Listens to order.completed events via Event Bus
 * - Registers Invoice entity via Data Bus
 */
@Module({
  imports: [PrismaModule],
  providers: [InvoicingService, OrderInvoiceHandler, InvoiceEventHandler],
  exports: [InvoicingService],
})
export class InvoicingModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // 1. Register module in Module Registry
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@invoicing',
        name: 'Invoicing & Billing',
        description: 'Manage invoices, track payments, and generate billing documents',
        version: '1.0.0',
        category: ModuleCategory.SALES,
        moduleClass: InvoicingModule,
        dependencies: ['@orders'],
        defaultEnabled: false,
        isCore: false,
        icon: 'receipt',
        requiredPlan: TenantPlan.STARTER,
        features: [
          {
            code: 'invoice_generation',
            name: 'Invoice Generation',
            description: 'Automatically generate invoices from orders',
            defaultEnabled: true,
          },
          {
            code: 'payment_tracking',
            name: 'Payment Tracking',
            description: 'Track invoice payment status',
            defaultEnabled: true,
          },
          {
            code: 'pdf_export',
            name: 'PDF Export',
            description: 'Export invoices as PDF documents',
            defaultEnabled: true,
          },
          {
            code: 'tax_calculation',
            name: 'Tax Calculation',
            description: 'Automatic tax calculation on invoices',
            defaultEnabled: false,
          },
        ],
        defaultConfig: {
          autoGenerateOnOrderComplete: true,
          defaultPaymentTerms: 'NET 30',
          taxRate: 0.0,
          invoiceNumberPrefix: 'INV-',
        },
      }),
    );

    // 2. Extend Order entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'order',
        moduleCode: '@invoicing',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'invoiceNumber',
            type: 'string',
            required: false,
            ui: {
              label: 'Invoice Number',
              placeholder: 'INV-001',
              helpText: 'Unique invoice number for this order',
              group: 'Invoicing',
              order: 1,
              widget: 'input',
            },
            addedBy: '@invoicing',
          }),
          EntityDefinitionFactory.createField({
            name: 'invoiceStatus',
            type: 'enum',
            required: false,
            validation: {
              enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
            },
            ui: {
              label: 'Invoice Status',
              helpText: 'Current status of the invoice',
              group: 'Invoicing',
              order: 2,
              widget: 'select',
            },
            addedBy: '@invoicing',
          }),
          EntityDefinitionFactory.createField({
            name: 'invoiceDate',
            type: 'datetime',
            required: false,
            ui: {
              label: 'Invoice Date',
              placeholder: 'Select invoice date',
              helpText: 'Date when the invoice was created',
              group: 'Invoicing',
              order: 3,
              widget: 'date',
            },
            addedBy: '@invoicing',
          }),
          EntityDefinitionFactory.createField({
            name: 'dueDate',
            type: 'datetime',
            required: false,
            ui: {
              label: 'Due Date',
              placeholder: 'Select due date',
              helpText: 'Payment due date',
              group: 'Invoicing',
              order: 4,
              widget: 'date',
            },
            addedBy: '@invoicing',
          }),
          EntityDefinitionFactory.createField({
            name: 'paidDate',
            type: 'datetime',
            required: false,
            ui: {
              label: 'Paid Date',
              placeholder: 'Select paid date',
              helpText: 'Date when the invoice was paid',
              group: 'Invoicing',
              order: 5,
              widget: 'date',
            },
            addedBy: '@invoicing',
          }),
        ],
        tabs: [
          {
            code: 'invoice_details',
            label: 'Invoice Details',
            dataEndpoint: '/api/invoicing/invoice',
            icon: 'receipt',
            order: 1,
            addedBy: '@invoicing',
          },
        ],
      }),
    );

    // 3. Extend Customer entity via Data Bus
    this.dataBus.extend(
      EntityExtensionFactory.create({
        targetEntity: 'customer',
        moduleCode: '@invoicing',
        fields: [
          EntityDefinitionFactory.createField({
            name: 'paymentTerms',
            type: 'string',
            required: false,
            ui: {
              label: 'Payment Terms',
              placeholder: 'e.g., NET 30, NET 15',
              helpText: 'Default payment terms for this customer',
              group: 'Billing',
              order: 1,
              widget: 'input',
            },
            addedBy: '@invoicing',
          }),
          EntityDefinitionFactory.createField({
            name: 'taxId',
            type: 'string',
            required: false,
            ui: {
              label: 'Tax ID',
              placeholder: 'e.g., VAT number, EIN',
              helpText: 'Customer tax identification number',
              group: 'Billing',
              order: 2,
              widget: 'input',
            },
            addedBy: '@invoicing',
          }),
        ],
        tabs: [
          {
            code: 'invoices',
            label: 'Invoices',
            dataEndpoint: '/api/invoicing/invoices/customer',
            icon: 'file-text',
            order: 1,
            addedBy: '@invoicing',
          },
        ],
      }),
    );

    // 4. Register Invoice entity
    this.dataBus.registerEntity(
      EntityDefinitionFactory.create({
        code: 'invoice',
        name: 'Invoice',
        description: 'Customer invoices and billing documents',
        ownerModule: '@invoicing',
        baseFields: [
          EntityDefinitionFactory.createField({
            name: 'id',
            type: 'string',
            required: true,
            ui: { label: 'ID' },
          }),
          EntityDefinitionFactory.createField({
            name: 'invoiceNumber',
            type: 'string',
            required: true,
            ui: {
              label: 'Invoice Number',
              placeholder: 'INV-001',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'orderId',
            type: 'string',
            required: true,
            ui: {
              label: 'Order ID',
              helpText: 'Related order',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'customerId',
            type: 'string',
            required: true,
            ui: {
              label: 'Customer ID',
              helpText: 'Related customer',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'amount',
            type: 'number',
            required: true,
            ui: {
              label: 'Amount',
              placeholder: '0.00',
              helpText: 'Subtotal amount before tax',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'taxAmount',
            type: 'number',
            required: true,
            ui: {
              label: 'Tax Amount',
              placeholder: '0.00',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'totalAmount',
            type: 'number',
            required: true,
            ui: {
              label: 'Total Amount',
              placeholder: '0.00',
              helpText: 'Total amount including tax',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'status',
            type: 'enum',
            required: true,
            validation: {
              enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
            },
            ui: {
              label: 'Status',
              widget: 'select',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'dueDate',
            type: 'datetime',
            required: true,
            ui: {
              label: 'Due Date',
              widget: 'date',
            },
          }),
          EntityDefinitionFactory.createField({
            name: 'paidDate',
            type: 'datetime',
            required: false,
            ui: {
              label: 'Paid Date',
              widget: 'date',
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
