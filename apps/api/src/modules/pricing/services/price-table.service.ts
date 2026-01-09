import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PriceTableType } from '@prisma/client';
import {
  CreatePriceCategoryDto,
  UpdatePriceCategoryDto,
  CreatePriceTableDto,
  UpdatePriceTableDto,
  CreatePriceTableEntryDto,
  UpdatePriceTableEntryDto,
  BulkCreatePriceTableEntriesDto,
} from '../dto/price-table.dto';

@Injectable()
export class PriceTableService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // PRICE CATEGORIES
  // ============================================

  async findAllCategories(tenantId: string, includeInactive = false) {
    return this.prisma.priceCategory.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        parent: true,
        children: true,
        _count: { select: { priceTables: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findCategoryById(tenantId: string, id: string) {
    const category = await this.prisma.priceCategory.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: true,
        priceTables: { where: { isActive: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Price category ${id} not found`);
    }

    return category;
  }

  async createCategory(tenantId: string, dto: CreatePriceCategoryDto) {
    const existing = await this.prisma.priceCategory.findFirst({
      where: { tenantId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Price category with code ${dto.code} already exists`);
    }

    return this.prisma.priceCategory.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        parentId: dto.parentId,
        description: dto.description,
        defaultDiscountPercent: dto.defaultDiscountPercent,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(tenantId: string, id: string, dto: UpdatePriceCategoryDto) {
    await this.findCategoryById(tenantId, id);

    return this.prisma.priceCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        defaultDiscountPercent: dto.defaultDiscountPercent,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async deleteCategory(tenantId: string, id: string) {
    const category = await this.findCategoryById(tenantId, id);

    if (category.children.length > 0) {
      throw new ConflictException('Cannot delete category with children');
    }

    if (category.priceTables.length > 0) {
      throw new ConflictException('Cannot delete category with assigned price tables');
    }

    return this.prisma.priceCategory.delete({ where: { id } });
  }

  // ============================================
  // PRICE TABLES
  // ============================================

  async findAllTables(
    tenantId: string,
    options?: {
      categoryId?: string;
      priceType?: PriceTableType;
      isActive?: boolean;
      validAt?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { tenantId };

    if (options?.categoryId) where.categoryId = options.categoryId;
    if (options?.priceType) where.priceType = options.priceType;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    if (options?.validAt) {
      where.validFrom = { lte: options.validAt };
      where.OR = [
        { validTo: null },
        { validTo: { gte: options.validAt } },
      ];
    }

    const [tables, total] = await Promise.all([
      this.prisma.priceTable.findMany({
        where,
        include: {
          category: true,
          _count: { select: { entries: true } },
        },
        orderBy: [{ priority: 'desc' }, { validFrom: 'desc' }],
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.priceTable.count({ where }),
    ]);

    return { tables, total };
  }

  async findTableById(tenantId: string, id: string) {
    const table = await this.prisma.priceTable.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        entries: {
          where: { isActive: true },
          orderBy: { productName: 'asc' },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Price table ${id} not found`);
    }

    return table;
  }

  async findTableByCode(tenantId: string, code: string) {
    const table = await this.prisma.priceTable.findFirst({
      where: { tenantId, code },
      include: {
        category: true,
        entries: { where: { isActive: true } },
      },
    });

    if (!table) {
      throw new NotFoundException(`Price table with code ${code} not found`);
    }

    return table;
  }

  async findDefaultTable(tenantId: string) {
    return this.prisma.priceTable.findFirst({
      where: {
        tenantId,
        isDefault: true,
        isActive: true,
      },
      include: {
        entries: { where: { isActive: true } },
      },
    });
  }

  async createTable(tenantId: string, dto: CreatePriceTableDto) {
    const existing = await this.prisma.priceTable.findFirst({
      where: { tenantId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Price table with code ${dto.code} already exists`);
    }

    // If this is default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.priceTable.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.priceTable.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        currency: dto.currency ?? 'PLN',
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        priority: dto.priority ?? 0,
        priceType: dto.priceType ?? PriceTableType.STANDARD,
        isDefault: dto.isDefault ?? false,
      },
      include: { category: true },
    });
  }

  async updateTable(tenantId: string, id: string, dto: UpdatePriceTableDto) {
    await this.findTableById(tenantId, id);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.priceTable.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.priceTable.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        currency: dto.currency,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        priority: dto.priority,
        priceType: dto.priceType,
        isActive: dto.isActive,
        isDefault: dto.isDefault,
      },
      include: { category: true },
    });
  }

  async deleteTable(tenantId: string, id: string) {
    await this.findTableById(tenantId, id);

    // Delete all entries first (cascade)
    return this.prisma.priceTable.delete({ where: { id } });
  }

  async duplicateTable(tenantId: string, id: string, newCode: string, newName: string) {
    const source = await this.findTableById(tenantId, id);

    // Create new table
    const newTable = await this.prisma.priceTable.create({
      data: {
        tenantId,
        code: newCode,
        name: newName,
        description: source.description,
        categoryId: source.categoryId,
        currency: source.currency,
        validFrom: new Date(),
        validTo: null,
        priority: source.priority,
        priceType: source.priceType,
        isDefault: false,
      },
    });

    // Copy entries
    const entries = source.entries.map((entry) => ({
      priceTableId: newTable.id,
      productId: entry.productId,
      productSku: entry.productSku,
      productName: entry.productName,
      priceNet: entry.priceNet,
      priceGross: entry.priceGross,
      vatRate: entry.vatRate,
      minQuantity: entry.minQuantity,
      maxQuantity: entry.maxQuantity,
      isActive: true,
    }));

    if (entries.length > 0) {
      await this.prisma.priceTableEntry.createMany({ data: entries });
    }

    return this.findTableById(tenantId, newTable.id);
  }

  // ============================================
  // PRICE TABLE ENTRIES
  // ============================================

  async findEntriesByTable(
    tenantId: string,
    priceTableId: string,
    options?: {
      productId?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    },
  ) {
    // Verify table exists
    await this.findTableById(tenantId, priceTableId);

    const where: any = { priceTableId };
    if (options?.productId) where.productId = options.productId;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    const [entries, total] = await Promise.all([
      this.prisma.priceTableEntry.findMany({
        where,
        orderBy: [{ productName: 'asc' }, { minQuantity: 'asc' }],
        take: options?.limit || 100,
        skip: options?.offset || 0,
      }),
      this.prisma.priceTableEntry.count({ where }),
    ]);

    return { entries, total };
  }

  async findEntryById(tenantId: string, priceTableId: string, entryId: string) {
    await this.findTableById(tenantId, priceTableId);

    const entry = await this.prisma.priceTableEntry.findFirst({
      where: { id: entryId, priceTableId },
    });

    if (!entry) {
      throw new NotFoundException(`Price table entry ${entryId} not found`);
    }

    return entry;
  }

  async createEntry(tenantId: string, priceTableId: string, dto: CreatePriceTableEntryDto) {
    await this.findTableById(tenantId, priceTableId);

    // Check for duplicate
    const existing = await this.prisma.priceTableEntry.findFirst({
      where: {
        priceTableId,
        productId: dto.productId,
        minQuantity: dto.minQuantity ?? 1,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Entry for product ${dto.productId} with minQuantity ${dto.minQuantity ?? 1} already exists`,
      );
    }

    return this.prisma.priceTableEntry.create({
      data: {
        priceTableId,
        productId: dto.productId,
        productSku: dto.productSku,
        productName: dto.productName,
        priceNet: dto.priceNet,
        priceGross: dto.priceGross,
        vatRate: dto.vatRate ?? 23,
        promoPrice: dto.promoPrice,
        promoValidFrom: dto.promoValidFrom ? new Date(dto.promoValidFrom) : null,
        promoValidTo: dto.promoValidTo ? new Date(dto.promoValidTo) : null,
        minQuantity: dto.minQuantity ?? 1,
        maxQuantity: dto.maxQuantity,
      },
    });
  }

  async updateEntry(
    tenantId: string,
    priceTableId: string,
    entryId: string,
    dto: UpdatePriceTableEntryDto,
  ) {
    await this.findEntryById(tenantId, priceTableId, entryId);

    return this.prisma.priceTableEntry.update({
      where: { id: entryId },
      data: {
        priceNet: dto.priceNet,
        priceGross: dto.priceGross,
        vatRate: dto.vatRate,
        promoPrice: dto.promoPrice,
        promoValidFrom: dto.promoValidFrom ? new Date(dto.promoValidFrom) : undefined,
        promoValidTo: dto.promoValidTo ? new Date(dto.promoValidTo) : undefined,
        minQuantity: dto.minQuantity,
        maxQuantity: dto.maxQuantity,
        isActive: dto.isActive,
      },
    });
  }

  async deleteEntry(tenantId: string, priceTableId: string, entryId: string) {
    await this.findEntryById(tenantId, priceTableId, entryId);

    return this.prisma.priceTableEntry.delete({ where: { id: entryId } });
  }

  async bulkCreateEntries(
    tenantId: string,
    priceTableId: string,
    dto: BulkCreatePriceTableEntriesDto,
  ) {
    await this.findTableById(tenantId, priceTableId);

    const entries = dto.entries.map((entry) => ({
      priceTableId,
      productId: entry.productId,
      productSku: entry.productSku,
      productName: entry.productName,
      priceNet: entry.priceNet,
      priceGross: entry.priceGross,
      vatRate: entry.vatRate ?? 23,
      promoPrice: entry.promoPrice,
      promoValidFrom: entry.promoValidFrom ? new Date(entry.promoValidFrom) : null,
      promoValidTo: entry.promoValidTo ? new Date(entry.promoValidTo) : null,
      minQuantity: entry.minQuantity ?? 1,
      maxQuantity: entry.maxQuantity,
    }));

    const result = await this.prisma.priceTableEntry.createMany({
      data: entries,
      skipDuplicates: true,
    });

    return { created: result.count };
  }

  async bulkUpdatePrices(
    tenantId: string,
    priceTableId: string,
    adjustmentPercent: number,
    options?: {
      productIds?: string[];
      roundTo?: number; // Round to nearest X (e.g., 0.01, 1, 5)
    },
  ) {
    await this.findTableById(tenantId, priceTableId);

    const where: any = { priceTableId };
    if (options?.productIds?.length) {
      where.productId = { in: options.productIds };
    }

    const entries = await this.prisma.priceTableEntry.findMany({ where });
    const multiplier = 1 + adjustmentPercent / 100;
    const roundTo = options?.roundTo ?? 0.01;

    const updates = entries.map((entry) => {
      const newPriceNet = Math.round((Number(entry.priceNet) * multiplier) / roundTo) * roundTo;
      const newPriceGross = Math.round((Number(entry.priceGross) * multiplier) / roundTo) * roundTo;

      return this.prisma.priceTableEntry.update({
        where: { id: entry.id },
        data: {
          priceNet: newPriceNet,
          priceGross: newPriceGross,
        },
      });
    });

    await Promise.all(updates);

    return { updated: updates.length };
  }
}
