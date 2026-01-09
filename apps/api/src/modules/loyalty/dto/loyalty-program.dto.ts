import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

/**
 * DTOs for Loyalty Program Configuration
 */

export class CreateLoyaltyProgramDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  pointsPerPln?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  pointValue?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minRedeemPoints?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  pointsExpiryMonths?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  expiryWarningDays?: number;

  @IsBoolean()
  @IsOptional()
  earnOnDiscountedOrders?: boolean;

  @IsBoolean()
  @IsOptional()
  allowPartialRedeem?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  maxRedeemPercent?: number;

  @IsString()
  @IsOptional()
  pointsName?: string;

  @IsString()
  @IsOptional()
  pointsNamePlural?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class UpdateLoyaltyProgramDto extends CreateLoyaltyProgramDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export interface LoyaltyProgramDto {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  pointsPerPln: number;
  pointValue: number;
  minRedeemPoints: number;
  pointsExpiryMonths?: number;
  expiryWarningDays: number;
  earnOnDiscountedOrders: boolean;
  allowPartialRedeem: boolean;
  maxRedeemPercent: number;
  pointsName: string;
  pointsNamePlural: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  // Stats
  totalCustomers?: number;
  totalPointsIssued?: number;
  totalPointsRedeemed?: number;
}
