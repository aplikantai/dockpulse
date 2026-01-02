import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEmail,
  MinLength,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TenantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export class CreateTenantDto {
  @ApiProperty({ example: 'my-company' })
  @IsString()
  @MinLength(3)
  slug: string;

  @ApiProperty({ example: 'My Company Sp. z o.o.' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'https://mycompany.pl' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'admin@mycompany.pl' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'Jan Kowalski' })
  @IsString()
  adminName: string;

  @ApiPropertyOptional({ enum: TenantPlan, default: TenantPlan.FREE })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional({ description: 'Moduły do aktywacji', example: ['customers', 'products', 'orders'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];
}

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({ enum: TenantPlan })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];

  @ApiPropertyOptional({ description: 'Branding configuration' })
  @IsOptional()
  @IsObject()
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyName?: string;
  };
}

export class TenantBrandingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: '#2563eb' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#1e40af' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  favicon?: string;
}

export class PlatformLoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class CreatePlatformAdminDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;
}

export class RegisterTenantDto {
  @ApiProperty({ example: 'ACME Corporation' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'acme' })
  @IsString()
  @MinLength(3)
  slug: string;

  @ApiProperty({ enum: ['services', 'production', 'trade'], example: 'services' })
  @IsString()
  @IsEnum(['services', 'production', 'trade'])
  template: 'services' | 'production' | 'trade';

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiProperty({ example: 'Jan Kowalski' })
  @IsString()
  adminName: string;

  @ApiProperty({ example: 'jan@acme.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: '+48 123 456 789' })
  @IsString()
  adminPhone: string;

  // ========== BRANDING DATA (from AI extraction) ==========

  @ApiPropertyOptional({ description: 'Company logo URL', example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Company favicon URL', example: 'https://example.com/favicon.ico' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'Company slogan/tagline', example: 'Innovation at its best' })
  @IsOptional()
  @IsString()
  slogan?: string;

  @ApiPropertyOptional({ description: 'Company description', example: 'We provide top-quality services...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Brand colors', example: { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' } })
  @IsOptional()
  @IsObject()
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };

  // ========== COMPANY DATA ==========

  @ApiPropertyOptional({ description: 'NIP / Tax ID', example: '123-456-78-90' })
  @IsOptional()
  @IsString()
  nip?: string;

  @ApiPropertyOptional({ description: 'Company phone number', example: '+48 123 456 789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company email', example: 'kontakt@firma.pl' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Company address', example: { street: 'ul. Przykładowa 10', city: 'Warszawa', postalCode: '00-001' } })
  @IsOptional()
  @IsObject()
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };

  @ApiPropertyOptional({ description: 'Social media links', example: { facebook: 'https://facebook.com/company', linkedin: 'https://linkedin.com/company/name' } })
  @IsOptional()
  @IsObject()
  socialMedia?: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };

  // ========== MODULE CONFIGURATION ==========

  @ApiPropertyOptional({ description: 'Custom modules to enable (overrides template defaults)', example: ['customers', 'products', 'orders', 'quotes'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];
}

// Usage Metrics Response Types
export interface TenantUsageMetrics {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  plan: TenantPlan;
  status: TenantStatus;

  // Storage
  storageUsedMB: number;
  storageLimitMB: number;
  storageUsedPercent: number;

  // API Calls
  apiCallsToday: number;
  apiCallsThisMonth: number;
  apiCallsLimit: number;

  // Users
  totalUsers: number;
  activeUsersLast30Days: number;

  // Activity
  totalOrders: number;
  ordersThisMonth: number;
  totalCustomers: number;
  totalProducts: number;

  // Timestamps
  lastActivityAt: Date | null;
  createdAt: Date;

  // Usage alerts
  alerts: UsageAlert[];
}

export interface UsageAlert {
  type: 'storage' | 'api_calls' | 'users';
  severity: 'warning' | 'critical';
  message: string;
  currentValue: number;
  limitValue: number;
  percentage: number;
}
