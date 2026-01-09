import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray, IsDateString, Min } from 'class-validator';
import { SurchargeType } from '@prisma/client';

// ============================================
// SURCHARGE DTOs
// ============================================

export class CreateSurchargeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(SurchargeType)
  type: SurchargeType;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  tiers?: { from: number; to: number | null; value: number }[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appliesToCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appliesToProducts?: string[];

  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  maxOrderValue?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}

export class UpdateSurchargeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SurchargeType)
  type?: SurchargeType;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  tiers?: { from: number; to: number | null; value: number }[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appliesToCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appliesToProducts?: string[];

  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  maxOrderValue?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}

// ============================================
// SURCHARGE CALCULATION DTOs
// ============================================

export class CalculateSurchargeDto {
  @IsString()
  surchargeId: string;

  @IsNumber()
  @Min(0)
  baseValue: number;

  @IsOptional()
  @IsString()
  baseUnit?: string; // m2, mb, kg, szt

  @IsOptional()
  @IsNumber()
  orderValue?: number;
}

export class CalculateSurchargesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  surchargeIds?: string[];

  @IsNumber()
  @Min(0)
  orderValue: number;

  @IsOptional()
  @IsNumber()
  totalArea?: number; // m2

  @IsOptional()
  @IsNumber()
  totalLength?: number; // mb

  @IsOptional()
  @IsNumber()
  totalWeight?: number; // kg

  @IsOptional()
  @IsNumber()
  totalQuantity?: number; // szt

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}

export interface CalculatedSurcharge {
  surchargeId: string;
  surchargeCode: string;
  surchargeName: string;
  type: SurchargeType;
  rate: number;
  baseValue?: number;
  baseUnit?: string;
  amount: number;
}
