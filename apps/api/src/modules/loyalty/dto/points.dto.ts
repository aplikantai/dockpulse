import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

/**
 * DTOs for Points and Customer Loyalty
 */

export enum PointsTransactionTypeDto {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  BONUS = 'BONUS',
  ADJUSTMENT = 'ADJUSTMENT',
  EXPIRED = 'EXPIRED',
  REFUND = 'REFUND',
}

// Enroll customer in loyalty program
export class EnrollCustomerDto {
  @IsString()
  customerId: string;
}

// Award points to customer
export class AwardPointsDto {
  @IsString()
  customerId: string;

  @IsNumber()
  @Min(1)
  points: number;

  @IsEnum(PointsTransactionTypeDto)
  @IsOptional()
  type?: PointsTransactionTypeDto;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Redeem points
export class RedeemPointsDto {
  @IsString()
  customerId: string;

  @IsNumber()
  @Min(1)
  points: number;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

// Manual adjustment
export class AdjustPointsDto {
  @IsString()
  customerId: string;

  @IsNumber()
  points: number; // Can be negative

  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Customer loyalty status
export interface CustomerLoyaltyDto {
  id: string;
  tenantId: string;
  customerId: string;
  programId: string;
  tier?: {
    id: string;
    code: string;
    name: string;
    color?: string;
    icon?: string;
    discountPercent: number;
    pointsMultiplier: number;
  };
  currentPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  expiredPoints: number;
  totalOrders: number;
  totalSpent: number;
  averageOrder: number;
  lastOrderDate?: Date;
  lastPointsDate?: Date;
  tierAchievedAt?: Date;
  tierExpiresAt?: Date;
  isActive: boolean;
  isSuspended: boolean;
  enrolledAt: Date;
  // Calculated
  pointsToNextTier?: number;
  nextTier?: {
    code: string;
    name: string;
    minPoints: number;
  };
  expiringPoints?: {
    points: number;
    expiresAt: Date;
  };
}

// Points transaction history
export interface PointsTransactionDto {
  id: string;
  tenantId: string;
  customerId: string;
  type: PointsTransactionTypeDto;
  points: number;
  pointsBefore: number;
  pointsAfter: number;
  orderId?: string;
  orderNumber?: string;
  orderValue?: number;
  discountCodeId?: string;
  description?: string;
  notes?: string;
  expiresAt?: Date;
  performedBy?: string;
  performedByName?: string;
  createdAt: Date;
}

// Points calculation for order
export interface PointsCalculationDto {
  orderValue: number;
  basePoints: number;
  tierMultiplier: number;
  bonusPoints: number;
  totalPoints: number;
  pointsValue: number; // Monetary value of points
}

// Points redemption calculation
export interface RedemptionCalculationDto {
  availablePoints: number;
  maxRedeemablePoints: number;
  maxRedeemableValue: number;
  orderValue: number;
  minRedeemPoints: number;
  canRedeem: boolean;
  reason?: string;
}

// Loyalty summary for dashboard
export interface LoyaltySummaryDto {
  totalCustomers: number;
  activeCustomers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;
  outstandingPoints: number;
  outstandingPointsValue: number;
  customersByTier: {
    tierId: string;
    tierName: string;
    tierCode: string;
    count: number;
  }[];
  recentTransactions: PointsTransactionDto[];
  topCustomers: {
    customerId: string;
    customerName: string;
    lifetimePoints: number;
    currentPoints: number;
    tierName?: string;
  }[];
}
