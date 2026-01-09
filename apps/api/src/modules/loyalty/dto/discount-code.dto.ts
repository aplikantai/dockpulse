import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

/**
 * DTOs for Discount Codes
 */

export enum DiscountCodeTypeDto {
  PERCENT = 'PERCENT',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  FREE_PRODUCT = 'FREE_PRODUCT',
  POINTS_BONUS = 'POINTS_BONUS',
}

export enum DiscountCodeStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  USED_UP = 'USED_UP',
}

export class CreateDiscountCodeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountCodeTypeDto)
  type: DiscountCodeTypeDto;

  @IsNumber()
  @Min(0)
  value: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxUses?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxUsesPerUser?: number;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validTo?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableProductIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableCategoryIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludedProductIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludedCategoryIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableCustomerIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableTierIds?: string[];

  @IsBoolean()
  @IsOptional()
  newCustomersOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  firstOrderOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  canCombine?: boolean;

  @IsBoolean()
  @IsOptional()
  combineWithPoints?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  campaignId?: string;

  @IsString()
  @IsOptional()
  campaignName?: string;
}

export class UpdateDiscountCodeDto extends CreateDiscountCodeDto {
  @IsEnum(DiscountCodeStatusDto)
  @IsOptional()
  status?: DiscountCodeStatusDto;
}

export interface DiscountCodeDto {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  type: DiscountCodeTypeDto;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  currentUses: number;
  validFrom: Date;
  validTo?: Date;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  excludedProductIds: string[];
  excludedCategoryIds: string[];
  applicableCustomerIds: string[];
  applicableTierIds: string[];
  newCustomersOnly: boolean;
  firstOrderOnly: boolean;
  canCombine: boolean;
  combineWithPoints: boolean;
  status: DiscountCodeStatusDto;
  isPublic: boolean;
  campaignId?: string;
  campaignName?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  // Calculated
  usesRemaining?: number;
  isExpired?: boolean;
  isUsedUp?: boolean;
}

// Validate discount code for order
export class ValidateDiscountCodeDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsNumber()
  @IsOptional()
  orderValue?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];
}

// Result of discount code validation
export interface DiscountValidationResultDto {
  isValid: boolean;
  code: string;
  type?: DiscountCodeTypeDto;
  value?: number;
  calculatedDiscount?: number;
  errors: string[];
  warnings: string[];
}

// Apply discount code to order
export class ApplyDiscountCodeDto {
  @IsString()
  code: string;

  @IsString()
  orderId: string;

  @IsString()
  customerId: string;

  @IsNumber()
  orderValue: number;
}

// Discount code usage record
export interface DiscountCodeUsageDto {
  id: string;
  tenantId: string;
  discountCodeId: string;
  code: string;
  customerId: string;
  orderId: string;
  orderNumber?: string;
  discountAmount: number;
  orderValue: number;
  usedAt: Date;
}

// Generate multiple codes
export class GenerateCodesDto {
  @IsString()
  prefix: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  count: number;

  @IsEnum(DiscountCodeTypeDto)
  type: DiscountCodeTypeDto;

  @IsNumber()
  @Min(0)
  value: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxUsesPerCode?: number;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validTo?: string;

  @IsString()
  @IsOptional()
  campaignId?: string;

  @IsString()
  @IsOptional()
  campaignName?: string;
}

// Discount codes summary
export interface DiscountCodesSummaryDto {
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
  expiredCodes: number;
  totalUses: number;
  totalDiscountGiven: number;
  topCodes: {
    code: string;
    name: string;
    uses: number;
    totalDiscount: number;
  }[];
  recentUsages: DiscountCodeUsageDto[];
}
