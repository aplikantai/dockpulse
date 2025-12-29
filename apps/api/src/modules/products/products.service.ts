import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
  ProductResponseDto,
  ProductListQueryDto,
} from './dto/product.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(tenantId: string, dto: CreateProductDto): Promise<ProductResponseDto> {
    // Check if SKU already exists for this tenant
    const existingProduct = await (this.prisma as any).product.findFirst({
      where: { tenantId, sku: dto.sku },
    });

    if (existingProduct) {
      throw new ConflictException(`Product with SKU '${dto.sku}' already exists`);
    }

    const product = await (this.prisma as any).product.create({
      data: {
        ...dto,
        tenantId,
      },
    });

    return this.mapToResponse(product);
  }

  async findAll(
    tenantId: string,
    query: ProductListQueryDto = {},
  ): Promise<{ data: ProductResponseDto[]; total: number }> {
    const { search, category, active, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [products, total] = await Promise.all([
      (this.prisma as any).product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      (this.prisma as any).product.count({ where }),
    ]);

    return {
      data: products.map((p: any) => this.mapToResponse(p)),
      total,
    };
  }

  async findOne(tenantId: string, productId: string): Promise<ProductResponseDto> {
    const cacheKey = `product:${productId}`;
    const cached = await this.cacheManager.get<ProductResponseDto>(cacheKey);
    if (cached && cached.tenantId === tenantId) return cached;

    const product = await (this.prisma as any).product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const response = this.mapToResponse(product);
    await this.cacheManager.set(cacheKey, response, 300000);
    return response;
  }

  async findBySku(tenantId: string, sku: string): Promise<ProductResponseDto> {
    const product = await (this.prisma as any).product.findFirst({
      where: { sku, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.mapToResponse(product);
  }

  async update(
    tenantId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const existingProduct = await (this.prisma as any).product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Check if new SKU is already taken
    if (dto.sku && dto.sku !== existingProduct.sku) {
      const skuExists = await (this.prisma as any).product.findFirst({
        where: { tenantId, sku: dto.sku, id: { not: productId } },
      });
      if (skuExists) {
        throw new ConflictException(`Product with SKU '${dto.sku}' already exists`);
      }
    }

    const product = await (this.prisma as any).product.update({
      where: { id: productId },
      data: dto,
    });

    await this.cacheManager.del(`product:${productId}`);
    return this.mapToResponse(product);
  }

  async updateStock(
    tenantId: string,
    productId: string,
    dto: UpdateStockDto,
  ): Promise<ProductResponseDto> {
    const product = await (this.prisma as any).product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newStock = product.stock + dto.quantity;
    if (newStock < 0) {
      throw new ConflictException('Insufficient stock');
    }

    const updated = await (this.prisma as any).product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    await this.cacheManager.del(`product:${productId}`);
    return this.mapToResponse(updated);
  }

  async remove(tenantId: string, productId: string): Promise<void> {
    const product = await (this.prisma as any).product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await (this.prisma as any).product.delete({
      where: { id: productId },
    });

    await this.cacheManager.del(`product:${productId}`);
  }

  async getCategories(tenantId: string): Promise<string[]> {
    const products = await (this.prisma as any).product.findMany({
      where: { tenantId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return products.map((p: any) => p.category).filter(Boolean);
  }

  private mapToResponse(product: any): ProductResponseDto {
    return {
      id: product.id,
      tenantId: product.tenantId,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      unit: product.unit,
      category: product.category,
      stock: product.stock,
      active: product.active,
      metadata: product.metadata,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
