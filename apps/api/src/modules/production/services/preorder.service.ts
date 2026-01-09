import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PreorderSlotStatus } from '@prisma/client';
import {
  CreatePreorderSlotDto,
  UpdatePreorderSlotDto,
  AddOrderToSlotDto,
  GenerateSlotsDto,
} from '../dto/preorder.dto';

@Injectable()
export class PreorderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    options?: {
      status?: PreorderSlotStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { tenantId };

    if (options?.status) where.status = options.status;
    if (options?.startDate || options?.endDate) {
      where.slotDate = {};
      if (options.startDate) where.slotDate.gte = options.startDate;
      if (options.endDate) where.slotDate.lte = options.endDate;
    }

    const [slots, total] = await Promise.all([
      this.prisma.preorderSlot.findMany({
        where,
        include: {
          _count: { select: { orders: true } },
        },
        orderBy: { slotDate: 'asc' },
        take: options?.limit || 60,
        skip: options?.offset || 0,
      }),
      this.prisma.preorderSlot.count({ where }),
    ]);

    return { slots, total };
  }

  async findAvailable(tenantId: string, days: number = 60) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    return this.prisma.preorderSlot.findMany({
      where: {
        tenantId,
        slotDate: {
          gte: today,
          lte: endDate,
        },
        status: PreorderSlotStatus.OPEN,
      },
      orderBy: { slotDate: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const slot = await this.prisma.preorderSlot.findFirst({
      where: { id, tenantId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException(`Preorder slot ${id} not found`);
    }

    return slot;
  }

  async findByDate(tenantId: string, date: Date) {
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    return this.prisma.preorderSlot.findFirst({
      where: {
        tenantId,
        slotDate,
      },
      include: {
        orders: true,
      },
    });
  }

  async create(tenantId: string, dto: CreatePreorderSlotDto) {
    const slotDate = new Date(dto.slotDate);
    slotDate.setHours(0, 0, 0, 0);

    const existing = await this.findByDate(tenantId, slotDate);
    if (existing) {
      throw new ConflictException(`Slot for ${dto.slotDate} already exists`);
    }

    return this.prisma.preorderSlot.create({
      data: {
        tenantId,
        slotDate,
        maxOrders: dto.maxOrders ?? 50,
        maxQuantity: dto.maxQuantity,
        maxWeight: dto.maxWeight,
        closeBeforeDays: dto.closeBeforeDays ?? 2,
        pickupTimeStart: dto.pickupTimeStart,
        pickupTimeEnd: dto.pickupTimeEnd,
        categoryIds: dto.categoryIds || null,
        notes: dto.notes,
        status: PreorderSlotStatus.OPEN,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePreorderSlotDto) {
    const slot = await this.findOne(tenantId, id);

    if (slot.status === PreorderSlotStatus.COMPLETED) {
      throw new ConflictException('Cannot update completed slot');
    }

    return this.prisma.preorderSlot.update({
      where: { id },
      data: {
        status: dto.status,
        maxOrders: dto.maxOrders,
        maxQuantity: dto.maxQuantity,
        maxWeight: dto.maxWeight,
        closeBeforeDays: dto.closeBeforeDays,
        pickupTimeStart: dto.pickupTimeStart,
        pickupTimeEnd: dto.pickupTimeEnd,
        categoryIds: dto.categoryIds,
        notes: dto.notes,
      },
      include: {
        orders: true,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const slot = await this.findOne(tenantId, id);

    if (slot.orders.length > 0) {
      throw new ConflictException('Cannot delete slot with orders');
    }

    return this.prisma.preorderSlot.delete({
      where: { id },
    });
  }

  async addOrder(tenantId: string, slotId: string, dto: AddOrderToSlotDto) {
    const slot = await this.findOne(tenantId, slotId);

    if (slot.status !== PreorderSlotStatus.OPEN) {
      throw new BadRequestException('Slot is not open for orders');
    }

    if (slot.currentOrders >= slot.maxOrders) {
      throw new BadRequestException('Slot is full');
    }

    const existingOrder = slot.orders.find((o) => o.orderId === dto.orderId);
    if (existingOrder) {
      throw new ConflictException('Order already in this slot');
    }

    await this.prisma.preorderSlotOrder.create({
      data: {
        slotId,
        orderId: dto.orderId,
        orderNumber: dto.orderNumber,
        quantity: dto.quantity || 0,
        weight: dto.weight,
      },
    });

    const newCurrentOrders = slot.currentOrders + 1;
    const newCurrentQuantity = slot.currentQuantity + (dto.quantity || 0);
    const newCurrentWeight = slot.currentWeight
      ? Number(slot.currentWeight) + (dto.weight || 0)
      : dto.weight || null;

    let newStatus: PreorderSlotStatus = slot.status;
    if (newCurrentOrders >= slot.maxOrders) {
      newStatus = PreorderSlotStatus.FULL;
    }
    if (slot.maxQuantity && newCurrentQuantity >= slot.maxQuantity) {
      newStatus = PreorderSlotStatus.FULL;
    }
    if (slot.maxWeight && newCurrentWeight && newCurrentWeight >= Number(slot.maxWeight)) {
      newStatus = PreorderSlotStatus.FULL;
    }

    return this.prisma.preorderSlot.update({
      where: { id: slotId },
      data: {
        currentOrders: newCurrentOrders,
        currentQuantity: newCurrentQuantity,
        currentWeight: newCurrentWeight,
        status: newStatus,
      },
      include: {
        orders: true,
      },
    });
  }

  async removeOrder(tenantId: string, slotId: string, orderId: string) {
    const slot = await this.findOne(tenantId, slotId);

    const order = slot.orders.find((o) => o.orderId === orderId);
    if (!order) {
      throw new NotFoundException('Order not found in slot');
    }

    await this.prisma.preorderSlotOrder.delete({
      where: { id: order.id },
    });

    const newCurrentOrders = Math.max(0, slot.currentOrders - 1);
    const newCurrentQuantity = Math.max(0, slot.currentQuantity - order.quantity);
    const newCurrentWeight = slot.currentWeight
      ? Math.max(0, Number(slot.currentWeight) - (Number(order.weight) || 0))
      : null;

    let newStatus = slot.status;
    if (slot.status === PreorderSlotStatus.FULL && newCurrentOrders < slot.maxOrders) {
      newStatus = PreorderSlotStatus.OPEN;
    }

    return this.prisma.preorderSlot.update({
      where: { id: slotId },
      data: {
        currentOrders: newCurrentOrders,
        currentQuantity: newCurrentQuantity,
        currentWeight: newCurrentWeight,
        status: newStatus,
      },
      include: {
        orders: true,
      },
    });
  }

  async close(tenantId: string, id: string, userId: string) {
    const slot = await this.findOne(tenantId, id);

    if (slot.status === PreorderSlotStatus.COMPLETED) {
      throw new ConflictException('Slot is already completed');
    }

    return this.prisma.preorderSlot.update({
      where: { id },
      data: {
        status: PreorderSlotStatus.CLOSED,
        closedAt: new Date(),
        closedById: userId,
      },
    });
  }

  async complete(tenantId: string, id: string) {
    const slot = await this.findOne(tenantId, id);

    return this.prisma.preorderSlot.update({
      where: { id },
      data: {
        status: PreorderSlotStatus.COMPLETED,
      },
    });
  }

  async generateSlots(tenantId: string, dto: GenerateSlotsDto) {
    const startDate = new Date(dto.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dto.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const excludeWeekdays = new Set(dto.excludeWeekdays || []);
    const createdSlots = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      if (!excludeWeekdays.has(dayOfWeek)) {
        const existing = await this.findByDate(tenantId, currentDate);

        if (!existing) {
          const slot = await this.prisma.preorderSlot.create({
            data: {
              tenantId,
              slotDate: new Date(currentDate),
              maxOrders: dto.maxOrders ?? 50,
              closeBeforeDays: dto.closeBeforeDays ?? 2,
              status: PreorderSlotStatus.OPEN,
            },
          });
          createdSlots.push(slot);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      created: createdSlots.length,
      slots: createdSlots,
    };
  }

  async autoCloseExpiredSlots(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slots = await this.prisma.preorderSlot.findMany({
      where: {
        tenantId,
        status: PreorderSlotStatus.OPEN,
      },
    });

    const closedSlots = [];

    for (const slot of slots) {
      const closeDate = new Date(slot.slotDate);
      closeDate.setDate(closeDate.getDate() - slot.closeBeforeDays);

      if (today >= closeDate) {
        await this.prisma.preorderSlot.update({
          where: { id: slot.id },
          data: {
            status: PreorderSlotStatus.CLOSED,
            closedAt: new Date(),
          },
        });
        closedSlots.push(slot);
      }
    }

    return {
      closed: closedSlots.length,
      slots: closedSlots,
    };
  }
}
