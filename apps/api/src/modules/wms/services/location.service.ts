import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WarehouseLocationType } from '@prisma/client';
import { CreateLocationDto, UpdateLocationDto } from '../dto/location.dto';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, options?: {
    type?: WarehouseLocationType;
    parentId?: string | null;
    isActive?: boolean;
  }) {
    const where: any = { tenantId };

    if (options?.type) where.type = options.type;
    if (options?.parentId !== undefined) where.parentId = options.parentId;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    return this.prisma.warehouseLocation.findMany({
      where,
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            containers: true,
            documentItems: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findTree(tenantId: string) {
    const rootLocations = await this.prisma.warehouseLocation.findMany({
      where: { tenantId, parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              include: {
                children: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return rootLocations;
  }

  async findOne(tenantId: string, id: string) {
    const location = await this.prisma.warehouseLocation.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        containers: {
          where: { isActive: true },
          take: 10,
        },
        _count: {
          select: {
            containers: true,
            documentItems: true,
            inventories: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location ${id} not found`);
    }

    return location;
  }

  async findByBarcode(tenantId: string, barcode: string) {
    const location = await this.prisma.warehouseLocation.findFirst({
      where: { tenantId, barcode },
      include: {
        parent: true,
        containers: {
          where: { isActive: true },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with barcode ${barcode} not found`);
    }

    return location;
  }

  async create(tenantId: string, dto: CreateLocationDto) {
    const existing = await this.prisma.warehouseLocation.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });

    if (existing) {
      throw new ConflictException(`Location with code ${dto.code} already exists`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.warehouseLocation.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent location ${dto.parentId} not found`);
      }
    }

    return this.prisma.warehouseLocation.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        type: dto.type || WarehouseLocationType.BIN,
        parentId: dto.parentId,
        barcode: dto.barcode,
        widthCm: dto.widthCm,
        heightCm: dto.heightCm,
        depthCm: dto.depthCm,
        maxWeight: dto.maxWeight,
        maxItems: dto.maxItems,
        isPickable: dto.isPickable ?? true,
        isReceivable: dto.isReceivable ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        parent: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateLocationDto) {
    const location = await this.findOne(tenantId, id);

    if (dto.code && dto.code !== location.code) {
      const existing = await this.prisma.warehouseLocation.findUnique({
        where: { tenantId_code: { tenantId, code: dto.code } },
      });
      if (existing) {
        throw new ConflictException(`Location with code ${dto.code} already exists`);
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException('Location cannot be its own parent');
      }
      const parent = await this.prisma.warehouseLocation.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent location ${dto.parentId} not found`);
      }
    }

    return this.prisma.warehouseLocation.update({
      where: { id },
      data: dto,
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const location = await this.findOne(tenantId, id);

    const hasChildren = await this.prisma.warehouseLocation.count({
      where: { parentId: id, isActive: true },
    });

    if (hasChildren > 0) {
      throw new ConflictException('Cannot delete location with active children');
    }

    const hasContainers = await this.prisma.container.count({
      where: { locationId: id, isActive: true },
    });

    if (hasContainers > 0) {
      throw new ConflictException('Cannot delete location with containers');
    }

    return this.prisma.warehouseLocation.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async generateBarcode(tenantId: string, id: string): Promise<string> {
    const location = await this.findOne(tenantId, id);

    const barcode = `LOC-${location.code}-${Date.now().toString(36).toUpperCase()}`;

    await this.prisma.warehouseLocation.update({
      where: { id },
      data: { barcode },
    });

    return barcode;
  }
}
