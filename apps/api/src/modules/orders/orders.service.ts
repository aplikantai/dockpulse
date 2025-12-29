import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  OrderResponseDto,
  OrderListQueryDto,
  OrderStatus,
} from './dto/order.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ORDER_STATUSES, ENTITY_NAMING, EVENT_TYPES } from '../../common/constants';

type TemplateType = 'services' | 'production' | 'trade';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ===========================================
  // TEMPLATE-AWARE HELPERS
  // ===========================================

  private async getTenantTemplate(tenantId: string): Promise<TemplateType> {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { template: true },
    });
    return (tenant?.template as TemplateType) || 'services';
  }

  async getValidStatuses(tenantId: string) {
    const template = await this.getTenantTemplate(tenantId);
    return ORDER_STATUSES[template];
  }

  async getEntityNaming(tenantId: string) {
    const template = await this.getTenantTemplate(tenantId);
    return ENTITY_NAMING[template];
  }

  private async validateStatus(tenantId: string, status: string): Promise<boolean> {
    const validStatuses = await this.getValidStatuses(tenantId);
    return validStatuses.some((s) => s.code === status);
  }

  private async logEvent(
    tenantId: string,
    eventType: string,
    entityType: string,
    entityId: string,
    userId: string | null,
    payload: object,
  ): Promise<void> {
    await (this.prisma as any).eventLog.create({
      data: {
        tenantId,
        eventType,
        entityType,
        entityId,
        userId,
        payload,
      },
    });
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get count of orders for this tenant in current month
    const count = await (this.prisma as any).order.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(`${year}-${month}-01`),
        },
      },
    });

    return `ORD-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    // Verify customer exists and belongs to tenant
    const customer = await (this.prisma as any).customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Get products and calculate prices
    const productIds = dto.items.map((item) => item.productId);
    const products = await (this.prisma as any).product.findMany({
      where: { id: { in: productIds }, tenantId },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Calculate totals
    let totalNet = 0;
    const items = dto.items.map((item) => {
      const product = productMap.get(item.productId) as any;
      const unitPrice = item.unitPrice ?? Number(product.price);
      const totalPrice = unitPrice * item.quantity;
      totalNet += totalPrice;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const vatRate = dto.vatRate ?? 23;
    const totalGross = totalNet * (1 + vatRate / 100);

    const orderNumber = await this.generateOrderNumber(tenantId);

    const order = await (this.prisma as any).order.create({
      data: {
        tenantId,
        orderNumber,
        customerId: dto.customerId,
        userId,
        status: dto.status || 'new', // Use 'new' as default (first status in all templates)
        totalNet,
        totalGross,
        vatRate,
        notes: dto.notes,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    // Log order created event
    await this.logEvent(
      tenantId,
      EVENT_TYPES.ORDER_CREATED,
      'order',
      order.id,
      userId,
      { orderNumber, customerId: dto.customerId, totalGross },
    );

    return this.mapToResponse(order);
  }

  async findAll(
    tenantId: string,
    query: OrderListQueryDto = {},
  ): Promise<{ data: OrderResponseDto[]; total: number }> {
    const { status, customerId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.orderNumber = { contains: search, mode: 'insensitive' };
    }

    const [orders, total] = await Promise.all([
      (this.prisma as any).order.findMany({
        where,
        skip,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).order.count({ where }),
    ]);

    return {
      data: orders.map((o: any) => this.mapToResponse(o)),
      total,
    };
  }

  async findOne(tenantId: string, orderId: string): Promise<OrderResponseDto> {
    const cacheKey = `order:${orderId}`;
    const cached = await this.cacheManager.get<OrderResponseDto>(cacheKey);
    if (cached && cached.tenantId === tenantId) return cached;

    const order = await (this.prisma as any).order.findFirst({
      where: { id: orderId, tenantId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const response = this.mapToResponse(order);
    await this.cacheManager.set(cacheKey, response, 300000);
    return response;
  }

  async update(
    tenantId: string,
    orderId: string,
    dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    const existingOrder = await (this.prisma as any).order.findFirst({
      where: { id: orderId, tenantId },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    // If items are being updated, recalculate totals
    if (dto.items) {
      // Delete existing items
      await (this.prisma as any).orderItem.deleteMany({
        where: { orderId },
      });

      const productIds = dto.items.map((item) => item.productId);
      const products = await (this.prisma as any).product.findMany({
        where: { id: { in: productIds }, tenantId },
      });

      const productMap = new Map(products.map((p: any) => [p.id, p]));

      let totalNet = 0;
      const items = dto.items.map((item) => {
        const product = productMap.get(item.productId) as any;
        const unitPrice = item.unitPrice ?? Number(product.price);
        const totalPrice = unitPrice * item.quantity;
        totalNet += totalPrice;

        return {
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        };
      });

      const vatRate = dto.vatRate ?? existingOrder.vatRate;
      const totalGross = totalNet * (1 + Number(vatRate) / 100);

      await (this.prisma as any).orderItem.createMany({
        data: items,
      });

      const order = await (this.prisma as any).order.update({
        where: { id: orderId },
        data: {
          customerId: dto.customerId,
          status: dto.status,
          totalNet,
          totalGross,
          vatRate,
          notes: dto.notes,
        },
        include: { items: true },
      });

      await this.cacheManager.del(`order:${orderId}`);
      return this.mapToResponse(order);
    }

    // Simple update without items
    const order = await (this.prisma as any).order.update({
      where: { id: orderId },
      data: {
        customerId: dto.customerId,
        status: dto.status,
        notes: dto.notes,
      },
      include: { items: true },
    });

    await this.cacheManager.del(`order:${orderId}`);
    return this.mapToResponse(order);
  }

  async updateStatus(
    tenantId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
    userId?: string,
  ): Promise<OrderResponseDto> {
    const order = await (this.prisma as any).order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status is valid for tenant's template
    const isValid = await this.validateStatus(tenantId, dto.status);
    if (!isValid) {
      const validStatuses = await this.getValidStatuses(tenantId);
      throw new BadRequestException(
        `Invalid status. Valid statuses: ${validStatuses.map((s) => s.code).join(', ')}`,
      );
    }

    const previousStatus = order.status;

    const updated = await (this.prisma as any).order.update({
      where: { id: orderId },
      data: { status: dto.status },
      include: { items: true },
    });

    // Log status change event
    await this.logEvent(
      tenantId,
      EVENT_TYPES.ORDER_STATUS_CHANGED,
      'order',
      orderId,
      userId || null,
      { previousStatus, newStatus: dto.status, orderNumber: order.orderNumber },
    );

    await this.cacheManager.del(`order:${orderId}`);
    return this.mapToResponse(updated);
  }

  async remove(tenantId: string, orderId: string): Promise<void> {
    const order = await (this.prisma as any).order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await (this.prisma as any).order.delete({
      where: { id: orderId },
    });

    await this.cacheManager.del(`order:${orderId}`);
  }

  private mapToResponse(order: any): OrderResponseDto {
    return {
      id: order.id,
      tenantId: order.tenantId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      userId: order.userId,
      status: order.status as OrderStatus,
      totalNet: Number(order.totalNet),
      totalGross: Number(order.totalGross),
      vatRate: Number(order.vatRate),
      notes: order.notes,
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
