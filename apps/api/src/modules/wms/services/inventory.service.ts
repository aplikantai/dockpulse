import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InventoryCountStatus } from '@prisma/client';
import {
  CreateInventoryCountDto,
  UpdateInventoryCountDto,
  SubmitInventoryCountDto,
  ApproveInventoryCountDto,
} from '../dto/inventory.dto';
import { EventBusService } from '../../events/event-bus.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async findAll(
    tenantId: string,
    options?: {
      status?: InventoryCountStatus;
      locationId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { tenantId };

    if (options?.status) where.status = options.status;
    if (options?.locationId) where.locationId = options.locationId;
    if (options?.startDate || options?.endDate) {
      where.plannedDate = {};
      if (options.startDate) where.plannedDate.gte = options.startDate;
      if (options.endDate) where.plannedDate.lte = options.endDate;
    }

    const [counts, total] = await Promise.all([
      this.prisma.inventoryCount.findMany({
        where,
        include: {
          location: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.inventoryCount.count({ where }),
    ]);

    return { counts, total };
  }

  async findOne(tenantId: string, id: string) {
    const count = await this.prisma.inventoryCount.findFirst({
      where: { id, tenantId },
      include: {
        location: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!count) {
      throw new NotFoundException(`Inventory count ${id} not found`);
    }

    return count;
  }

  async create(tenantId: string, userId: string, dto: CreateInventoryCountDto) {
    const countNumber = await this.generateCountNumber(tenantId);

    const count = await this.prisma.inventoryCount.create({
      data: {
        tenantId,
        countNumber,
        status: InventoryCountStatus.DRAFT,
        locationId: dto.locationId,
        categoryCode: dto.categoryCode,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
        assignedToId: dto.assignedToId,
        notes: dto.notes,
        createdById: userId,
        items: dto.items
          ? {
              create: dto.items.map((item, index) => ({
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                locationCode: item.locationCode,
                expectedQty: item.expectedQty,
                countedQty: 0,
                variance: 0,
                batchNumber: item.batchNumber,
                sortOrder: item.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        location: true,
        items: true,
      },
    });

    return count;
  }

  async update(tenantId: string, id: string, dto: UpdateInventoryCountDto) {
    const count = await this.findOne(tenantId, id);

    if (
      count.status === InventoryCountStatus.APPROVED ||
      count.status === InventoryCountStatus.CANCELLED
    ) {
      throw new ConflictException('Cannot update approved or cancelled inventory count');
    }

    return this.prisma.inventoryCount.update({
      where: { id },
      data: {
        status: dto.status,
        locationId: dto.locationId,
        categoryCode: dto.categoryCode,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
        assignedToId: dto.assignedToId,
        notes: dto.notes,
      },
      include: {
        location: true,
        items: true,
      },
    });
  }

  async addItem(tenantId: string, countId: string, item: any) {
    const count = await this.findOne(tenantId, countId);

    if (count.status !== InventoryCountStatus.DRAFT) {
      throw new ConflictException('Can only add items to draft counts');
    }

    const maxSortOrder = await this.prisma.inventoryCountItem.aggregate({
      where: { countId },
      _max: { sortOrder: true },
    });

    return this.prisma.inventoryCountItem.create({
      data: {
        countId,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        locationCode: item.locationCode,
        expectedQty: item.expectedQty,
        countedQty: 0,
        variance: 0,
        batchNumber: item.batchNumber,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });
  }

  async removeItem(tenantId: string, countId: string, itemId: string) {
    const count = await this.findOne(tenantId, countId);

    if (count.status !== InventoryCountStatus.DRAFT) {
      throw new ConflictException('Can only remove items from draft counts');
    }

    return this.prisma.inventoryCountItem.delete({
      where: { id: itemId },
    });
  }

  async start(tenantId: string, id: string, userId: string) {
    const count = await this.findOne(tenantId, id);

    if (count.status !== InventoryCountStatus.DRAFT) {
      throw new ConflictException('Can only start draft inventory counts');
    }

    if (count.items.length === 0) {
      throw new BadRequestException('Cannot start inventory count without items');
    }

    return this.prisma.inventoryCount.update({
      where: { id },
      data: {
        status: InventoryCountStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        location: true,
        items: true,
      },
    });
  }

  async submitCounts(tenantId: string, id: string, userId: string, dto: SubmitInventoryCountDto) {
    const count = await this.findOne(tenantId, id);

    if (count.status !== InventoryCountStatus.IN_PROGRESS) {
      throw new ConflictException('Inventory count must be in progress to submit counts');
    }

    await this.prisma.$transaction(async (tx) => {
      let totalExpected = 0;
      let totalCounted = 0;
      let totalVariance = 0;

      for (const itemData of dto.items) {
        const item = count.items.find((i) => i.id === itemData.itemId);
        if (!item) {
          throw new NotFoundException(`Item ${itemData.itemId} not found`);
        }

        const variance = itemData.countedQty - item.expectedQty;

        await tx.inventoryCountItem.update({
          where: { id: itemData.itemId },
          data: {
            countedQty: itemData.countedQty,
            variance,
            notes: itemData.notes,
            countedById: userId,
            countedAt: new Date(),
          },
        });

        totalExpected += item.expectedQty;
        totalCounted += itemData.countedQty;
        totalVariance += variance;
      }

      await tx.inventoryCount.update({
        where: { id },
        data: {
          status: InventoryCountStatus.REVIEW,
          totalExpected,
          totalCounted,
          totalVariance,
          completedAt: new Date(),
        },
      });
    });

    return this.findOne(tenantId, id);
  }

  async approve(tenantId: string, id: string, userId: string, dto: ApproveInventoryCountDto) {
    const count = await this.findOne(tenantId, id);

    if (count.status !== InventoryCountStatus.REVIEW) {
      throw new ConflictException('Inventory count must be in review to approve');
    }

    const updated = await this.prisma.inventoryCount.update({
      where: { id },
      data: {
        status: InventoryCountStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
        notes: dto.notes ? `${count.notes || ''}\n[ZATWIERDZONO] ${dto.notes}` : count.notes,
      },
      include: {
        location: true,
        items: true,
      },
    });

    await this.eventBus.emitEvent({
      type: 'wms.inventory.completed',
      tenantId,
      entityType: 'inventory_count',
      entityId: updated.id,
      payload: {
        countNumber: updated.countNumber,
        totalVariance: updated.totalVariance,
      },
      userId,
    });

    return updated;
  }

  async cancel(tenantId: string, id: string, reason?: string) {
    const count = await this.findOne(tenantId, id);

    if (count.status === InventoryCountStatus.APPROVED) {
      throw new ConflictException('Cannot cancel approved inventory count');
    }

    return this.prisma.inventoryCount.update({
      where: { id },
      data: {
        status: InventoryCountStatus.CANCELLED,
        notes: reason ? `${count.notes || ''}\n[ANULOWANO] ${reason}` : count.notes,
      },
    });
  }

  async generateFromStock(tenantId: string, userId: string, locationId?: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
      },
    });

    const countNumber = await this.generateCountNumber(tenantId);

    return this.prisma.inventoryCount.create({
      data: {
        tenantId,
        countNumber,
        status: InventoryCountStatus.DRAFT,
        locationId,
        createdById: userId,
        items: {
          create: products.map((product, index) => ({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            expectedQty: product.stock,
            countedQty: 0,
            variance: 0,
            sortOrder: index,
          })),
        },
      },
      include: {
        location: true,
        items: true,
      },
    });
  }

  private async generateCountNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'INW';

    const lastCount = await this.prisma.inventoryCount.findFirst({
      where: {
        tenantId,
        countNumber: { startsWith: `${prefix}/${year}/` },
      },
      orderBy: { countNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastCount) {
      const parts = lastCount.countNumber.split('/');
      nextNumber = parseInt(parts[2], 10) + 1;
    }

    return `${prefix}/${year}/${nextNumber.toString().padStart(4, '0')}`;
  }
}
