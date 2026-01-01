import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePortalOrderDto } from './dto/portal-order.dto';

@Injectable()
export class PortalOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyOrders(customerId: string, tenantId: string) {
    return this.prisma.order.findMany({
      where: {
        customerId,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrder(orderId: string, customerId: string, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Zamówienie nie znalezione');
    }

    return order;
  }

  async createOrder(
    customerId: string,
    tenantId: string,
    dto: CreatePortalOrderDto,
  ) {
    // Validate products exist
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: dto.items.map((item) => item.productId) },
        tenantId,
        active: true,
      },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('Niektóre produkty nie są dostępne');
    }

    // Generate order number
    const orderCount = await this.prisma.order.count({ where: { tenantId } });
    const orderNumber = `ZAM-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

    // Calculate totals
    let totalNet = 0;
    const orderItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = Number(product.price);
      const itemTotal = unitPrice * item.quantity;
      totalNet += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
      };
    });

    const vatRate = 23;
    const totalGross = totalNet * (1 + vatRate / 100);

    // Create order
    const order = await this.prisma.order.create({
      data: {
        tenantId,
        orderNumber,
        customerId,
        status: 'new',
        totalNet,
        totalGross,
        vatRate,
        notes: dto.notes,
        metadata: {
          source: 'portal',
          deliveryAddress: dto.deliveryAddress,
          deliveryDate: dto.deliveryDate,
        } as any,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return order;
  }

  async getOrderStats(customerId: string, tenantId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId, tenantId },
      select: {
        status: true,
        totalGross: true,
        createdAt: true,
      },
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalGross), 0);
    const pendingOrders = orders.filter((o) =>
      ['new', 'confirmed', 'in_progress'].includes(o.status),
    ).length;

    return {
      totalOrders,
      totalSpent,
      pendingOrders,
      lastOrderDate: orders[0]?.createdAt || null,
    };
  }
}
