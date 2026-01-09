import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductionPlanStatus, ProductionItemStatus } from '@prisma/client';
import {
  CreatePlanDto,
  UpdatePlanDto,
  CreatePlanItemDto,
  UpdatePlanItemDto,
  ProducePlanItemDto,
  GeneratePlanFromOrdersDto,
} from '../dto/plan.dto';
import { EventBusService } from '../../events/event-bus.service';
import { ConversionService } from './conversion.service';

@Injectable()
export class PlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly conversionService: ConversionService,
  ) {}

  async findAll(
    tenantId: string,
    options?: {
      status?: ProductionPlanStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { tenantId };

    if (options?.status) where.status = options.status;
    if (options?.startDate || options?.endDate) {
      where.planDate = {};
      if (options.startDate) where.planDate.gte = options.startDate;
      if (options.endDate) where.planDate.lte = options.endDate;
    }

    const [plans, total] = await Promise.all([
      this.prisma.productionPlan.findMany({
        where,
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { planDate: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.productionPlan.count({ where }),
    ]);

    return { plans, total };
  }

  async findOne(tenantId: string, id: string) {
    const plan = await this.prisma.productionPlan.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Production plan ${id} not found`);
    }

    return plan;
  }

  async findByDate(tenantId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.productionPlan.findFirst({
      where: {
        tenantId,
        planDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async create(tenantId: string, userId: string, dto: CreatePlanDto) {
    const planNumber = await this.generatePlanNumber(tenantId);
    const planDate = new Date(dto.planDate);

    const existingPlan = await this.findByDate(tenantId, planDate);
    if (existingPlan) {
      throw new ConflictException(`Production plan for ${dto.planDate} already exists`);
    }

    let totalItems = 0;
    let totalQuantity = 0;
    let totalWeight = 0;

    if (dto.items) {
      for (const item of dto.items) {
        totalItems++;
        totalQuantity += item.targetQuantity || item.orderedQuantity || 0;
        totalWeight += Number(item.targetWeight || item.orderedWeight || 0);
      }
    }

    const plan = await this.prisma.productionPlan.create({
      data: {
        tenantId,
        planNumber,
        planDate,
        status: ProductionPlanStatus.DRAFT,
        totalItems,
        totalQuantity,
        totalWeight: totalWeight || null,
        notes: dto.notes,
        createdById: userId,
        items: dto.items
          ? {
              create: dto.items.map((item, index) => ({
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                orderedQuantity: item.orderedQuantity,
                orderedWeight: item.orderedWeight,
                orderedUnit: item.orderedUnit || 'szt',
                targetQuantity: item.targetQuantity || item.orderedQuantity,
                targetWeight: item.targetWeight || item.orderedWeight,
                targetUnit: item.targetUnit || item.orderedUnit || 'szt',
                orderIds: item.orderIds || [],
                assignedToId: item.assignedToId,
                notes: item.notes,
                sortOrder: item.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
      },
    });

    return plan;
  }

  async update(tenantId: string, id: string, dto: UpdatePlanDto) {
    const plan = await this.findOne(tenantId, id);

    if (
      plan.status === ProductionPlanStatus.COMPLETED ||
      plan.status === ProductionPlanStatus.CANCELLED
    ) {
      throw new ConflictException('Cannot update completed or cancelled plan');
    }

    return this.prisma.productionPlan.update({
      where: { id },
      data: {
        planDate: dto.planDate ? new Date(dto.planDate) : undefined,
        status: dto.status,
        notes: dto.notes,
      },
      include: {
        items: true,
      },
    });
  }

  async addItem(tenantId: string, planId: string, item: CreatePlanItemDto) {
    const plan = await this.findOne(tenantId, planId);

    if (plan.status !== ProductionPlanStatus.DRAFT) {
      throw new ConflictException('Can only add items to draft plans');
    }

    const maxSortOrder = await this.prisma.productionPlanItem.aggregate({
      where: { planId },
      _max: { sortOrder: true },
    });

    const newItem = await this.prisma.productionPlanItem.create({
      data: {
        planId,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        orderedQuantity: item.orderedQuantity,
        orderedWeight: item.orderedWeight,
        orderedUnit: item.orderedUnit || 'szt',
        targetQuantity: item.targetQuantity || item.orderedQuantity,
        targetWeight: item.targetWeight || item.orderedWeight,
        targetUnit: item.targetUnit || item.orderedUnit || 'szt',
        orderIds: item.orderIds || [],
        assignedToId: item.assignedToId,
        notes: item.notes,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });

    await this.recalculatePlanTotals(planId);

    return newItem;
  }

  async updateItem(tenantId: string, planId: string, itemId: string, dto: UpdatePlanItemDto) {
    const plan = await this.findOne(tenantId, planId);

    if (plan.status === ProductionPlanStatus.COMPLETED) {
      throw new ConflictException('Cannot update items in completed plan');
    }

    const item = plan.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found in plan`);
    }

    const updated = await this.prisma.productionPlanItem.update({
      where: { id: itemId },
      data: dto,
    });

    await this.recalculatePlanTotals(planId);

    return updated;
  }

  async removeItem(tenantId: string, planId: string, itemId: string) {
    const plan = await this.findOne(tenantId, planId);

    if (plan.status !== ProductionPlanStatus.DRAFT) {
      throw new ConflictException('Can only remove items from draft plans');
    }

    await this.prisma.productionPlanItem.delete({
      where: { id: itemId },
    });

    await this.recalculatePlanTotals(planId);
  }

  async confirm(tenantId: string, id: string, userId: string) {
    const plan = await this.findOne(tenantId, id);

    if (plan.status !== ProductionPlanStatus.DRAFT) {
      throw new ConflictException('Can only confirm draft plans');
    }

    if (plan.items.length === 0) {
      throw new BadRequestException('Cannot confirm plan without items');
    }

    const updated = await this.prisma.productionPlan.update({
      where: { id },
      data: {
        status: ProductionPlanStatus.CONFIRMED,
        confirmedById: userId,
        confirmedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    await this.eventBus.emitEvent({
      type: 'production.plan.confirmed',
      tenantId,
      entityType: 'production_plan',
      entityId: updated.id,
      payload: {
        planNumber: updated.planNumber,
        planDate: updated.planDate,
        totalItems: updated.totalItems,
      },
      userId,
    });

    return updated;
  }

  async start(tenantId: string, id: string, userId: string) {
    const plan = await this.findOne(tenantId, id);

    if (plan.status !== ProductionPlanStatus.CONFIRMED) {
      throw new ConflictException('Can only start confirmed plans');
    }

    return this.prisma.productionPlan.update({
      where: { id },
      data: {
        status: ProductionPlanStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        items: true,
      },
    });
  }

  async produceItem(
    tenantId: string,
    planId: string,
    userId: string,
    dto: ProducePlanItemDto,
  ) {
    const plan = await this.findOne(tenantId, planId);

    if (
      plan.status !== ProductionPlanStatus.CONFIRMED &&
      plan.status !== ProductionPlanStatus.IN_PROGRESS
    ) {
      throw new ConflictException('Plan must be confirmed or in progress');
    }

    const item = plan.items.find((i) => i.id === dto.itemId);
    if (!item) {
      throw new NotFoundException(`Item ${dto.itemId} not found`);
    }

    const isComplete = dto.producedQuantity >= item.targetQuantity;

    await this.prisma.productionPlanItem.update({
      where: { id: dto.itemId },
      data: {
        producedQuantity: dto.producedQuantity,
        producedWeight: dto.producedWeight,
        status: isComplete ? ProductionItemStatus.COMPLETED : ProductionItemStatus.IN_PROGRESS,
        startedAt: item.startedAt || new Date(),
        completedAt: isComplete ? new Date() : null,
        completedById: isComplete ? userId : null,
        notes: dto.notes ? `${item.notes || ''}\n${dto.notes}` : item.notes,
      },
    });

    if (plan.status === ProductionPlanStatus.CONFIRMED) {
      await this.prisma.productionPlan.update({
        where: { id: planId },
        data: {
          status: ProductionPlanStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });
    }

    const completedCount = await this.prisma.productionPlanItem.count({
      where: { planId, status: ProductionItemStatus.COMPLETED },
    });

    await this.prisma.productionPlan.update({
      where: { id: planId },
      data: {
        completedItems: completedCount,
      },
    });

    if (completedCount === plan.items.length) {
      await this.complete(tenantId, planId, userId);
    }

    return this.findOne(tenantId, planId);
  }

  async complete(tenantId: string, id: string, userId: string) {
    const plan = await this.findOne(tenantId, id);

    const updated = await this.prisma.productionPlan.update({
      where: { id },
      data: {
        status: ProductionPlanStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    await this.eventBus.emitEvent({
      type: 'production.plan.completed',
      tenantId,
      entityType: 'production_plan',
      entityId: updated.id,
      payload: {
        planNumber: updated.planNumber,
        planDate: updated.planDate,
        totalItems: updated.totalItems,
        completedItems: updated.completedItems,
      },
      userId,
    });

    return updated;
  }

  async cancel(tenantId: string, id: string, userId: string, reason?: string) {
    const plan = await this.findOne(tenantId, id);

    if (plan.status === ProductionPlanStatus.COMPLETED) {
      throw new ConflictException('Cannot cancel completed plan');
    }

    return this.prisma.productionPlan.update({
      where: { id },
      data: {
        status: ProductionPlanStatus.CANCELLED,
        notes: reason ? `${plan.notes || ''}\n[ANULOWANO] ${reason}` : plan.notes,
      },
    });
  }

  async generateFromOrders(
    tenantId: string,
    userId: string,
    dto: GeneratePlanFromOrdersDto,
  ) {
    const planDate = new Date(dto.planDate);

    const existingPlan = await this.findByDate(tenantId, planDate);
    if (existingPlan) {
      throw new ConflictException(`Production plan for ${dto.planDate} already exists`);
    }

    const orderDateFrom = dto.orderDateFrom
      ? new Date(dto.orderDateFrom)
      : new Date(planDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const orderDateTo = dto.orderDateTo ? new Date(dto.orderDateTo) : planDate;

    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: orderDateFrom,
          lte: orderDateTo,
        },
        status: dto.orderStatuses?.length
          ? { in: dto.orderStatuses }
          : { in: ['new', 'confirmed', 'in_progress'] },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const productAggregation: Map<
      string,
      {
        productId: string;
        productName: string;
        productSku: string;
        totalQuantity: number;
        totalWeight: number;
        unit: string;
        orderIds: string[];
      }
    > = new Map();

    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId;
        const existing = productAggregation.get(key);

        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.orderIds.push(order.id);
        } else {
          productAggregation.set(key, {
            productId: item.productId,
            productName: item.product.name,
            productSku: item.product.sku,
            totalQuantity: item.quantity,
            totalWeight: 0,
            unit: item.product.unit || 'szt',
            orderIds: [order.id],
          });
        }
      }
    }

    const items: CreatePlanItemDto[] = [];
    for (const [, data] of productAggregation) {
      items.push({
        productId: data.productId,
        productName: data.productName,
        productSku: data.productSku,
        orderedQuantity: data.totalQuantity,
        orderedUnit: data.unit,
        orderIds: [...new Set(data.orderIds)],
      });
    }

    return this.create(tenantId, userId, {
      planDate: dto.planDate,
      notes: dto.notes || `Wygenerowano automatycznie z ${orders.length} zamówień`,
      items,
    });
  }

  private async generatePlanNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'PROD';

    const lastPlan = await this.prisma.productionPlan.findFirst({
      where: {
        tenantId,
        planNumber: { startsWith: `${prefix}/${year}/` },
      },
      orderBy: { planNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastPlan) {
      const parts = lastPlan.planNumber.split('/');
      nextNumber = parseInt(parts[2], 10) + 1;
    }

    return `${prefix}/${year}/${nextNumber.toString().padStart(4, '0')}`;
  }

  private async recalculatePlanTotals(planId: string) {
    const items = await this.prisma.productionPlanItem.findMany({
      where: { planId },
    });

    let totalItems = items.length;
    let totalQuantity = 0;
    let totalWeight = 0;
    let completedItems = 0;

    for (const item of items) {
      totalQuantity += item.targetQuantity;
      totalWeight += Number(item.targetWeight || 0);
      if (item.status === ProductionItemStatus.COMPLETED) {
        completedItems++;
      }
    }

    await this.prisma.productionPlan.update({
      where: { id: planId },
      data: {
        totalItems,
        totalQuantity,
        totalWeight: totalWeight || null,
        completedItems,
      },
    });
  }
}
