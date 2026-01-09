import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PriceTableType } from '@prisma/client';

// ============================================
// PRICE CATEGORY DTOs
// ============================================

export class CreatePriceCategoryDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  defaultDiscountPercent?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdatePriceCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  defaultDiscountPercent?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// ============================================
// PRICE TABLE DTOs
// ============================================

export class CreatePriceTableDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsEnum(PriceTableType)
  priceType?: PriceTableType;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePriceTableDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsEnum(PriceTableType)
  priceType?: PriceTableType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

// ============================================
// PRICE TABLE ENTRY DTOs
// ============================================

export class CreatePriceTableEntryDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  productSku?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsNumber()
  @Min(0)
  priceNet: number;

  @IsNumber()
  @Min(0)
  priceGross: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsNumber()
  promoPrice?: number;

  @IsOptional()
  @IsDateString()
  promoValidFrom?: string;

  @IsOptional()
  @IsDateString()
  promoValidTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  maxQuantity?: number;
}

export class UpdatePriceTableEntryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceNet?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceGross?: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsNumber()
  promoPrice?: number;

  @IsOptional()
  @IsDateString()
  promoValidFrom?: string;

  @IsOptional()
  @IsDateString()
  promoValidTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  maxQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkCreatePriceTableEntriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceTableEntryDto)
  entries: CreatePriceTableEntryDto[];
}

// ============================================
// PRICE RESOLVER DTOs
// ============================================

export class GetPriceDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  priceTableId?: string;
}

export class GetPricesDto {
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export interface ResolvedPrice {
  productId: string;
  priceNet: number;
  priceGross: number;
  vatRate: number;
  currency: string;
  priceTableId?: string;
  priceTableCode?: string;
  isPromo: boolean;
  discountPercent?: number;
  originalPriceNet?: number;
  originalPriceGross?: number;
}
