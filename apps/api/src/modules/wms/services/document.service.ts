import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WarehouseDocumentStatus, WarehouseDocumentType } from '@prisma/client';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  ProcessDocumentDto,
} from '../dto/document.dto';
import { EventBusService } from '../../events/event-bus.service';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async findAll(
    tenantId: string,
    options?: {
      type?: WarehouseDocumentType;
      status?: WarehouseDocumentStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { tenantId };

    if (options?.type) where.type = options.type;
    if (options?.status) where.status = options.status;
    if (options?.startDate || options?.endDate) {
      where.documentDate = {};
      if (options.startDate) where.documentDate.gte = options.startDate;
      if (options.endDate) where.documentDate.lte = options.endDate;
    }

    const [documents, total] = await Promise.all([
      this.prisma.warehouseDocument.findMany({
        where,
        include: {
          sourceLocation: true,
          targetLocation: true,
          _count: { select: { items: true } },
        },
        orderBy: { documentDate: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.warehouseDocument.count({ where }),
    ]);

    return { documents, total };
  }

  async findOne(tenantId: string, id: string) {
    const document = await this.prisma.warehouseDocument.findFirst({
      where: { id, tenantId },
      include: {
        sourceLocation: true,
        targetLocation: true,
        items: {
          include: {
            location: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    return document;
  }

  async create(tenantId: string, userId: string, dto: CreateDocumentDto) {
    const documentNumber = await this.generateDocumentNumber(tenantId, dto.type);

    const document = await this.prisma.warehouseDocument.create({
      data: {
        tenantId,
        documentNumber,
        type: dto.type,
        status: WarehouseDocumentStatus.DRAFT,
        sourceLocationId: dto.sourceLocationId,
        targetLocationId: dto.targetLocationId,
        orderId: dto.orderId,
        supplierId: dto.supplierId,
        documentDate: dto.documentDate ? new Date(dto.documentDate) : new Date(),
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        notes: dto.notes,
        externalRef: dto.externalRef,
        deliveryNote: dto.deliveryNote,
        createdById: userId,
        items: dto.items
          ? {
              create: dto.items.map((item, index) => ({
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                locationId: item.locationId,
                expectedQuantity: item.expectedQuantity,
                unit: item.unit || 'szt',
                batchNumber: item.batchNumber,
                serialNumber: item.serialNumber,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
                notes: item.notes,
                sortOrder: item.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        sourceLocation: true,
        targetLocation: true,
        items: true,
      },
    });

    await this.eventBus.emitEvent({
      type: 'wms.document.created',
      tenantId,
      entityType: 'warehouse_document',
      entityId: document.id,
      payload: {
        documentNumber: document.documentNumber,
        type: document.type,
      },
      userId,
    });

    return document;
  }

  async update(tenantId: string, id: string, dto: UpdateDocumentDto) {
    const document = await this.findOne(tenantId, id);

    if (
      document.status === WarehouseDocumentStatus.COMPLETED ||
      document.status === WarehouseDocumentStatus.CANCELLED
    ) {
      throw new ConflictException('Cannot update completed or cancelled document');
    }

    return this.prisma.warehouseDocument.update({
      where: { id },
      data: dto,
      include: {
        sourceLocation: true,
        targetLocation: true,
        items: true,
      },
    });
  }

  async addItem(tenantId: string, documentId: string, item: any) {
    const document = await this.findOne(tenantId, documentId);

    if (document.status !== WarehouseDocumentStatus.DRAFT) {
      throw new ConflictException('Can only add items to draft documents');
    }

    const maxSortOrder = await this.prisma.warehouseDocumentItem.aggregate({
      where: { documentId },
      _max: { sortOrder: true },
    });

    return this.prisma.warehouseDocumentItem.create({
      data: {
        documentId,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        locationId: item.locationId,
        expectedQuantity: item.expectedQuantity,
        unit: item.unit || 'szt',
        batchNumber: item.batchNumber,
        serialNumber: item.serialNumber,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
        notes: item.notes,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
      include: {
        location: true,
      },
    });
  }

  async removeItem(tenantId: string, documentId: string, itemId: string) {
    const document = await this.findOne(tenantId, documentId);

    if (document.status !== WarehouseDocumentStatus.DRAFT) {
      throw new ConflictException('Can only remove items from draft documents');
    }

    return this.prisma.warehouseDocumentItem.delete({
      where: { id: itemId },
    });
  }

  async confirm(tenantId: string, id: string, userId: string) {
    const document = await this.findOne(tenantId, id);

    if (document.status !== WarehouseDocumentStatus.DRAFT) {
      throw new ConflictException('Can only confirm draft documents');
    }

    if (document.items.length === 0) {
      throw new BadRequestException('Cannot confirm document without items');
    }

    const updated = await this.prisma.warehouseDocument.update({
      where: { id },
      data: {
        status: WarehouseDocumentStatus.PENDING,
        confirmedById: userId,
        confirmedAt: new Date(),
      },
      include: {
        sourceLocation: true,
        targetLocation: true,
        items: true,
      },
    });

    await this.eventBus.emitEvent({
      type: 'wms.document.confirmed',
      tenantId,
      entityType: 'warehouse_document',
      entityId: updated.id,
      payload: {
        documentNumber: updated.documentNumber,
        type: updated.type,
      },
      userId,
    });

    return updated;
  }

  async process(tenantId: string, id: string, userId: string, dto: ProcessDocumentDto) {
    const document = await this.findOne(tenantId, id);

    if (
      document.status !== WarehouseDocumentStatus.PENDING &&
      document.status !== WarehouseDocumentStatus.IN_PROGRESS
    ) {
      throw new ConflictException('Document must be pending or in progress to process');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const itemData of dto.items) {
        const item = document.items.find((i) => i.id === itemData.itemId);
        if (!item) {
          throw new NotFoundException(`Item ${itemData.itemId} not found`);
        }

        await tx.warehouseDocumentItem.update({
          where: { id: itemData.itemId },
          data: {
            actualQuantity: itemData.actualQuantity,
            locationId: itemData.locationId || item.locationId,
            batchNumber: itemData.batchNumber || item.batchNumber,
            notes: itemData.notes,
            isProcessed: true,
            processedAt: new Date(),
            processedById: userId,
          },
        });
      }

      const allProcessed = await tx.warehouseDocumentItem.count({
        where: { documentId: id, isProcessed: false },
      });

      await tx.warehouseDocument.update({
        where: { id },
        data: {
          status:
            allProcessed === 0
              ? WarehouseDocumentStatus.COMPLETED
              : WarehouseDocumentStatus.IN_PROGRESS,
          completedAt: allProcessed === 0 ? new Date() : undefined,
        },
      });
    });

    const updated = await this.findOne(tenantId, id);

    if (updated.status === WarehouseDocumentStatus.COMPLETED) {
      await this.eventBus.emitEvent({
        type: 'wms.document.completed',
        tenantId,
        entityType: 'warehouse_document',
        entityId: updated.id,
        payload: {
          documentNumber: updated.documentNumber,
          type: updated.type,
        },
        userId,
      });
    }

    return updated;
  }

  async cancel(tenantId: string, id: string, userId: string, reason?: string) {
    const document = await this.findOne(tenantId, id);

    if (document.status === WarehouseDocumentStatus.COMPLETED) {
      throw new ConflictException('Cannot cancel completed document');
    }

    const updated = await this.prisma.warehouseDocument.update({
      where: { id },
      data: {
        status: WarehouseDocumentStatus.CANCELLED,
        notes: reason ? `${document.notes || ''}\n[ANULOWANO] ${reason}` : document.notes,
      },
    });

    await this.eventBus.emitEvent({
      type: 'wms.document.cancelled',
      tenantId,
      entityType: 'warehouse_document',
      entityId: updated.id,
      payload: {
        documentNumber: updated.documentNumber,
        type: updated.type,
        reason,
      },
      userId,
    });

    return updated;
  }

  private async generateDocumentNumber(
    tenantId: string,
    type: WarehouseDocumentType,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type;

    const lastDocument = await this.prisma.warehouseDocument.findFirst({
      where: {
        tenantId,
        documentNumber: { startsWith: `${prefix}/${year}/` },
      },
      orderBy: { documentNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastDocument) {
      const parts = lastDocument.documentNumber.split('/');
      nextNumber = parseInt(parts[2], 10) + 1;
    }

    return `${prefix}/${year}/${nextNumber.toString().padStart(4, '0')}`;
  }
}
