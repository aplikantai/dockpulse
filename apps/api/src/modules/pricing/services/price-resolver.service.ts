import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GetPriceDto, GetPricesDto, ResolvedPrice } from '../dto/price-table.dto';

@Injectable()
export class PriceResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the best price for a product based on:
   * 1. Customer-specific price table
   * 2. Customer category price table
   * 3. Active promotions
   * 4. Default price table
   * 5. Product base price (fallback)
   */
  async resolvePrice(tenantId: string, dto: GetPriceDto): Promise<ResolvedPrice> {
    const date = dto.date ? new Date(dto.date) : new Date();
    const quantity = dto.quantity ?? 1;

    // 1. Get customer pricing if customerId provided
    let customerPricing = null;
    let customerPriceTableId: string | null = null;
    let customerDiscount: number | null = null;

    if (dto.customerId) {
      customerPricing = await this.prisma.customerPricing.findFirst({
        where: {
          tenantId,
          customerId: dto.customerId,
          isActive: true,
          validFrom: { lte: date },
          OR: [{ validTo: null }, { validTo: { gte: date } }],
        },
      });

      if (customerPricing) {
        customerPriceTableId = customerPricing.priceTableId;
        customerDiscount = customerPricing.discountPercent
          ? Number(customerPricing.discountPercent)
          : null;
      }
    }

    // 2. Determine which price table to use
    const priceTableId = dto.priceTableId || customerPriceTableId;

    // 3. Try to find price in specific price table
    if (priceTableId) {
      const entry = await this.findPriceEntry(priceTableId, dto.productId, quantity, date);
      if (entry) {
        return this.buildResolvedPrice(entry, customerDiscount);
      }
    }

    // 4. Try default price table
    const defaultTable = await this.prisma.priceTable.findFirst({
      where: {
        tenantId,
        isDefault: true,
        isActive: true,
        validFrom: { lte: date },
        OR: [{ validTo: null }, { validTo: { gte: date } }],
      },
    });

    if (defaultTable) {
      const entry = await this.findPriceEntry(defaultTable.id, dto.productId, quantity, date);
      if (entry) {
        return this.buildResolvedPrice(entry, customerDiscount, defaultTable.id, defaultTable.code);
      }
    }

    // 5. Fallback to product base price
    const product = await this.prisma.product.findFirst({
      where: { tenantId, id: dto.productId },
      select: { id: true, price: true },
    });

    if (product) {
      const priceGross = Number(product.price);
      const vatRate = 23; // Default VAT
      const priceNet = priceGross / (1 + vatRate / 100);

      let finalPriceNet = priceNet;
      let finalPriceGross = priceGross;

      if (customerDiscount) {
        finalPriceNet = priceNet * (1 - customerDiscount / 100);
        finalPriceGross = priceGross * (1 - customerDiscount / 100);
      }

      return {
        productId: dto.productId,
        priceNet: Math.round(finalPriceNet * 100) / 100,
        priceGross: Math.round(finalPriceGross * 100) / 100,
        vatRate,
        currency: 'PLN',
        isPromo: false,
        discountPercent: customerDiscount ?? undefined,
        originalPriceNet: customerDiscount ? Math.round(priceNet * 100) / 100 : undefined,
        originalPriceGross: customerDiscount ? Math.round(priceGross * 100) / 100 : undefined,
      };
    }

    // No price found - return zeros
    return {
      productId: dto.productId,
      priceNet: 0,
      priceGross: 0,
      vatRate: 23,
      currency: 'PLN',
      isPromo: false,
    };
  }

  /**
   * Resolve prices for multiple products at once
   */
  async resolvePrices(tenantId: string, dto: GetPricesDto): Promise<ResolvedPrice[]> {
    const results: ResolvedPrice[] = [];

    for (const productId of dto.productIds) {
      const price = await this.resolvePrice(tenantId, {
        productId,
        customerId: dto.customerId,
        date: dto.date,
      });
      results.push(price);
    }

    return results;
  }

  /**
   * Get all active price tables for a tenant
   */
  async getActivePriceTables(tenantId: string, date?: Date) {
    const now = date ?? new Date();

    return this.prisma.priceTable.findMany({
      where: {
        tenantId,
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      include: {
        category: true,
        _count: { select: { entries: true } },
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(
    tenantId: string,
    productId: string,
    options?: {
      priceTableId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = { productId };

    if (options?.priceTableId) {
      where.priceTableId = options.priceTableId;
    } else {
      // Only from tenant's price tables
      where.priceTable = { tenantId };
    }

    return this.prisma.priceTableEntry.findMany({
      where,
      include: {
        priceTable: {
          select: { id: true, code: true, name: true, validFrom: true, validTo: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Compare prices across price tables
   */
  async comparePrices(tenantId: string, productId: string) {
    const activeTables = await this.getActivePriceTables(tenantId);

    const comparisons = [];

    for (const table of activeTables) {
      const entry = await this.prisma.priceTableEntry.findFirst({
        where: {
          priceTableId: table.id,
          productId,
          isActive: true,
        },
        orderBy: { minQuantity: 'asc' },
      });

      if (entry) {
        comparisons.push({
          priceTableId: table.id,
          priceTableCode: table.code,
          priceTableName: table.name,
          priceType: table.priceType,
          priority: table.priority,
          priceNet: Number(entry.priceNet),
          priceGross: Number(entry.priceGross),
          isPromo: !!(entry.promoPrice && this.isPromoActive(entry)),
          promoPrice: entry.promoPrice ? Number(entry.promoPrice) : null,
        });
      }
    }

    return comparisons.sort((a, b) => a.priceNet - b.priceNet);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async findPriceEntry(
    priceTableId: string,
    productId: string,
    quantity: number,
    date: Date,
  ) {
    // Find entry matching quantity tier
    const entries = await this.prisma.priceTableEntry.findMany({
      where: {
        priceTableId,
        productId,
        isActive: true,
        minQuantity: { lte: quantity },
        OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }],
      },
      include: {
        priceTable: { select: { id: true, code: true, currency: true } },
      },
      orderBy: { minQuantity: 'desc' }, // Get highest matching tier
    });

    return entries[0] || null;
  }

  private buildResolvedPrice(
    entry: any,
    customerDiscount: number | null,
    priceTableId?: string,
    priceTableCode?: string,
  ): ResolvedPrice {
    let priceNet = Number(entry.priceNet);
    let priceGross = Number(entry.priceGross);
    let isPromo = false;

    // Check for active promo
    if (entry.promoPrice && this.isPromoActive(entry)) {
      const originalPriceNet = priceNet;
      const originalPriceGross = priceGross;
      priceNet = Number(entry.promoPrice) / (1 + Number(entry.vatRate) / 100);
      priceGross = Number(entry.promoPrice);
      isPromo = true;

      return {
        productId: entry.productId,
        priceNet: Math.round(priceNet * 100) / 100,
        priceGross: Math.round(priceGross * 100) / 100,
        vatRate: Number(entry.vatRate),
        currency: entry.priceTable?.currency ?? 'PLN',
        priceTableId: priceTableId ?? entry.priceTable?.id,
        priceTableCode: priceTableCode ?? entry.priceTable?.code,
        isPromo: true,
        originalPriceNet: Math.round(originalPriceNet * 100) / 100,
        originalPriceGross: Math.round(originalPriceGross * 100) / 100,
      };
    }

    // Apply customer discount
    if (customerDiscount) {
      const originalPriceNet = priceNet;
      const originalPriceGross = priceGross;
      priceNet = priceNet * (1 - customerDiscount / 100);
      priceGross = priceGross * (1 - customerDiscount / 100);

      return {
        productId: entry.productId,
        priceNet: Math.round(priceNet * 100) / 100,
        priceGross: Math.round(priceGross * 100) / 100,
        vatRate: Number(entry.vatRate),
        currency: entry.priceTable?.currency ?? 'PLN',
        priceTableId: priceTableId ?? entry.priceTable?.id,
        priceTableCode: priceTableCode ?? entry.priceTable?.code,
        isPromo: false,
        discountPercent: customerDiscount,
        originalPriceNet: Math.round(originalPriceNet * 100) / 100,
        originalPriceGross: Math.round(originalPriceGross * 100) / 100,
      };
    }

    return {
      productId: entry.productId,
      priceNet: Math.round(priceNet * 100) / 100,
      priceGross: Math.round(priceGross * 100) / 100,
      vatRate: Number(entry.vatRate),
      currency: entry.priceTable?.currency ?? 'PLN',
      priceTableId: priceTableId ?? entry.priceTable?.id,
      priceTableCode: priceTableCode ?? entry.priceTable?.code,
      isPromo,
    };
  }

  private isPromoActive(entry: any): boolean {
    const now = new Date();
    if (entry.promoValidFrom && new Date(entry.promoValidFrom) > now) return false;
    if (entry.promoValidTo && new Date(entry.promoValidTo) < now) return false;
    return true;
  }
}
