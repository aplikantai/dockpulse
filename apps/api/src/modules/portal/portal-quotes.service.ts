import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PortalQuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyQuotes(customerId: string, tenantId: string) {
    return this.prisma.quote.findMany({
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

  async getQuote(quoteId: string, customerId: string, tenantId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
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

    if (!quote) {
      throw new NotFoundException('Wycena nie znaleziona');
    }

    return quote;
  }

  async acceptQuote(quoteId: string, customerId: string, tenantId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        customerId,
        tenantId,
      },
      include: {
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Wycena nie znaleziona');
    }

    if (quote.status !== 'sent') {
      throw new BadRequestException('Wycena nie może być zaakceptowana');
    }

    // Check if quote is still valid
    if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
      throw new BadRequestException('Wycena straciła ważność');
    }

    // Generate order number
    const orderCount = await this.prisma.order.count({ where: { tenantId } });
    const orderNumber = `ZAM-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

    // Create order from quote
    const order = await this.prisma.order.create({
      data: {
        tenantId,
        orderNumber,
        customerId,
        status: 'new',
        totalNet: quote.totalNet,
        totalGross: quote.totalGross,
        vatRate: quote.vatRate,
        notes: quote.notes,
        metadata: {
          source: 'portal',
          fromQuote: quoteId,
        },
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
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

    // Update quote status
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'accepted',
        metadata: {
          ...(quote.metadata as object || {}),
          acceptedAt: new Date().toISOString(),
          orderId: order.id,
        },
      },
    });

    return {
      quote: { ...quote, status: 'accepted' },
      order,
    };
  }

  async rejectQuote(quoteId: string, customerId: string, tenantId: string, reason?: string) {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        customerId,
        tenantId,
      },
    });

    if (!quote) {
      throw new NotFoundException('Wycena nie znaleziona');
    }

    if (quote.status !== 'sent') {
      throw new BadRequestException('Wycena nie może być odrzucona');
    }

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'rejected',
        metadata: {
          ...(quote.metadata as object || {}),
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason,
        },
      },
    });

    return { success: true };
  }
}
