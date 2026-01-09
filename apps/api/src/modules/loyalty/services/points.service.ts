import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PointsTransactionType } from '@prisma/client';
import {
  AwardPointsDto,
  RedeemPointsDto,
  AdjustPointsDto,
  CustomerLoyaltyDto,
  PointsTransactionDto,
  PointsCalculationDto,
  RedemptionCalculationDto,
  LoyaltySummaryDto,
  PointsTransactionTypeDto,
} from '../dto/points.dto';

/**
 * PointsService - Manages customer points and loyalty status
 */
@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create loyalty program for tenant
   */
  async getOrCreateProgram(tenantId: string) {
    let program = await this.prisma.loyaltyProgram.findUnique({
      where: { tenantId },
    });

    if (!program) {
      program = await this.prisma.loyaltyProgram.create({
        data: {
          tenantId,
          name: 'Program Lojalnościowy',
          isActive: true,
        },
      });
      this.logger.log(`Created loyalty program for tenant ${tenantId}`);
    }

    return program;
  }

  /**
   * Enroll customer in loyalty program
   */
  async enrollCustomer(tenantId: string, customerId: string): Promise<CustomerLoyaltyDto> {
    const program = await this.getOrCreateProgram(tenantId);

    // Check if already enrolled
    const existing = await this.prisma.customerLoyalty.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId },
      },
    });

    if (existing) {
      return this.getCustomerLoyalty(tenantId, customerId);
    }

    // Enroll
    await this.prisma.customerLoyalty.create({
      data: {
        tenantId,
        customerId,
        programId: program.id,
        isActive: true,
      },
    });

    this.logger.log(`Enrolled customer ${customerId} in loyalty program`);

    return this.getCustomerLoyalty(tenantId, customerId);
  }

  /**
   * Get customer loyalty status
   */
  async getCustomerLoyalty(tenantId: string, customerId: string): Promise<CustomerLoyaltyDto> {
    const loyalty = await this.prisma.customerLoyalty.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId },
      },
      include: {
        tier: true,
        program: {
          include: {
            tiers: {
              where: { isActive: true },
              orderBy: { minPoints: 'asc' },
            },
          },
        },
      },
    });

    if (!loyalty) {
      throw new NotFoundException(`Customer ${customerId} not enrolled in loyalty program`);
    }

    // Calculate next tier
    let nextTier = null;
    let pointsToNextTier = null;
    if (loyalty.program.tiers.length > 0) {
      const currentTierIndex = loyalty.tier
        ? loyalty.program.tiers.findIndex(t => t.id === loyalty.tierId)
        : -1;

      if (currentTierIndex < loyalty.program.tiers.length - 1) {
        nextTier = loyalty.program.tiers[currentTierIndex + 1];
        pointsToNextTier = nextTier.minPoints - loyalty.lifetimePoints;
      }
    }

    // Check expiring points
    let expiringPoints = null;
    if (loyalty.program.pointsExpiryMonths) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + loyalty.program.expiryWarningDays);

      const expiring = await this.prisma.pointsTransaction.aggregate({
        where: {
          loyaltyId: loyalty.id,
          type: 'EARNED',
          expiresAt: {
            lte: expiryDate,
            gte: new Date(),
          },
        },
        _sum: { points: true },
      });

      if (expiring._sum.points && expiring._sum.points > 0) {
        expiringPoints = {
          points: expiring._sum.points,
          expiresAt: expiryDate,
        };
      }
    }

    return {
      id: loyalty.id,
      tenantId: loyalty.tenantId,
      customerId: loyalty.customerId,
      programId: loyalty.programId,
      tier: loyalty.tier ? {
        id: loyalty.tier.id,
        code: loyalty.tier.code,
        name: loyalty.tier.name,
        color: loyalty.tier.color || undefined,
        icon: loyalty.tier.icon || undefined,
        discountPercent: loyalty.tier.discountPercent.toNumber(),
        pointsMultiplier: loyalty.tier.pointsMultiplier.toNumber(),
      } : undefined,
      currentPoints: loyalty.currentPoints,
      lifetimePoints: loyalty.lifetimePoints,
      redeemedPoints: loyalty.redeemedPoints,
      expiredPoints: loyalty.expiredPoints,
      totalOrders: loyalty.totalOrders,
      totalSpent: loyalty.totalSpent.toNumber(),
      averageOrder: loyalty.averageOrder.toNumber(),
      lastOrderDate: loyalty.lastOrderDate || undefined,
      lastPointsDate: loyalty.lastPointsDate || undefined,
      tierAchievedAt: loyalty.tierAchievedAt || undefined,
      tierExpiresAt: loyalty.tierExpiresAt || undefined,
      isActive: loyalty.isActive,
      isSuspended: loyalty.isSuspended,
      enrolledAt: loyalty.enrolledAt,
      pointsToNextTier: pointsToNextTier && pointsToNextTier > 0 ? pointsToNextTier : undefined,
      nextTier: nextTier ? {
        code: nextTier.code,
        name: nextTier.name,
        minPoints: nextTier.minPoints,
      } : undefined,
      expiringPoints: expiringPoints || undefined,
    };
  }

  /**
   * Award points to customer
   */
  async awardPoints(tenantId: string, dto: AwardPointsDto, performedBy?: string): Promise<PointsTransactionDto> {
    const program = await this.getOrCreateProgram(tenantId);

    // Get or create customer loyalty
    let loyalty = await this.prisma.customerLoyalty.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId: dto.customerId },
      },
      include: { tier: true },
    });

    if (!loyalty) {
      // Auto-enroll
      await this.enrollCustomer(tenantId, dto.customerId);
      loyalty = await this.prisma.customerLoyalty.findUnique({
        where: {
          tenantId_customerId: { tenantId, customerId: dto.customerId },
        },
        include: { tier: true },
      });
    }

    if (!loyalty) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    if (loyalty.isSuspended) {
      throw new BadRequestException('Customer is suspended from loyalty program');
    }

    // Calculate points with tier multiplier
    let finalPoints = dto.points;
    if (loyalty.tier && dto.type !== PointsTransactionTypeDto.BONUS) {
      finalPoints = Math.floor(dto.points * loyalty.tier.pointsMultiplier.toNumber());
    }

    // Calculate expiry date
    let expiresAt = null;
    if (program.pointsExpiryMonths) {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + program.pointsExpiryMonths);
    }

    const pointsBefore = loyalty.currentPoints;
    const pointsAfter = pointsBefore + finalPoints;

    // Create transaction and update loyalty
    const [transaction] = await this.prisma.$transaction([
      this.prisma.pointsTransaction.create({
        data: {
          tenantId,
          programId: program.id,
          loyaltyId: loyalty.id,
          customerId: dto.customerId,
          type: (dto.type || PointsTransactionTypeDto.EARNED) as PointsTransactionType,
          points: finalPoints,
          pointsBefore,
          pointsAfter,
          orderId: dto.orderId,
          description: dto.description,
          notes: dto.notes,
          expiresAt,
          performedBy,
        },
      }),
      this.prisma.customerLoyalty.update({
        where: { id: loyalty.id },
        data: {
          currentPoints: pointsAfter,
          lifetimePoints: loyalty.lifetimePoints + finalPoints,
          lastPointsDate: new Date(),
        },
      }),
    ]);

    this.logger.log(`Awarded ${finalPoints} points to customer ${dto.customerId}`);

    // Check for tier upgrade
    await this.checkAndUpdateTier(tenantId, dto.customerId);

    return this.mapTransaction(transaction);
  }

  /**
   * Redeem points
   */
  async redeemPoints(tenantId: string, dto: RedeemPointsDto, performedBy?: string): Promise<PointsTransactionDto> {
    const program = await this.getOrCreateProgram(tenantId);

    const loyalty = await this.prisma.customerLoyalty.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId: dto.customerId },
      },
    });

    if (!loyalty) {
      throw new NotFoundException(`Customer ${dto.customerId} not enrolled in loyalty program`);
    }

    if (loyalty.isSuspended) {
      throw new BadRequestException('Customer is suspended from loyalty program');
    }

    if (dto.points < program.minRedeemPoints) {
      throw new BadRequestException(`Minimum ${program.minRedeemPoints} points required for redemption`);
    }

    if (dto.points > loyalty.currentPoints) {
      throw new BadRequestException(`Insufficient points. Available: ${loyalty.currentPoints}`);
    }

    const pointsBefore = loyalty.currentPoints;
    const pointsAfter = pointsBefore - dto.points;

    const [transaction] = await this.prisma.$transaction([
      this.prisma.pointsTransaction.create({
        data: {
          tenantId,
          programId: program.id,
          loyaltyId: loyalty.id,
          customerId: dto.customerId,
          type: 'REDEEMED',
          points: -dto.points,
          pointsBefore,
          pointsAfter,
          orderId: dto.orderId,
          description: dto.description || 'Points redeemed',
          performedBy,
        },
      }),
      this.prisma.customerLoyalty.update({
        where: { id: loyalty.id },
        data: {
          currentPoints: pointsAfter,
          redeemedPoints: loyalty.redeemedPoints + dto.points,
        },
      }),
    ]);

    this.logger.log(`Redeemed ${dto.points} points for customer ${dto.customerId}`);

    return this.mapTransaction(transaction);
  }

  /**
   * Adjust points (manual correction)
   */
  async adjustPoints(tenantId: string, dto: AdjustPointsDto, performedBy?: string, performedByName?: string): Promise<PointsTransactionDto> {
    const program = await this.getOrCreateProgram(tenantId);

    const loyalty = await this.prisma.customerLoyalty.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId: dto.customerId },
      },
    });

    if (!loyalty) {
      throw new NotFoundException(`Customer ${dto.customerId} not enrolled in loyalty program`);
    }

    const pointsBefore = loyalty.currentPoints;
    const pointsAfter = pointsBefore + dto.points;

    if (pointsAfter < 0) {
      throw new BadRequestException('Adjustment would result in negative points');
    }

    const [transaction] = await this.prisma.$transaction([
      this.prisma.pointsTransaction.create({
        data: {
          tenantId,
          programId: program.id,
          loyaltyId: loyalty.id,
          customerId: dto.customerId,
          type: 'ADJUSTMENT',
          points: dto.points,
          pointsBefore,
          pointsAfter,
          description: dto.reason,
          notes: dto.notes,
          performedBy,
          performedByName,
        },
      }),
      this.prisma.customerLoyalty.update({
        where: { id: loyalty.id },
        data: {
          currentPoints: pointsAfter,
          lifetimePoints: dto.points > 0
            ? loyalty.lifetimePoints + dto.points
            : loyalty.lifetimePoints,
        },
      }),
    ]);

    this.logger.log(`Adjusted ${dto.points} points for customer ${dto.customerId}. Reason: ${dto.reason}`);

    return this.mapTransaction(transaction);
  }

  /**
   * Calculate points for an order
   */
  async calculatePointsForOrder(
    tenantId: string,
    customerId: string,
    orderValue: number,
  ): Promise<PointsCalculationDto> {
    const program = await this.getOrCreateProgram(tenantId);

    const loyalty = await this.prisma.customerLoyalty.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId },
      },
      include: { tier: true },
    });

    const basePoints = Math.floor(orderValue * program.pointsPerPln.toNumber());
    const tierMultiplier = loyalty?.tier?.pointsMultiplier.toNumber() || 1;
    const bonusPoints = 0; // Can add special promotions here
    const totalPoints = Math.floor(basePoints * tierMultiplier) + bonusPoints;
    const pointsValue = totalPoints * program.pointValue.toNumber();

    return {
      orderValue,
      basePoints,
      tierMultiplier,
      bonusPoints,
      totalPoints,
      pointsValue,
    };
  }

  /**
   * Calculate redemption for an order
   */
  async calculateRedemption(
    tenantId: string,
    customerId: string,
    orderValue: number,
  ): Promise<RedemptionCalculationDto> {
    const program = await this.getOrCreateProgram(tenantId);

    const loyalty = await this.prisma.customerLoyalty.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId },
      },
    });

    const availablePoints = loyalty?.currentPoints || 0;
    const maxRedeemPercent = program.maxRedeemPercent.toNumber();
    const maxRedeemableValue = orderValue * (maxRedeemPercent / 100);
    const maxRedeemablePoints = Math.floor(maxRedeemableValue / program.pointValue.toNumber());
    const actualMaxRedeemable = Math.min(availablePoints, maxRedeemablePoints);

    let canRedeem = true;
    let reason = undefined;

    if (!loyalty) {
      canRedeem = false;
      reason = 'Customer not enrolled in loyalty program';
    } else if (availablePoints < program.minRedeemPoints) {
      canRedeem = false;
      reason = `Minimum ${program.minRedeemPoints} points required`;
    } else if (!program.allowPartialRedeem && availablePoints < maxRedeemablePoints) {
      canRedeem = false;
      reason = 'Partial redemption not allowed';
    }

    return {
      availablePoints,
      maxRedeemablePoints: actualMaxRedeemable,
      maxRedeemableValue: actualMaxRedeemable * program.pointValue.toNumber(),
      orderValue,
      minRedeemPoints: program.minRedeemPoints,
      canRedeem,
      reason,
    };
  }

  /**
   * Get transaction history for customer
   */
  async getCustomerTransactions(
    tenantId: string,
    customerId: string,
    limit = 50,
    offset = 0,
  ): Promise<PointsTransactionDto[]> {
    const transactions = await this.prisma.pointsTransaction.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return transactions.map(this.mapTransaction);
  }

  /**
   * Check and update customer tier
   */
  async checkAndUpdateTier(tenantId: string, customerId: string): Promise<void> {
    const loyalty = await this.prisma.customerLoyalty.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId },
      },
      include: {
        program: {
          include: {
            tiers: {
              where: { isActive: true },
              orderBy: { minPoints: 'desc' },
            },
          },
        },
      },
    });

    if (!loyalty) return;

    // Find highest qualifying tier
    const qualifyingTier = loyalty.program.tiers.find(tier => {
      const meetsPoints = loyalty.lifetimePoints >= tier.minPoints;
      const meetsOrders = !tier.minOrdersCount || loyalty.totalOrders >= tier.minOrdersCount;
      const meetsSpent = !tier.minTotalSpent || loyalty.totalSpent.toNumber() >= tier.minTotalSpent.toNumber();
      return meetsPoints && meetsOrders && meetsSpent;
    });

    const newTierId = qualifyingTier?.id || null;

    if (newTierId !== loyalty.tierId) {
      await this.prisma.customerLoyalty.update({
        where: { id: loyalty.id },
        data: {
          tierId: newTierId,
          tierAchievedAt: newTierId ? new Date() : null,
        },
      });

      if (newTierId) {
        this.logger.log(`Customer ${customerId} upgraded to tier ${qualifyingTier?.code}`);
      }
    }
  }

  /**
   * Get loyalty summary for dashboard
   */
  async getLoyaltySummary(tenantId: string): Promise<LoyaltySummaryDto> {
    const program = await this.getOrCreateProgram(tenantId);

    const [
      totalCustomers,
      activeCustomers,
      pointsStats,
      customersByTier,
      recentTransactions,
      topCustomers,
    ] = await Promise.all([
      this.prisma.customerLoyalty.count({ where: { tenantId } }),
      this.prisma.customerLoyalty.count({ where: { tenantId, isActive: true } }),
      this.prisma.pointsTransaction.groupBy({
        by: ['type'],
        where: { tenantId },
        _sum: { points: true },
      }),
      this.prisma.customerLoyalty.groupBy({
        by: ['tierId'],
        where: { tenantId, tierId: { not: null } },
        _count: { tierId: true },
      }),
      this.prisma.pointsTransaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.customerLoyalty.findMany({
        where: { tenantId },
        orderBy: { lifetimePoints: 'desc' },
        take: 10,
        include: { tier: true },
      }),
    ]);

    // Get tier details
    const tiers = await this.prisma.loyaltyTier.findMany({
      where: { tenantId },
    });
    const tierMap = new Map(tiers.map(t => [t.id, t]));

    // Calculate stats
    let totalPointsIssued = 0;
    let totalPointsRedeemed = 0;
    let totalPointsExpired = 0;

    pointsStats.forEach(stat => {
      const sum = stat._sum.points || 0;
      if (stat.type === 'EARNED' || stat.type === 'BONUS' || (stat.type === 'ADJUSTMENT' && sum > 0)) {
        totalPointsIssued += Math.abs(sum);
      } else if (stat.type === 'REDEEMED') {
        totalPointsRedeemed += Math.abs(sum);
      } else if (stat.type === 'EXPIRED') {
        totalPointsExpired += Math.abs(sum);
      }
    });

    const outstandingPoints = totalPointsIssued - totalPointsRedeemed - totalPointsExpired;

    return {
      totalCustomers,
      activeCustomers,
      totalPointsIssued,
      totalPointsRedeemed,
      totalPointsExpired,
      outstandingPoints,
      outstandingPointsValue: outstandingPoints * program.pointValue.toNumber(),
      customersByTier: customersByTier.map(cbt => {
        const tier = tierMap.get(cbt.tierId!);
        return {
          tierId: cbt.tierId!,
          tierName: tier?.name || 'Unknown',
          tierCode: tier?.code || 'UNKNOWN',
          count: cbt._count.tierId,
        };
      }),
      recentTransactions: recentTransactions.map(this.mapTransaction),
      topCustomers: topCustomers.map(c => ({
        customerId: c.customerId,
        customerName: c.customerId, // Would need to join with Customer table
        lifetimePoints: c.lifetimePoints,
        currentPoints: c.currentPoints,
        tierName: c.tier?.name,
      })),
    };
  }

  /**
   * Process expired points
   */
  async processExpiredPoints(tenantId: string): Promise<number> {
    const program = await this.getOrCreateProgram(tenantId);

    if (!program.pointsExpiryMonths) {
      return 0;
    }

    const now = new Date();

    // Find expired transactions
    const expiredTransactions = await this.prisma.pointsTransaction.findMany({
      where: {
        tenantId,
        type: 'EARNED',
        expiresAt: { lt: now },
        // Only transactions that haven't been processed
      },
      include: { loyalty: true },
    });

    let totalExpired = 0;

    for (const transaction of expiredTransactions) {
      // This is simplified - in production, you'd need to track which points have been used
      // and only expire unused ones
      totalExpired += transaction.points;
    }

    this.logger.log(`Processed ${totalExpired} expired points for tenant ${tenantId}`);

    return totalExpired;
  }

  /**
   * Map transaction to DTO
   */
  private mapTransaction(transaction: any): PointsTransactionDto {
    return {
      id: transaction.id,
      tenantId: transaction.tenantId,
      customerId: transaction.customerId,
      type: transaction.type as PointsTransactionTypeDto,
      points: transaction.points,
      pointsBefore: transaction.pointsBefore,
      pointsAfter: transaction.pointsAfter,
      orderId: transaction.orderId || undefined,
      orderNumber: transaction.orderNumber || undefined,
      orderValue: transaction.orderValue?.toNumber() || undefined,
      discountCodeId: transaction.discountCodeId || undefined,
      description: transaction.description || undefined,
      notes: transaction.notes || undefined,
      expiresAt: transaction.expiresAt || undefined,
      performedBy: transaction.performedBy || undefined,
      performedByName: transaction.performedByName || undefined,
      createdAt: transaction.createdAt,
    };
  }
}
