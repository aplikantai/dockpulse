import { IsString, IsEmail, IsOptional, IsUrl, IsEnum } from 'class-validator';

/**
 * Tenant plan enum
 */
export enum TenantPlanEnum {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Request to onboard a new tenant
 */
export class OnboardTenantDto {
  @IsUrl()
  websiteUrl: string;

  @IsEmail()
  adminEmail: string;

  @IsOptional()
  @IsString()
  adminName?: string;

  @IsOptional()
  @IsString()
  adminPhone?: string;

  @IsOptional()
  @IsEnum(TenantPlanEnum)
  plan?: TenantPlanEnum;

  @IsOptional()
  skipBrandExtraction?: boolean;

  @IsOptional()
  @IsString()
  subdomain?: string; // Preferred subdomain

  @IsOptional()
  @IsString()
  customSubdomain?: string; // Alias for subdomain

  @IsOptional()
  @IsString()
  companyName?: string; // Override extracted company name

  @IsOptional()
  @IsString()
  extractionId?: string; // Link to existing brand extraction
}

/**
 * Result of tenant onboarding
 */
export interface OnboardTenantResult {
  tenant: {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
  };
  branding: {
    companyName: string;
    logoUrl?: string;
    primaryColor?: string;
    description?: string;
    confidence: number;
  } | null;
  adminUser: {
    id: string;
    email: string;
    tempPassword: string;
  };
  urls: {
    portal: string;      // firma.dockpulse.com
    admin: string;       // firma.dockpulse.com/admin
    api: string;         // api.dockpulse.com/tenants/{id}
  };
  nextSteps: string[];
}

/**
 * Rebrand tenant request
 */
export class RebrandTenantDto {
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  forceRefresh?: boolean; // Force re-extraction even if cached
}

/**
 * Validate subdomain availability
 */
export class ValidateSubdomainDto {
  @IsString()
  subdomain: string;
}

export interface SubdomainValidationResult {
  subdomain: string;
  isAvailable: boolean;
  suggestion?: string; // Alternative if not available
  errors?: string[];
}
