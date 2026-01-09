import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
  MeasurementItemDto,
  UpdateMeasurementItemDto,
} from './dto';

@Injectable()
export class MeasurementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters?: { orderId?: string; technicianId?: string; status?: string }) {
    return this.prisma.measurement.findMany({
      where: {
        tenantId,
        ...(filters?.orderId && { orderId: filters.orderId }),
        ...(filters?.technicianId && { technicianId: filters.technicianId }),
        ...(filters?.status && { status: filters.status as any }),
      },
      include: {
        order: {
          select: { id: true, orderNumber: true, customer: { select: { name: true } } },
        },
        technician: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const measurement = await this.prisma.measurement.findFirst({
      where: { id, tenantId },
      include: {
        order: {
          select: { id: true, orderNumber: true, customer: true },
        },
        technician: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!measurement) {
      throw new NotFoundException(`Measurement with ID ${id} not found`);
    }

    return measurement;
  }

  async create(tenantId: string, dto: CreateMeasurementDto) {
    // Verify order exists and belongs to tenant
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    // Verify technician exists and belongs to tenant
    const technician = await this.prisma.user.findFirst({
      where: { id: dto.technicianId, tenantId },
    });

    if (!technician) {
      throw new NotFoundException(`Technician with ID ${dto.technicianId} not found`);
    }

    return this.prisma.measurement.create({
      data: {
        tenantId,
        orderId: dto.orderId,
        technicianId: dto.technicianId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        notes: dto.notes,
        status: 'SCHEDULED',
      },
      include: {
        order: { select: { orderNumber: true } },
        technician: { select: { name: true } },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateMeasurementDto) {
    await this.findOne(tenantId, id);

    return this.prisma.measurement.update({
      where: { id },
      data: {
        ...(dto.technicianId && { technicianId: dto.technicianId }),
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const measurement = await this.findOne(tenantId, id);

    if (measurement.status === 'COMPLETED') {
      throw new BadRequestException('Cannot delete a completed measurement');
    }

    return this.prisma.measurement.delete({
      where: { id },
    });
  }

  // Status transitions
  async start(tenantId: string, id: string) {
    const measurement = await this.findOne(tenantId, id);

    if (measurement.status !== 'SCHEDULED') {
      throw new BadRequestException('Measurement must be in SCHEDULED status to start');
    }

    return this.prisma.measurement.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  async complete(tenantId: string, id: string) {
    const measurement = await this.findOne(tenantId, id);

    if (measurement.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Measurement must be in IN_PROGRESS status to complete');
    }

    return this.prisma.measurement.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async cancel(tenantId: string, id: string) {
    const measurement = await this.findOne(tenantId, id);

    if (measurement.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed measurement');
    }

    return this.prisma.measurement.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  // Items
  async getItems(tenantId: string, measurementId: string) {
    await this.findOne(tenantId, measurementId);

    return this.prisma.measurementItem.findMany({
      where: { measurementId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async addItem(tenantId: string, measurementId: string, dto: MeasurementItemDto) {
    await this.findOne(tenantId, measurementId);

    return this.prisma.measurementItem.create({
      data: {
        measurementId,
        ...dto,
      },
    });
  }

  async updateItem(
    tenantId: string,
    measurementId: string,
    itemId: string,
    dto: UpdateMeasurementItemDto,
  ) {
    await this.findOne(tenantId, measurementId);

    const item = await this.prisma.measurementItem.findFirst({
      where: { id: itemId, measurementId },
    });

    if (!item) {
      throw new NotFoundException(`Measurement item with ID ${itemId} not found`);
    }

    return this.prisma.measurementItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async removeItem(tenantId: string, measurementId: string, itemId: string) {
    await this.findOne(tenantId, measurementId);

    const item = await this.prisma.measurementItem.findFirst({
      where: { id: itemId, measurementId },
    });

    if (!item) {
      throw new NotFoundException(`Measurement item with ID ${itemId} not found`);
    }

    return this.prisma.measurementItem.delete({
      where: { id: itemId },
    });
  }

  // Photos
  async addPhotos(tenantId: string, id: string, photos: string[]) {
    const measurement = await this.findOne(tenantId, id);

    return this.prisma.measurement.update({
      where: { id },
      data: {
        photos: [...measurement.photos, ...photos],
      },
    });
  }

  async removePhoto(tenantId: string, id: string, photoUrl: string) {
    const measurement = await this.findOne(tenantId, id);

    return this.prisma.measurement.update({
      where: { id },
      data: {
        photos: measurement.photos.filter((p) => p !== photoUrl),
      },
    });
  }

  // Calendar view
  async getCalendar(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.measurement.findMany({
      where: {
        tenantId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        order: {
          select: { orderNumber: true, customer: { select: { name: true, phone: true } } },
        },
        technician: {
          select: { id: true, name: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  // By technician
  async getByTechnician(tenantId: string, technicianId: string) {
    return this.prisma.measurement.findMany({
      where: {
        tenantId,
        technicianId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        order: {
          select: { orderNumber: true, customer: { select: { name: true, phone: true, address: true } } },
        },
        items: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
