import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  UpdateQuoteStatusDto,
  QuoteResponseDto,
  QuoteListQueryDto,
  QuoteStatus,
} from './dto/quote.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async generateQuoteNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const count = await (this.prisma as any).quote.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(`${year}-${month}-01`),
        },
      },
    });

    return `QUO-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    const customer = await (this.prisma as any).customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await (this.prisma as any).product.findMany({
      where: { id: { in: productIds }, tenantId },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));

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

    const quoteNumber = await this.generateQuoteNumber(tenantId);

    const quote = await (this.prisma as any).quote.create({
      data: {
        tenantId,
        quoteNumber,
        customerId: dto.customerId,
        userId,
        status: dto.status || QuoteStatus.DRAFT,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
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

    return this.mapToResponse(quote);
  }

  async findAll(
    tenantId: string,
    query: QuoteListQueryDto = {},
  ): Promise<{ data: QuoteResponseDto[]; total: number }> {
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
      where.quoteNumber = { contains: search, mode: 'insensitive' };
    }

    const [quotes, total] = await Promise.all([
      (this.prisma as any).quote.findMany({
        where,
        skip,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).quote.count({ where }),
    ]);

    return {
      data: quotes.map((q: any) => this.mapToResponse(q)),
      total,
    };
  }

  async findOne(tenantId: string, quoteId: string): Promise<QuoteResponseDto> {
    const cacheKey = `quote:${quoteId}`;
    const cached = await this.cacheManager.get<QuoteResponseDto>(cacheKey);
    if (cached && cached.tenantId === tenantId) return cached;

    const quote = await (this.prisma as any).quote.findFirst({
      where: { id: quoteId, tenantId },
      include: { items: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    const response = this.mapToResponse(quote);
    await this.cacheManager.set(cacheKey, response, 300000);
    return response;
  }

  async update(
    tenantId: string,
    quoteId: string,
    dto: UpdateQuoteDto,
  ): Promise<QuoteResponseDto> {
    const existingQuote = await (this.prisma as any).quote.findFirst({
      where: { id: quoteId, tenantId },
      include: { items: true },
    });

    if (!existingQuote) {
      throw new NotFoundException('Quote not found');
    }

    if (dto.items) {
      await (this.prisma as any).quoteItem.deleteMany({
        where: { quoteId },
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
          quoteId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        };
      });

      const vatRate = dto.vatRate ?? existingQuote.vatRate;
      const totalGross = totalNet * (1 + Number(vatRate) / 100);

      await (this.prisma as any).quoteItem.createMany({
        data: items,
      });

      const quote = await (this.prisma as any).quote.update({
        where: { id: quoteId },
        data: {
          customerId: dto.customerId,
          status: dto.status,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          totalNet,
          totalGross,
          vatRate,
          notes: dto.notes,
        },
        include: { items: true },
      });

      await this.cacheManager.del(`quote:${quoteId}`);
      return this.mapToResponse(quote);
    }

    const quote = await (this.prisma as any).quote.update({
      where: { id: quoteId },
      data: {
        customerId: dto.customerId,
        status: dto.status,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
      },
      include: { items: true },
    });

    await this.cacheManager.del(`quote:${quoteId}`);
    return this.mapToResponse(quote);
  }

  async updateStatus(
    tenantId: string,
    quoteId: string,
    dto: UpdateQuoteStatusDto,
  ): Promise<QuoteResponseDto> {
    const quote = await (this.prisma as any).quote.findFirst({
      where: { id: quoteId, tenantId },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    const updated = await (this.prisma as any).quote.update({
      where: { id: quoteId },
      data: { status: dto.status },
      include: { items: true },
    });

    await this.cacheManager.del(`quote:${quoteId}`);
    return this.mapToResponse(updated);
  }

  async convertToOrder(tenantId: string, quoteId: string): Promise<any> {
    const quote = await (this.prisma as any).quote.findFirst({
      where: { id: quoteId, tenantId },
      include: { items: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new BadRequestException('Only accepted quotes can be converted to orders');
    }

    // Generate order number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await (this.prisma as any).order.count({
      where: {
        tenantId,
        createdAt: { gte: new Date(`${year}-${month}-01`) },
      },
    });
    const orderNumber = `ORD-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    // Create order from quote
    const order = await (this.prisma as any).order.create({
      data: {
        tenantId,
        orderNumber,
        customerId: quote.customerId,
        userId: quote.userId,
        status: 'new',
        totalNet: quote.totalNet,
        totalGross: quote.totalGross,
        vatRate: quote.vatRate,
        notes: quote.notes,
        metadata: { convertedFromQuote: quoteId },
        items: {
          create: quote.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true },
    });

    // Update quote status
    await (this.prisma as any).quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.CONVERTED },
    });

    await this.cacheManager.del(`quote:${quoteId}`);

    return order;
  }

  async remove(tenantId: string, quoteId: string): Promise<void> {
    const quote = await (this.prisma as any).quote.findFirst({
      where: { id: quoteId, tenantId },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    await (this.prisma as any).quote.delete({
      where: { id: quoteId },
    });

    await this.cacheManager.del(`quote:${quoteId}`);
  }

  private mapToResponse(quote: any): QuoteResponseDto {
    return {
      id: quote.id,
      tenantId: quote.tenantId,
      quoteNumber: quote.quoteNumber,
      customerId: quote.customerId,
      userId: quote.userId,
      status: quote.status as QuoteStatus,
      validUntil: quote.validUntil,
      totalNet: Number(quote.totalNet),
      totalGross: Number(quote.totalGross),
      vatRate: Number(quote.vatRate),
      notes: quote.notes,
      items: (quote.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }
}
