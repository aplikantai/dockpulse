import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ContainerStatus, ContainerType } from '@prisma/client';
import {
  CreateContainerDto,
  UpdateContainerDto,
  AddContainerContentDto,
  RemoveContainerContentDto,
} from '../dto/container.dto';

@Injectable()
export class ContainerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    options?: {
      type?: ContainerType;
      status?: ContainerStatus;
      locationId?: string;
      orderId?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { tenantId };

    if (options?.type) where.type = options.type;
    if (options?.status) where.status = options.status;
    if (options?.locationId) where.locationId = options.locationId;
    if (options?.orderId) where.orderId = options.orderId;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    const [containers, total] = await Promise.all([
      this.prisma.container.findMany({
        where,
        include: {
          location: true,
          _count: { select: { contents: true } },
        },
        orderBy: { code: 'asc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.container.count({ where }),
    ]);

    return { containers, total };
  }

  async findOne(tenantId: string, id: string) {
    const container = await this.prisma.container.findFirst({
      where: { id, tenantId },
      include: {
        location: true,
        contents: {
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    if (!container) {
      throw new NotFoundException(`Container ${id} not found`);
    }

    return container;
  }

  async findByBarcode(tenantId: string, barcode: string) {
    const container = await this.prisma.container.findFirst({
      where: { tenantId, barcode },
      include: {
        location: true,
        contents: true,
      },
    });

    if (!container) {
      throw new NotFoundException(`Container with barcode ${barcode} not found`);
    }

    return container;
  }

  async create(tenantId: string, dto: CreateContainerDto) {
    const existing = await this.prisma.container.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });

    if (existing) {
      throw new ConflictException(`Container with code ${dto.code} already exists`);
    }

    if (dto.locationId) {
      const location = await this.prisma.warehouseLocation.findFirst({
        where: { id: dto.locationId, tenantId },
      });
      if (!location) {
        throw new NotFoundException(`Location ${dto.locationId} not found`);
      }
    }

    return this.prisma.container.create({
      data: {
        tenantId,
        code: dto.code,
        barcode: dto.barcode,
        type: dto.type || ContainerType.BIN,
        status: ContainerStatus.EMPTY,
        locationId: dto.locationId,
        widthCm: dto.widthCm,
        heightCm: dto.heightCm,
        depthCm: dto.depthCm,
        maxWeight: dto.maxWeight,
        maxItems: dto.maxItems,
        orderId: dto.orderId,
        customerId: dto.customerId,
        isReusable: dto.isReusable ?? true,
        notes: dto.notes,
        color: dto.color,
      },
      include: {
        location: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateContainerDto) {
    const container = await this.findOne(tenantId, id);

    if (dto.code && dto.code !== container.code) {
      const existing = await this.prisma.container.findUnique({
        where: { tenantId_code: { tenantId, code: dto.code } },
      });
      if (existing) {
        throw new ConflictException(`Container with code ${dto.code} already exists`);
      }
    }

    if (dto.locationId) {
      const location = await this.prisma.warehouseLocation.findFirst({
        where: { id: dto.locationId, tenantId },
      });
      if (!location) {
        throw new NotFoundException(`Location ${dto.locationId} not found`);
      }
    }

    return this.prisma.container.update({
      where: { id },
      data: {
        ...dto,
        lastUsedAt: new Date(),
      },
      include: {
        location: true,
        contents: true,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const container = await this.findOne(tenantId, id);

    if (container.contents.length > 0) {
      throw new ConflictException('Cannot delete container with contents');
    }

    return this.prisma.container.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addContent(tenantId: string, id: string, userId: string, dto: AddContainerContentDto) {
    const container = await this.findOne(tenantId, id);

    if (!container.isActive) {
      throw new BadRequestException('Container is not active');
    }

    if (container.maxItems && container.currentItems + dto.quantity > container.maxItems) {
      throw new BadRequestException('Container capacity exceeded');
    }

    const existingContent = await this.prisma.containerContent.findFirst({
      where: {
        containerId: id,
        productId: dto.productId,
        batchNumber: dto.batchNumber || null,
      },
    });

    if (existingContent) {
      await this.prisma.containerContent.update({
        where: { id: existingContent.id },
        data: {
          quantity: existingContent.quantity + dto.quantity,
        },
      });
    } else {
      await this.prisma.containerContent.create({
        data: {
          containerId: id,
          productId: dto.productId,
          productName: dto.productName,
          productSku: dto.productSku,
          quantity: dto.quantity,
          unit: dto.unit || 'szt',
          batchNumber: dto.batchNumber,
          serialNumber: dto.serialNumber,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          addedById: userId,
        },
      });
    }

    const newTotalItems = await this.prisma.containerContent.aggregate({
      where: { containerId: id },
      _sum: { quantity: true },
    });

    const newStatus = this.calculateContainerStatus(
      newTotalItems._sum.quantity || 0,
      container.maxItems,
    );

    return this.prisma.container.update({
      where: { id },
      data: {
        currentItems: newTotalItems._sum.quantity || 0,
        status: newStatus,
        lastUsedAt: new Date(),
      },
      include: {
        location: true,
        contents: true,
      },
    });
  }

  async removeContent(tenantId: string, id: string, dto: RemoveContainerContentDto) {
    const container = await this.findOne(tenantId, id);

    const content = await this.prisma.containerContent.findFirst({
      where: {
        containerId: id,
        productId: dto.productId,
        batchNumber: dto.batchNumber || null,
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found in container');
    }

    if (content.quantity < dto.quantity) {
      throw new BadRequestException('Not enough quantity in container');
    }

    if (content.quantity === dto.quantity) {
      await this.prisma.containerContent.delete({
        where: { id: content.id },
      });
    } else {
      await this.prisma.containerContent.update({
        where: { id: content.id },
        data: {
          quantity: content.quantity - dto.quantity,
        },
      });
    }

    const newTotalItems = await this.prisma.containerContent.aggregate({
      where: { containerId: id },
      _sum: { quantity: true },
    });

    const newStatus = this.calculateContainerStatus(
      newTotalItems._sum.quantity || 0,
      container.maxItems,
    );

    return this.prisma.container.update({
      where: { id },
      data: {
        currentItems: newTotalItems._sum.quantity || 0,
        status: newStatus,
        lastUsedAt: new Date(),
      },
      include: {
        location: true,
        contents: true,
      },
    });
  }

  async move(tenantId: string, id: string, locationId: string) {
    const container = await this.findOne(tenantId, id);

    const location = await this.prisma.warehouseLocation.findFirst({
      where: { id: locationId, tenantId },
    });

    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }

    return this.prisma.container.update({
      where: { id },
      data: {
        locationId,
        lastUsedAt: new Date(),
      },
      include: {
        location: true,
        contents: true,
      },
    });
  }

  async generateBarcode(tenantId: string, id: string): Promise<string> {
    const container = await this.findOne(tenantId, id);

    const barcode = `CON-${container.code}-${Date.now().toString(36).toUpperCase()}`;

    await this.prisma.container.update({
      where: { id },
      data: { barcode },
    });

    return barcode;
  }

  private calculateContainerStatus(currentItems: number, maxItems?: number | null): ContainerStatus {
    if (currentItems === 0) return ContainerStatus.EMPTY;
    if (!maxItems) return ContainerStatus.PARTIAL;
    if (currentItems >= maxItems) return ContainerStatus.FULL;
    return ContainerStatus.PARTIAL;
  }
}
