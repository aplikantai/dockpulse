import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventBusService } from '../../events/event-bus.service';

/**
 * StockService - Handles stock operations
 */
@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Deduct stock for a product
   */
  async deductStock(params: {
    tenantId: string;
    productId: string;
    quantity: number;
    reason: string;
    reference?: string;
    userId?: string;
  }): Promise<void> {
    const { tenantId, productId, quantity, reason, reference, userId } = params;

    // Get current product
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = product.stock || 0;
    const newStock = currentStock - quantity;

    if (newStock < 0) {
      this.logger.warn(
        `Stock deduction will result in negative stock: ${newStock} for product ${productId}`,
      );
      // Allow negative stock but log warning
      // TODO: Add configuration to prevent negative stock if needed
    }

    // Update product stock
    await this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    // Emit stock.deducted event
    await this.eventBus.emitEvent({
      type: 'stock.deducted',
      tenantId,
      entityType: 'product',
      entityId: productId,
      payload: {
        productId,
        quantity,
        previousStock: currentStock,
        newStock,
        reason,
        reference,
      },
      userId,
    });

    this.logger.debug(
      `Deducted ${quantity} units from product ${productId}: ${currentStock} → ${newStock}`,
    );
  }

  /**
   * Add stock for a product
   */
  async addStock(params: {
    tenantId: string;
    productId: string;
    quantity: number;
    reason: string;
    reference?: string;
    userId?: string;
  }): Promise<void> {
    const { tenantId, productId, quantity, reason, reference, userId } = params;

    // Get current product
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = product.stock || 0;
    const newStock = currentStock + quantity;

    // Update product stock
    await this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    // Emit stock.added event
    await this.eventBus.emitEvent({
      type: 'stock.added',
      tenantId,
      entityType: 'product',
      entityId: productId,
      payload: {
        productId,
        quantity,
        previousStock: currentStock,
        newStock,
        reason,
        reference,
      },
      userId,
    });

    this.logger.debug(
      `Added ${quantity} units to product ${productId}: ${currentStock} → ${newStock}`,
    );
  }

  /**
   * Adjust stock for a product (direct set)
   */
  async adjustStock(params: {
    tenantId: string;
    productId: string;
    newQuantity: number;
    reason: string;
    userId?: string;
  }): Promise<void> {
    const { tenantId, productId, newQuantity, reason, userId } = params;

    // Get current product
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = product.stock || 0;
    const difference = newQuantity - currentStock;

    // Update product stock
    await this.prisma.product.update({
      where: { id: productId },
      data: { stock: newQuantity },
    });

    // Emit stock.adjusted event
    await this.eventBus.emitEvent({
      type: 'stock.adjusted',
      tenantId,
      entityType: 'product',
      entityId: productId,
      payload: {
        productId,
        previousStock: currentStock,
        newStock: newQuantity,
        difference,
        reason,
      },
      userId,
    });

    this.logger.debug(
      `Adjusted stock for product ${productId}: ${currentStock} → ${newQuantity} (${difference > 0 ? '+' : ''}${difference})`,
    );
  }

  /**
   * Get current stock level for a product
   */
  async getStockLevel(
    tenantId: string,
    productId: string,
  ): Promise<number> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      select: {
        stock: true,
      },
    });

    return product?.stock || 0;
  }

  /**
   * Get products below reorder level
   */
  async getProductsBelowReorderLevel(
    tenantId: string,
  ): Promise<any[]> {
    // Note: This would require the extended fields to be stored in metadata
    // For now, we'll use a simple threshold
    const REORDER_THRESHOLD = 10;

    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        stock: {
          lt: REORDER_THRESHOLD,
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
      },
    });

    return products;
  }
}
