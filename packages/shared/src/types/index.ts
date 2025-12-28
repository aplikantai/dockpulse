// DockPulse Shared Types

// ===========================================
// EVENT TYPES
// ===========================================

export interface DockPulseEvent {
  event_id: string;
  event_type: string;
  source_module: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  user_id: string;
  created_at: string;
}

// ===========================================
// TENANT TYPES
// ===========================================

export type TemplateType = 'services' | 'production' | 'trade';

export type TenantStatus = 'active' | 'suspended' | 'deleted';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  template: TemplateType;
  status: TenantStatus;
  settings: TenantSettings;
  branding?: BrandingSettings;  // Auto-Branding settings
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  locale?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  logo?: string;
  primaryColor?: string;
}

// ===========================================
// USER TYPES
// ===========================================

export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

// ===========================================
// CUSTOMER TYPES
// ===========================================

export interface Customer {
  id: string;
  phone: string;
  email?: string;
  name: string;
  companyName?: string;
  nip?: string;
  address?: Address;
  tags: string[];
  isPortalActive: boolean;
}

export interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

// ===========================================
// ORDER TYPES
// ===========================================

export interface Order {
  id: string;
  number: string;
  customerId: string;
  userId?: string;
  status: string;
  items: OrderItem[];
  totalAmount?: number;
  notes?: string;
  deliveryDate?: Date;
  deliveryAddress?: Address;
  source: 'admin' | 'portal' | 'api';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

// ===========================================
// PRODUCT TYPES
// ===========================================

export interface Product {
  id: string;
  code?: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  unit: string;
  isActive: boolean;
}

// ===========================================
// QUOTE TYPES
// ===========================================

export interface Quote {
  id: string;
  number: string;
  customerId: string;
  userId?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  items: OrderItem[];
  totalAmount?: number;
  validUntil?: Date;
  notes?: string;
  createdAt: Date;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ===========================================
// AUTH TYPES
// ===========================================

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  type: 'admin' | 'portal';
  tenantSlug?: string;
  role?: UserRole;
  iat: number;
  exp: number;
}

// ===========================================
// BRANDING TYPES (Auto-Branding)
// ===========================================

export interface BrandColors {
  primary: string;    // #RRGGBB
  secondary: string;  // #RRGGBB
  accent: string;     // #RRGGBB
}

export interface BrandFonts {
  heading?: string;
  body?: string;
}

export interface BrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  companyName: string;
  colors: BrandColors;
  fonts?: BrandFonts;
  companyData?: BrandingCompanyData;
}

export interface BrandingCompanyData {
  nip?: string;
  address?: Address;
  phone?: string;
  email?: string;
}

export interface BrandingResult {
  companyData: {
    name: string;
    nip?: string;
    address?: Address;
    phone?: string;
    email?: string;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    colors: BrandColors;
  };
}

export interface ExtractBrandingRequest {
  websiteUrl: string;
  tenantSlug?: string;
}
