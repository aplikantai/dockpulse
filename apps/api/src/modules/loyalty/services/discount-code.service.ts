import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DiscountCodeType, DiscountCodeStatus } from '@prisma/client';
import {
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
  DiscountCodeDto,
  ValidateDiscountCodeDto,
  DiscountValidationResultDto,
  ApplyDiscountCodeDto,
  DiscountCodeUsageDto,
  GenerateCodesDto,
  DiscountCodesSummaryDto,
  DiscountCodeTypeDto,
  DiscountCodeStatusDto,
} from '../dto/discount-code.dto';

/**
 * DiscountCodeService - Manages discount codes
 */
@Injectable()
export class DiscountCodeService {
  private readonly logger = new Logger(DiscountCodeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create discount code
   */
  async create(tenantId: string, dto: CreateDiscountCodeDto, createdBy?: string): Promise<DiscountCodeDto> {
    // Check if code already exists
    const existing = await this.prisma.discountCode.findUnique({
      where: {
        tenantId_code: { tenantId, code: dto.code.toUpperCase() },
      },
    });

    if (existing) {
      throw new BadRequestException(`Discount code ${dto.code} already exists`);
    }

    const code = await this.prisma.discountCode.create({
      data: {
        tenantId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        type: dto.type as DiscountCodeType,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount,
        maxDiscount: dto.maxDiscount,
        maxUses: dto.maxUses,
        maxUsesPerUser: dto.maxUsesPerUser,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        applicableProductIds: dto.applicableProductIds || [],
        applicableCategoryIds: dto.applicableCategoryIds || [],
        excludedProductIds: dto.excludedProductIds || [],
        excludedCategoryIds: dto.excludedCategoryIds || [],
        applicableCustomerIds: dto.applicableCustomerIds || [],
        applicableTierIds: dto.applicableTierIds || [],
        newCustomersOnly: dto.newCustomersOnly || false,
        firstOrderOnly: dto.firstOrderOnly || false,
        canCombine: dto.canCombine || false,
        combineWithPoints: dto.combineWithPoints ?? true,
        isPublic: dto.isPublic || false,
        campaignId: dto.campaignId,
        campaignName: dto.campaignName,
        createdBy,
      },
    });

    this.logger.log(`Created discount code: ${code.code}`);

    return this.mapToDto(code);
  }

  /**
   * Update discount code
   */
  async update(tenantId: string, codeId: string, dto: UpdateDiscountCodeDto): Promise<DiscountCodeDto> {
    const existing = await this.prisma.discountCode.findFirst({
      where: { id: codeId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Discount code not found`);
    }

    const code = await this.prisma.discountCode.update({
      where: { id: codeId },
      data: {
        code: dto.code?.toUpperCase(),
        name: dto.name,
        description: dto.description,
        type: dto.type as DiscountCodeType,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount,
        maxDiscount: dto.maxDiscount,
        maxUses: dto.maxUses,
        maxUsesPerUser: dto.maxUsesPerUser,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        applicableProductIds: dto.applicableProductIds,
        applicableCategoryIds: dto.applicableCategoryIds,
        excludedProductIds: dto.excludedProductIds,
        excludedCategoryIds: dto.excludedCategoryIds,
        applicableCustomerIds: dto.applicableCustomerIds,
        applicableTierIds: dto.applicableTierIds,
        newCustomersOnly: dto.newCustomersOnly,
        firstOrderOnly: dto.firstOrderOnly,
        canCombine: dto.canCombine,
        combineWithPoints: dto.combineWithPoints,
        status: dto.status as DiscountCodeStatus,
        isPublic: dto.isPublic,
        campaignId: dto.campaignId,
        campaignName: dto.campaignName,
      },
    });

    this.logger.log(`Updated discount code: ${code.code}`);

    return this.mapToDto(code);
  }

  /**
   * Get discount code by ID
   */
  async getById(tenantId: string, codeId: string): Promise<DiscountCodeDto> {
    const code = await this.prisma.discountCode.findFirst({
      where: { id: codeId, tenantId },
    });

    if (!code) {
      throw new NotFoundException(`Discount code not found`);
    }

    return this.mapToDto(code);
  }

  /**
   * Get discount code by code string
   */
  async getByCode(tenantId: string, codeStr: string): Promise<DiscountCodeDto> {
    const code = await this.prisma.discountCode.findUnique({
      where: {
        tenantId_code: { tenantId, code: codeStr.toUpperCase() },
      },
    });

    if (!code) {
      throw new NotFoundException(`Discount code ${codeStr} not found`);
    }

    return this.mapToDto(code);
  }

  /**
   * List all discount codes for tenant
   */
  async list(
    tenantId: string,
    options?: {
      status?: DiscountCodeStatusDto;
      type?: DiscountCodeTypeDto;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ codes: DiscountCodeDto[]; total: number }> {
    const where: any = { tenantId };

    if (options?.status) {
      where.status = options.status;
    }
    if (options?.type) {
      where.type = options.type;
    }
    if (options?.search) {
      where.OR = [
        { code: { contains: options.search, mode: 'insensitive' } },
        { name: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [codes, total] = await Promise.all([
      this.prisma.discountCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.discountCode.count({ where }),
    ]);

    return {
      codes: codes.map(this.mapToDto),
      total,
    };
  }

  /**
   * Delete discount code
   */
  async delete(tenantId: string, codeId: string): Promise<void> {
    const code = await this.prisma.discountCode.findFirst({
      where: { id: codeId, tenantId },
    });

    if (!code) {
      throw new NotFoundException(`Discount code not found`);
    }

    await this.prisma.discountCode.delete({
      where: { id: codeId },
    });

    this.logger.log(`Deleted discount code: ${code.code}`);
  }

  /**
   * Validate discount code for order
   */
  async validate(tenantId: string, dto: ValidateDiscountCodeDto): Promise<DiscountValidationResultDto> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const code = await this.prisma.discountCode.findUnique({
      where: {
        tenantId_code: { tenantId, code: dto.code.toUpperCase() },
      },
    });

    if (!code) {
      return {
        isValid: false,
        code: dto.code,
        errors: ['Kod rabatowy nie istnieje'],
        warnings: [],
      };
    }

    // Check status
    if (code.status !== 'ACTIVE') {
      errors.push(`Kod rabatowy jest ${code.status === 'EXPIRED' ? 'wygasły' : 'nieaktywny'}`);
    }

    // Check validity period
    const now = new Date();
    if (code.validFrom > now) {
      errors.push(`Kod rabatowy będzie aktywny od ${code.validFrom.toLocaleDateString('pl-PL')}`);
    }
    if (code.validTo && code.validTo < now) {
      errors.push('Kod rabatowy wygasł');
    }

    // Check usage limits
    if (code.maxUses && code.currentUses >= code.maxUses) {
      errors.push('Kod rabatowy został wykorzystany maksymalną liczbę razy');
    }

    // Check per-user limit
    if (dto.customerId && code.maxUsesPerUser) {
      const userUses = await this.prisma.discountCodeUsage.count({
        where: {
          discountCodeId: code.id,
          customerId: dto.customerId,
        },
      });
      if (userUses >= code.maxUsesPerUser) {
        errors.push('Wykorzystano limit użyć kodu dla tego klienta');
      }
    }

    // Check minimum order amount
    if (dto.orderValue !== undefined && code.minOrderAmount) {
      if (dto.orderValue < code.minOrderAmount.toNumber()) {
        errors.push(`Minimalna wartość zamówienia to ${code.minOrderAmount.toNumber()} PLN`);
      }
    }

    // Check customer restrictions
    if (dto.customerId) {
      if (code.applicableCustomerIds.length > 0) {
        if (!code.applicableCustomerIds.includes(dto.customerId)) {
          errors.push('Kod rabatowy nie jest dostępny dla tego klienta');
        }
      }

      // Check new customer restriction
      if (code.newCustomersOnly) {
        const customerOrders = await this.prisma.order.count({
          where: { tenantId, customerId: dto.customerId },
        });
        if (customerOrders > 0) {
          errors.push('Kod rabatowy jest dostępny tylko dla nowych klientów');
        }
      }

      // Check first order restriction
      if (code.firstOrderOnly) {
        const customerOrders = await this.prisma.order.count({
          where: { tenantId, customerId: dto.customerId },
        });
        if (customerOrders > 0) {
          errors.push('Kod rabatowy jest dostępny tylko dla pierwszego zamówienia');
        }
      }

      // Check tier restrictions
      if (code.applicableTierIds.length > 0) {
        const loyalty = await this.prisma.customerLoyalty.findUnique({
          where: {
            tenantId_customerId: { tenantId, customerId: dto.customerId },
          },
        });
        if (!loyalty?.tierId || !code.applicableTierIds.includes(loyalty.tierId)) {
          errors.push('Kod rabatowy nie jest dostępny dla Twojego poziomu lojalnościowego');
        }
      }
    }

    // Check product/category restrictions
    if (dto.productIds && dto.productIds.length > 0) {
      if (code.applicableProductIds.length > 0) {
        const hasApplicable = dto.productIds.some(p => code.applicableProductIds.includes(p));
        if (!hasApplicable) {
          errors.push('Kod rabatowy nie dotyczy żadnego produktu w koszyku');
        }
      }
      if (code.excludedProductIds.length > 0) {
        const allExcluded = dto.productIds.every(p => code.excludedProductIds.includes(p));
        if (allExcluded) {
          errors.push('Wszystkie produkty w koszyku są wykluczone z promocji');
        }
      }
    }

    // Calculate discount
    let calculatedDiscount = 0;
    if (errors.length === 0 && dto.orderValue !== undefined) {
      switch (code.type) {
        case 'PERCENT':
          calculatedDiscount = dto.orderValue * (code.value.toNumber() / 100);
          break;
        case 'FIXED_AMOUNT':
          calculatedDiscount = code.value.toNumber();
          break;
        case 'FREE_SHIPPING':
          calculatedDiscount = 0; // Would need shipping cost info
          warnings.push('Darmowa dostawa - rabat zostanie naliczony przy wyborze dostawy');
          break;
        default:
          calculatedDiscount = code.value.toNumber();
      }

      // Apply max discount cap
      if (code.maxDiscount && calculatedDiscount > code.maxDiscount.toNumber()) {
        calculatedDiscount = code.maxDiscount.toNumber();
        warnings.push(`Rabat został ograniczony do maksymalnej wartości ${code.maxDiscount.toNumber()} PLN`);
      }
    }

    return {
      isValid: errors.length === 0,
      code: dto.code,
      type: code.type as DiscountCodeTypeDto,
      value: code.value.toNumber(),
      calculatedDiscount,
      errors,
      warnings,
    };
  }

  /**
   * Apply discount code to order
   */
  async apply(tenantId: string, dto: ApplyDiscountCodeDto): Promise<DiscountCodeUsageDto> {
    // Validate first
    const validation = await this.validate(tenantId, {
      code: dto.code,
      customerId: dto.customerId,
      orderValue: dto.orderValue,
    });

    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join('. '));
    }

    const code = await this.prisma.discountCode.findUnique({
      where: {
        tenantId_code: { tenantId, code: dto.code.toUpperCase() },
      },
    });

    if (!code) {
      throw new NotFoundException('Discount code not found');
    }

    // Record usage
    const usage = await this.prisma.discountCodeUsage.create({
      data: {
        tenantId,
        discountCodeId: code.id,
        customerId: dto.customerId,
        orderId: dto.orderId,
        discountAmount: validation.calculatedDiscount!,
        orderValue: dto.orderValue,
      },
    });

    // Update usage count
    await this.prisma.discountCode.update({
      where: { id: code.id },
      data: {
        currentUses: { increment: 1 },
        // Auto-update status if maxUses reached
        status: code.maxUses && code.currentUses + 1 >= code.maxUses ? 'USED_UP' : undefined,
      },
    });

    this.logger.log(`Applied discount code ${code.code} to order ${dto.orderId}`);

    return {
      id: usage.id,
      tenantId: usage.tenantId,
      discountCodeId: usage.discountCodeId,
      code: code.code,
      customerId: usage.customerId,
      orderId: usage.orderId,
      orderNumber: undefined,
      discountAmount: usage.discountAmount.toNumber(),
      orderValue: usage.orderValue.toNumber(),
      usedAt: usage.usedAt,
    };
  }

  /**
   * Generate multiple discount codes
   */
  async generateBulk(tenantId: string, dto: GenerateCodesDto, createdBy?: string): Promise<DiscountCodeDto[]> {
    const codes: DiscountCodeDto[] = [];

    for (let i = 0; i < dto.count; i++) {
      const suffix = this.generateRandomSuffix(8);
      const codeStr = `${dto.prefix.toUpperCase()}-${suffix}`;

      try {
        const code = await this.create(tenantId, {
          code: codeStr,
          name: `${dto.prefix} #${i + 1}`,
          type: dto.type,
          value: dto.value,
          maxUses: dto.maxUsesPerCode || 1,
          validFrom: dto.validFrom,
          validTo: dto.validTo,
          campaignId: dto.campaignId,
          campaignName: dto.campaignName,
        }, createdBy);

        codes.push(code);
      } catch (error) {
        this.logger.warn(`Failed to generate code ${codeStr}: ${error}`);
        // Continue with next code
      }
    }

    this.logger.log(`Generated ${codes.length} discount codes with prefix ${dto.prefix}`);

    return codes;
  }

  /**
   * Get discount codes summary
   */
  async getSummary(tenantId: string): Promise<DiscountCodesSummaryDto> {
    const [
      totalCodes,
      activeCodes,
      usedUpCodes,
      expiredCodes,
      totalUsages,
      totalDiscount,
      recentUsages,
    ] = await Promise.all([
      this.prisma.discountCode.count({ where: { tenantId } }),
      this.prisma.discountCode.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.discountCode.count({ where: { tenantId, status: 'USED_UP' } }),
      this.prisma.discountCode.count({ where: { tenantId, status: 'EXPIRED' } }),
      this.prisma.discountCodeUsage.count({ where: { tenantId } }),
      this.prisma.discountCodeUsage.aggregate({
        where: { tenantId },
        _sum: { discountAmount: true },
      }),
      this.prisma.discountCodeUsage.findMany({
        where: { tenantId },
        orderBy: { usedAt: 'desc' },
        take: 10,
        include: { discountCode: true },
      }),
    ]);

    // Get top codes by usage
    const topCodesRaw = await this.prisma.discountCodeUsage.groupBy({
      by: ['discountCodeId'],
      where: { tenantId },
      _count: { discountCodeId: true },
      _sum: { discountAmount: true },
      orderBy: { _count: { discountCodeId: 'desc' } },
      take: 5,
    });

    const topCodeIds = topCodesRaw.map(c => c.discountCodeId);
    const topCodesData = await this.prisma.discountCode.findMany({
      where: { id: { in: topCodeIds } },
    });
    const topCodesMap = new Map(topCodesData.map(c => [c.id, c]));

    return {
      totalCodes,
      activeCodes,
      usedCodes: usedUpCodes,
      expiredCodes,
      totalUses: totalUsages,
      totalDiscountGiven: totalDiscount._sum.discountAmount?.toNumber() || 0,
      topCodes: topCodesRaw.map(c => ({
        code: topCodesMap.get(c.discountCodeId)?.code || '',
        name: topCodesMap.get(c.discountCodeId)?.name || '',
        uses: c._count.discountCodeId,
        totalDiscount: c._sum.discountAmount?.toNumber() || 0,
      })),
      recentUsages: recentUsages.map(u => ({
        id: u.id,
        tenantId: u.tenantId,
        discountCodeId: u.discountCodeId,
        code: u.discountCode.code,
        customerId: u.customerId,
        orderId: u.orderId,
        orderNumber: u.orderNumber || undefined,
        discountAmount: u.discountAmount.toNumber(),
        orderValue: u.orderValue.toNumber(),
        usedAt: u.usedAt,
      })),
    };
  }

  /**
   * Update expired codes status
   */
  async updateExpiredStatus(tenantId: string): Promise<number> {
    const result = await this.prisma.discountCode.updateMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        validTo: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      this.logger.log(`Updated ${result.count} expired discount codes for tenant ${tenantId}`);
    }

    return result.count;
  }

  /**
   * Generate random suffix for bulk codes
   */
  private generateRandomSuffix(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Map to DTO
   */
  private mapToDto(code: any): DiscountCodeDto {
    const now = new Date();
    return {
      id: code.id,
      tenantId: code.tenantId,
      code: code.code,
      name: code.name,
      description: code.description || undefined,
      type: code.type as DiscountCodeTypeDto,
      value: code.value.toNumber(),
      minOrderAmount: code.minOrderAmount?.toNumber(),
      maxDiscount: code.maxDiscount?.toNumber(),
      maxUses: code.maxUses || undefined,
      maxUsesPerUser: code.maxUsesPerUser || undefined,
      currentUses: code.currentUses,
      validFrom: code.validFrom,
      validTo: code.validTo || undefined,
      applicableProductIds: code.applicableProductIds,
      applicableCategoryIds: code.applicableCategoryIds,
      excludedProductIds: code.excludedProductIds,
      excludedCategoryIds: code.excludedCategoryIds,
      applicableCustomerIds: code.applicableCustomerIds,
      applicableTierIds: code.applicableTierIds,
      newCustomersOnly: code.newCustomersOnly,
      firstOrderOnly: code.firstOrderOnly,
      canCombine: code.canCombine,
      combineWithPoints: code.combineWithPoints,
      status: code.status as DiscountCodeStatusDto,
      isPublic: code.isPublic,
      campaignId: code.campaignId || undefined,
      campaignName: code.campaignName || undefined,
      createdBy: code.createdBy || undefined,
      createdAt: code.createdAt,
      updatedAt: code.updatedAt,
      usesRemaining: code.maxUses ? code.maxUses - code.currentUses : undefined,
      isExpired: code.validTo ? code.validTo < now : false,
      isUsedUp: code.maxUses ? code.currentUses >= code.maxUses : false,
    };
  }
}
