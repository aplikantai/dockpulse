// DockPulse Zod Schemas

import { z } from 'zod';

// ===========================================
// COMMON SCHEMAS
// ===========================================

export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
});

// ===========================================
// AUTH SCHEMAS
// ===========================================

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const PortalLoginSchema = z.object({
  phone: z.string().min(9).max(20),
  password: z.string().min(6),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

// ===========================================
// CUSTOMER SCHEMAS
// ===========================================

export const CreateCustomerSchema = z.object({
  phone: z.string().min(9).max(20),
  email: z.string().email().optional(),
  name: z.string().min(1).max(255),
  companyName: z.string().max(255).optional(),
  nip: z.string().max(20).optional(),
  regon: z.string().max(15).optional(),
  address: AddressSchema.optional(),
  deliveryAddress: AddressSchema.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  paymentTerms: z.string().max(50).optional(),
  creditLimit: z.number().positive().optional(),
  discount: z.number().min(0).max(100).optional(),
  enablePortal: z.boolean().default(true),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

// ===========================================
// ORDER SCHEMAS
// ===========================================

export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive().optional(),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(OrderItemSchema).min(1),
  notes: z.string().optional(),
  deliveryDate: z.coerce.date().optional(),
  deliveryAddress: AddressSchema.optional(),
  shippingMethod: z.string().optional(),
});

export const UpdateOrderSchema = z.object({
  notes: z.string().optional(),
  deliveryDate: z.coerce.date().optional(),
  deliveryAddress: AddressSchema.optional(),
  shippingMethod: z.string().optional(),
});

export const ChangeOrderStatusSchema = z.object({
  status: z.string(),
  note: z.string().optional(),
});

// ===========================================
// PRODUCT SCHEMAS
// ===========================================

export const CreateProductSchema = z.object({
  code: z.string().max(50).optional(),
  sku: z.string().max(50).optional(),
  ean: z.string().max(20).optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  price: z.number().positive().optional(),
  priceNet: z.number().positive().optional(),
  priceGross: z.number().positive().optional(),
  vatRate: z.number().min(0).max(100).default(23),
  unit: z.string().max(20).default('szt'),
  weight: z.number().positive().optional(),
  minOrder: z.number().positive().optional(),
  leadTime: z.number().int().positive().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ===========================================
// QUOTE SCHEMAS
// ===========================================

export const CreateQuoteSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
  validUntil: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const SendQuoteSchema = z.object({
  method: z.enum(['email', 'sms']),
  message: z.string().optional(),
});

// ===========================================
// SETTINGS SCHEMAS
// ===========================================

export const UpdateModuleSchema = z.object({
  isEnabled: z.boolean(),
});

export const UpdateFieldConfigSchema = z.object({
  isVisible: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export const UpdateTriggerSchema = z.object({
  isEnabled: z.boolean(),
});

// ===========================================
// WEBHOOK SCHEMAS
// ===========================================

export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(16),
});

// ===========================================
// TENANT SCHEMAS (Platform Admin)
// ===========================================

export const CreateTenantSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(255),
  template: z.enum(['services', 'production', 'trade']),
  planId: z.string().uuid().optional(),
  adminEmail: z.string().email(),
  adminName: z.string().min(1).max(255),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type Address = z.infer<typeof AddressSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type PortalLogin = z.infer<typeof PortalLoginSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
export type CreateQuote = z.infer<typeof CreateQuoteSchema>;
export type CreateTenant = z.infer<typeof CreateTenantSchema>;
