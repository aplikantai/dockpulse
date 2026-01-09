import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateProductCostDto,
  UpdateProductCostDto,
  CreateCustomerPricingDto,
  UpdateCustomerPricingDto,
  CalculateMarginDto,
  CalculateSalePriceDto,
  MarginResult,
} from '../dto/product-cost.dto';

@Injectable()
export class MarginCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // PRODUCT COSTS
  // ============================================

  async findAllProductCosts(
    tenantId: string,
    options?: {
      productId?: string;
      categoryId?: string;
      supplierId?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { tenantId };

    if (options?.productId) where.productId = options.productId;
    if (options?.categoryId) where.categoryId = options.categoryId;
    if (options?.supplierId) where.supplierId = options.supplierId;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    const [costs, total] = await Promise.all([
      this.prisma.productCost.findMany({
        where,
        include: { category: true },
        orderBy: [{ productId: 'asc' }, { validFrom: 'desc' }],
        take: options?.limit || 100,
        skip: options?.offset || 0,
      }),
      this.prisma.productCost.count({ where }),
    ]);

    return { costs, total };
  }

  async findProductCost(tenantId: string, id: string) {
    const cost = await this.prisma.productCost.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });

    if (!cost) {
      throw new NotFoundException(`Product cost ${id} not found`);
    }

    return cost;
  }

  async findProductCostByProduct(
    tenantId: string,
    productId: string,
    options?: {
      categoryId?: string;
      supplierId?: string;
    },
  ) {
    const where: any = {
      tenantId,
      productId,
      isActive: true,
    };

    if (options?.categoryId) where.categoryId = options.categoryId;
    if (options?.supplierId) where.supplierId = options.supplierId;

    // Try to find specific cost
    let cost = await this.prisma.productCost.findFirst({
      where,
      orderBy: { validFrom: 'desc' },
    });

    // Fallback to default cost
    if (!cost) {
      cost = await this.prisma.productCost.findFirst({
        where: {
          tenantId,
          productId,
          isActive: true,
          isDefault: true,
        },
        orderBy: { validFrom: 'desc' },
      });
    }

    return cost;
  }

  async createProductCost(tenantId: string, dto: CreateProductCostDto) {
    // Calculate total cost
    const totalCost =
      dto.purchasePrice +
      (dto.shippingCost ?? 0) +
      (dto.handlingCost ?? 0) +
      (dto.customsCost ?? 0) +
      (dto.otherCosts ?? 0);

    // If this is default, unset other defaults for this product
    if (dto.isDefault) {
      await this.prisma.productCost.updateMany({
        where: {
          tenantId,
          productId: dto.productId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.productCost.create({
      data: {
        tenantId,
        productId: dto.productId,
        categoryId: dto.categoryId,
        purchasePrice: dto.purchasePrice,
        purchaseCurrency: dto.purchaseCurrency ?? 'PLN',
        supplierId: dto.supplierId,
        supplierName: dto.supplierName,
        supplierSku: dto.supplierSku,
        shippingCost: dto.shippingCost,
        handlingCost: dto.handlingCost,
        customsCost: dto.customsCost,
        otherCosts: dto.otherCosts,
        totalCost,
        targetMarginPercent: dto.targetMarginPercent,
        targetMarginValue: dto.targetMarginValue,
        minSalePrice: dto.minSalePrice,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async updateProductCost(tenantId: string, id: string, dto: UpdateProductCostDto) {
    const existing = await this.findProductCost(tenantId, id);

    // Recalculate total cost
    const totalCost =
      (dto.purchasePrice ?? Number(existing.purchasePrice)) +
      (dto.shippingCost ?? Number(existing.shippingCost) ?? 0) +
      (dto.handlingCost ?? Number(existing.handlingCost) ?? 0) +
      (dto.customsCost ?? Number(existing.customsCost) ?? 0) +
      (dto.otherCosts ?? Number(existing.otherCosts) ?? 0);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.productCost.updateMany({
        where: {
          tenantId,
          productId: existing.productId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.productCost.update({
      where: { id },
      data: {
        purchasePrice: dto.purchasePrice,
        purchaseCurrency: dto.purchaseCurrency,
        supplierId: dto.supplierId,
        supplierName: dto.supplierName,
        supplierSku: dto.supplierSku,
        shippingCost: dto.shippingCost,
        handlingCost: dto.handlingCost,
        customsCost: dto.customsCost,
        otherCosts: dto.otherCosts,
        totalCost,
        targetMarginPercent: dto.targetMarginPercent,
        targetMarginValue: dto.targetMarginValue,
        minSalePrice: dto.minSalePrice,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        isActive: dto.isActive,
        isDefault: dto.isDefault,
      },
    });
  }

  async deleteProductCost(tenantId: string, id: string) {
    await this.findProductCost(tenantId, id);
    return this.prisma.productCost.delete({ where: { id } });
  }

  // ============================================
  // CUSTOMER PRICING
  // ============================================

  async findCustomerPricing(tenantId: string, customerId: string) {
    return this.prisma.customerPricing.findFirst({
      where: { tenantId, customerId, isActive: true },
    });
  }

  async createCustomerPricing(tenantId: string, dto: CreateCustomerPricingDto) {
    // Delete existing pricing for this customer
    await this.prisma.customerPricing.deleteMany({
      where: { tenantId, customerId: dto.customerId },
    });

    return this.prisma.customerPricing.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        priceTableId: dto.priceTableId,
        priceCategoryCode: dto.priceCategoryCode,
        discountPercent: dto.discountPercent,
        creditLimit: dto.creditLimit,
        paymentTerms: dto.paymentTerms,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });
  }

  async updateCustomerPricing(tenantId: string, customerId: string, dto: UpdateCustomerPricingDto) {
    const existing = await this.findCustomerPricing(tenantId, customerId);

    if (!existing) {
      throw new NotFoundException(`Customer pricing for ${customerId} not found`);
    }

    return this.prisma.customerPricing.update({
      where: { id: existing.id },
      data: {
        priceTableId: dto.priceTableId,
        priceCategoryCode: dto.priceCategoryCode,
        discountPercent: dto.discountPercent,
        creditLimit: dto.creditLimit,
        creditUsed: dto.creditUsed,
        paymentTerms: dto.paymentTerms,
        isActive: dto.isActive,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
      },
    });
  }

  // ============================================
  // MARGIN CALCULATIONS
  // ============================================

  async calculateMargin(tenantId: string, dto: CalculateMarginDto): Promise<MarginResult> {
    const cost = await this.findProductCostByProduct(tenantId, dto.productId, {
      categoryId: dto.categoryId,
      supplierId: dto.supplierId,
    });

    if (!cost) {
      throw new NotFoundException(`No cost data found for product ${dto.productId}`);
    }

    const totalCost = Number(cost.totalCost) || Number(cost.purchasePrice);
    const marginValue = dto.salePrice - totalCost;
    const marginPercent = totalCost > 0 ? (marginValue / totalCost) * 100 : 0;

    const targetMarginPercent = cost.targetMarginPercent
      ? Number(cost.targetMarginPercent)
      : undefined;
    const minSalePrice = cost.minSalePrice ? Number(cost.minSalePrice) : undefined;

    return {
      productId: dto.productId,
      purchasePrice: Number(cost.purchasePrice),
      totalCost,
      salePrice: dto.salePrice,
      marginValue: Math.round(marginValue * 100) / 100,
      marginPercent: Math.round(marginPercent * 100) / 100,
      isAboveTarget: targetMarginPercent ? marginPercent >= targetMarginPercent : true,
      targetMarginPercent,
      minSalePrice,
      isBelowMinPrice: minSalePrice ? dto.salePrice < minSalePrice : false,
    };
  }

  async calculateSalePrice(
    tenantId: string,
    dto: CalculateSalePriceDto,
  ): Promise<{ productId: string; suggestedPrice: number; minPrice?: number }> {
    const cost = await this.findProductCostByProduct(tenantId, dto.productId, {
      categoryId: dto.categoryId,
      supplierId: dto.supplierId,
    });

    if (!cost) {
      throw new NotFoundException(`No cost data found for product ${dto.productId}`);
    }

    const totalCost = Number(cost.totalCost) || Number(cost.purchasePrice);
    const suggestedPrice = totalCost * (1 + dto.targetMarginPercent / 100);
    const minSalePrice = cost.minSalePrice ? Number(cost.minSalePrice) : undefined;

    return {
      productId: dto.productId,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      minPrice: minSalePrice,
    };
  }

  async calculateBulkMargins(
    tenantId: string,
    items: { productId: string; salePrice: number }[],
  ): Promise<MarginResult[]> {
    const results: MarginResult[] = [];

    for (const item of items) {
      try {
        const result = await this.calculateMargin(tenantId, {
          productId: item.productId,
          salePrice: item.salePrice,
        });
        results.push(result);
      } catch {
        // Skip products without cost data
      }
    }

    return results;
  }

  async getProductsWithLowMargin(
    tenantId: string,
    threshold: number = 10, // Default 10% margin
  ) {
    const costs = await this.prisma.productCost.findMany({
      where: {
        tenantId,
        isActive: true,
        targetMarginPercent: { not: null },
      },
    });

    // Get current prices for these products
    const productIds = costs.map((c) => c.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, name: true, sku: true },
    });

    const lowMarginProducts = [];

    for (const cost of costs) {
      const product = products.find((p) => p.id === cost.productId);
      if (!product) continue;

      const totalCost = Number(cost.totalCost) || Number(cost.purchasePrice);
      const salePrice = Number(product.price);
      const marginPercent = totalCost > 0 ? ((salePrice - totalCost) / totalCost) * 100 : 0;

      if (marginPercent < threshold) {
        lowMarginProducts.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          purchasePrice: Number(cost.purchasePrice),
          totalCost,
          currentPrice: salePrice,
          marginPercent: Math.round(marginPercent * 100) / 100,
          targetMarginPercent: cost.targetMarginPercent
            ? Number(cost.targetMarginPercent)
            : undefined,
        });
      }
    }

    return lowMarginProducts.sort((a, b) => a.marginPercent - b.marginPercent);
  }
}
