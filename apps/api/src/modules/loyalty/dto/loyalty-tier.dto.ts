import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

/**
 * DTOs for Loyalty Tiers
 */

export class CreateLoyaltyTierDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  minPoints: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrdersCount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minTotalSpent?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  pointsMultiplier?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  freeShippingMinimum?: number;

  @IsBoolean()
  @IsOptional()
  prioritySupport?: boolean;

  @IsBoolean()
  @IsOptional()
  earlyAccess?: boolean;

  @IsBoolean()
  @IsOptional()
  exclusiveOffers?: boolean;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  badgeImage?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateLoyaltyTierDto extends CreateLoyaltyTierDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export interface LoyaltyTierDto {
  id: string;
  tenantId: string;
  programId: string;
  code: string;
  name: string;
  minPoints: number;
  minOrdersCount?: number;
  minTotalSpent?: number;
  discountPercent: number;
  pointsMultiplier: number;
  freeShippingMinimum?: number;
  prioritySupport: boolean;
  earlyAccess: boolean;
  exclusiveOffers: boolean;
  color?: string;
  icon?: string;
  badgeImage?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Stats
  customersCount?: number;
}

export interface TierBenefitsDto {
  discountPercent: number;
  pointsMultiplier: number;
  freeShippingMinimum?: number;
  prioritySupport: boolean;
  earlyAccess: boolean;
  exclusiveOffers: boolean;
}
