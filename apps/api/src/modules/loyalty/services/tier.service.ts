import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateLoyaltyTierDto,
  UpdateLoyaltyTierDto,
  LoyaltyTierDto,
  TierBenefitsDto,
} from '../dto/loyalty-tier.dto';
import { PointsService } from './points.service';

/**
 * TierService - Manages loyalty tiers
 */
@Injectable()
export class TierService {
  private readonly logger = new Logger(TierService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  /**
   * Create loyalty tier
   */
  async create(tenantId: string, dto: CreateLoyaltyTierDto): Promise<LoyaltyTierDto> {
    const program = await this.pointsService.getOrCreateProgram(tenantId);

    // Check if code already exists
    const existing = await this.prisma.loyaltyTier.findUnique({
      where: {
        tenantId_code: { tenantId, code: dto.code.toUpperCase() },
      },
    });

    if (existing) {
      throw new BadRequestException(`Tier with code ${dto.code} already exists`);
    }

    // Get max sortOrder
    const maxSort = await this.prisma.loyaltyTier.aggregate({
      where: { tenantId },
      _max: { sortOrder: true },
    });

    const tier = await this.prisma.loyaltyTier.create({
      data: {
        tenantId,
        programId: program.id,
        code: dto.code.toUpperCase(),
        name: dto.name,
        minPoints: dto.minPoints,
        minOrdersCount: dto.minOrdersCount,
        minTotalSpent: dto.minTotalSpent,
        discountPercent: dto.discountPercent || 0,
        pointsMultiplier: dto.pointsMultiplier || 1,
        freeShippingMinimum: dto.freeShippingMinimum,
        prioritySupport: dto.prioritySupport || false,
        earlyAccess: dto.earlyAccess || false,
        exclusiveOffers: dto.exclusiveOffers || false,
        color: dto.color,
        icon: dto.icon,
        badgeImage: dto.badgeImage,
        description: dto.description,
        sortOrder: dto.sortOrder ?? (maxSort._max.sortOrder || 0) + 1,
        isActive: true,
      },
    });

    this.logger.log(`Created loyalty tier: ${tier.code}`);

    return this.mapToDto(tier);
  }

  /**
   * Update loyalty tier
   */
  async update(tenantId: string, tierId: string, dto: UpdateLoyaltyTierDto): Promise<LoyaltyTierDto> {
    const existing = await this.prisma.loyaltyTier.findFirst({
      where: { id: tierId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Tier not found');
    }

    const tier = await this.prisma.loyaltyTier.update({
      where: { id: tierId },
      data: {
        code: dto.code?.toUpperCase(),
        name: dto.name,
        minPoints: dto.minPoints,
        minOrdersCount: dto.minOrdersCount,
        minTotalSpent: dto.minTotalSpent,
        discountPercent: dto.discountPercent,
        pointsMultiplier: dto.pointsMultiplier,
        freeShippingMinimum: dto.freeShippingMinimum,
        prioritySupport: dto.prioritySupport,
        earlyAccess: dto.earlyAccess,
        exclusiveOffers: dto.exclusiveOffers,
        color: dto.color,
        icon: dto.icon,
        badgeImage: dto.badgeImage,
        description: dto.description,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });

    this.logger.log(`Updated loyalty tier: ${tier.code}`);

    return this.mapToDto(tier);
  }

  /**
   * Get tier by ID
   */
  async getById(tenantId: string, tierId: string): Promise<LoyaltyTierDto> {
    const tier = await this.prisma.loyaltyTier.findFirst({
      where: { id: tierId, tenantId },
    });

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    const customersCount = await this.prisma.customerLoyalty.count({
      where: { tierId },
    });

    return this.mapToDto(tier, customersCount);
  }

  /**
   * Get tier by code
   */
  async getByCode(tenantId: string, code: string): Promise<LoyaltyTierDto> {
    const tier = await this.prisma.loyaltyTier.findUnique({
      where: {
        tenantId_code: { tenantId, code: code.toUpperCase() },
      },
    });

    if (!tier) {
      throw new NotFoundException(`Tier ${code} not found`);
    }

    const customersCount = await this.prisma.customerLoyalty.count({
      where: { tierId: tier.id },
    });

    return this.mapToDto(tier, customersCount);
  }

  /**
   * List all tiers for tenant
   */
  async list(tenantId: string, includeInactive = false): Promise<LoyaltyTierDto[]> {
    const where: any = { tenantId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const tiers = await this.prisma.loyaltyTier.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    // Get customer counts
    const customerCounts = await this.prisma.customerLoyalty.groupBy({
      by: ['tierId'],
      where: { tenantId, tierId: { not: null } },
      _count: { tierId: true },
    });

    const countMap = new Map(customerCounts.map(c => [c.tierId!, c._count.tierId]));

    return tiers.map(t => this.mapToDto(t, countMap.get(t.id) || 0));
  }

  /**
   * Delete tier
   */
  async delete(tenantId: string, tierId: string): Promise<void> {
    const tier = await this.prisma.loyaltyTier.findFirst({
      where: { id: tierId, tenantId },
    });

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    // Check if any customers have this tier
    const customersWithTier = await this.prisma.customerLoyalty.count({
      where: { tierId },
    });

    if (customersWithTier > 0) {
      throw new BadRequestException(
        `Cannot delete tier with ${customersWithTier} customers. Deactivate it instead.`,
      );
    }

    await this.prisma.loyaltyTier.delete({
      where: { id: tierId },
    });

    this.logger.log(`Deleted loyalty tier: ${tier.code}`);
  }

  /**
   * Get tier benefits for customer
   */
  async getCustomerTierBenefits(tenantId: string, customerId: string): Promise<TierBenefitsDto | null> {
    const loyalty = await this.prisma.customerLoyalty.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId },
      },
      include: { tier: true },
    });

    if (!loyalty?.tier) {
      return null;
    }

    return {
      discountPercent: loyalty.tier.discountPercent.toNumber(),
      pointsMultiplier: loyalty.tier.pointsMultiplier.toNumber(),
      freeShippingMinimum: loyalty.tier.freeShippingMinimum?.toNumber(),
      prioritySupport: loyalty.tier.prioritySupport,
      earlyAccess: loyalty.tier.earlyAccess,
      exclusiveOffers: loyalty.tier.exclusiveOffers,
    };
  }

  /**
   * Recalculate all customer tiers
   */
  async recalculateAllTiers(tenantId: string): Promise<{ upgraded: number; downgraded: number }> {
    const customers = await this.prisma.customerLoyalty.findMany({
      where: { tenantId },
    });

    let upgraded = 0;
    let downgraded = 0;

    for (const customer of customers) {
      const oldTierId = customer.tierId;
      await this.pointsService.checkAndUpdateTier(tenantId, customer.customerId);

      const updated = await this.prisma.customerLoyalty.findUnique({
        where: { id: customer.id },
      });

      if (updated?.tierId !== oldTierId) {
        // Get tiers to compare
        const [oldTier, newTier] = await Promise.all([
          oldTierId ? this.prisma.loyaltyTier.findUnique({ where: { id: oldTierId } }) : null,
          updated?.tierId ? this.prisma.loyaltyTier.findUnique({ where: { id: updated.tierId } }) : null,
        ]);

        const oldMin = oldTier?.minPoints || 0;
        const newMin = newTier?.minPoints || 0;

        if (newMin > oldMin) {
          upgraded++;
        } else {
          downgraded++;
        }
      }
    }

    this.logger.log(`Recalculated tiers: ${upgraded} upgraded, ${downgraded} downgraded`);

    return { upgraded, downgraded };
  }

  /**
   * Reorder tiers
   */
  async reorder(tenantId: string, tierIds: string[]): Promise<void> {
    for (let i = 0; i < tierIds.length; i++) {
      await this.prisma.loyaltyTier.updateMany({
        where: { id: tierIds[i], tenantId },
        data: { sortOrder: i },
      });
    }

    this.logger.log(`Reordered ${tierIds.length} tiers`);
  }

  /**
   * Create default tiers
   */
  async createDefaultTiers(tenantId: string): Promise<LoyaltyTierDto[]> {
    const defaults = [
      {
        code: 'BRONZE',
        name: 'Brązowy',
        minPoints: 0,
        discountPercent: 0,
        pointsMultiplier: 1,
        color: '#CD7F32',
        description: 'Poziom startowy',
        sortOrder: 0,
      },
      {
        code: 'SILVER',
        name: 'Srebrny',
        minPoints: 500,
        discountPercent: 3,
        pointsMultiplier: 1.25,
        color: '#C0C0C0',
        description: 'Rabat 3% i 1.25x punktów',
        sortOrder: 1,
      },
      {
        code: 'GOLD',
        name: 'Złoty',
        minPoints: 2000,
        discountPercent: 5,
        pointsMultiplier: 1.5,
        freeShippingMinimum: 100,
        earlyAccess: true,
        color: '#FFD700',
        description: 'Rabat 5%, 1.5x punktów, darmowa dostawa od 100 PLN',
        sortOrder: 2,
      },
      {
        code: 'PLATINUM',
        name: 'Platynowy',
        minPoints: 5000,
        discountPercent: 10,
        pointsMultiplier: 2,
        freeShippingMinimum: 0,
        prioritySupport: true,
        earlyAccess: true,
        exclusiveOffers: true,
        color: '#E5E4E2',
        description: 'Rabat 10%, 2x punktów, darmowa dostawa, priorytetowa obsługa',
        sortOrder: 3,
      },
    ];

    const tiers: LoyaltyTierDto[] = [];

    for (const def of defaults) {
      try {
        const tier = await this.create(tenantId, def);
        tiers.push(tier);
      } catch (error) {
        this.logger.warn(`Failed to create default tier ${def.code}: ${error}`);
      }
    }

    return tiers;
  }

  /**
   * Map to DTO
   */
  private mapToDto(tier: any, customersCount?: number): LoyaltyTierDto {
    return {
      id: tier.id,
      tenantId: tier.tenantId,
      programId: tier.programId,
      code: tier.code,
      name: tier.name,
      minPoints: tier.minPoints,
      minOrdersCount: tier.minOrdersCount || undefined,
      minTotalSpent: tier.minTotalSpent?.toNumber(),
      discountPercent: tier.discountPercent.toNumber(),
      pointsMultiplier: tier.pointsMultiplier.toNumber(),
      freeShippingMinimum: tier.freeShippingMinimum?.toNumber(),
      prioritySupport: tier.prioritySupport,
      earlyAccess: tier.earlyAccess,
      exclusiveOffers: tier.exclusiveOffers,
      color: tier.color || undefined,
      icon: tier.icon || undefined,
      badgeImage: tier.badgeImage || undefined,
      description: tier.description || undefined,
      sortOrder: tier.sortOrder,
      isActive: tier.isActive,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
      customersCount,
    };
  }
}
