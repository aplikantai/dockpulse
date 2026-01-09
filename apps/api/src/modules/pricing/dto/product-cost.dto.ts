import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, Min } from 'class-validator';

// ============================================
// PRODUCT COST DTOs
// ============================================

export class CreateProductCostDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsOptional()
  @IsString()
  purchaseCurrency?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  supplierSku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  handlingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customsCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherCosts?: number;

  @IsOptional()
  @IsNumber()
  targetMarginPercent?: number;

  @IsOptional()
  @IsNumber()
  targetMarginValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSalePrice?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateProductCostDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsString()
  purchaseCurrency?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  supplierSku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  handlingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customsCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherCosts?: number;

  @IsOptional()
  @IsNumber()
  targetMarginPercent?: number;

  @IsOptional()
  @IsNumber()
  targetMarginValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSalePrice?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

// ============================================
// CUSTOMER PRICING DTOs
// ============================================

export class CreateCustomerPricingDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  priceTableId?: string;

  @IsOptional()
  @IsString()
  priceCategoryCode?: string;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsNumber()
  paymentTerms?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}

export class UpdateCustomerPricingDto {
  @IsOptional()
  @IsString()
  priceTableId?: string;

  @IsOptional()
  @IsString()
  priceCategoryCode?: string;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditUsed?: number;

  @IsOptional()
  @IsNumber()
  paymentTerms?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}

// ============================================
// MARGIN CALCULATION DTOs
// ============================================

export class CalculateMarginDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}

export class CalculateSalePriceDto {
  @IsString()
  productId: string;

  @IsNumber()
  targetMarginPercent: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}

export interface MarginResult {
  productId: string;
  purchasePrice: number;
  totalCost: number;
  salePrice: number;
  marginValue: number;
  marginPercent: number;
  isAboveTarget: boolean;
  targetMarginPercent?: number;
  minSalePrice?: number;
  isBelowMinPrice: boolean;
}
