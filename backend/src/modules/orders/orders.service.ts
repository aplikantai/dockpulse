import { Request } from 'express';
import { OrderStatus, OrderPriority } from '@prisma/client';
import { audit, AuditAction } from '../../core/audit/audit.service.js';
import { prisma } from '../../infra/db/prisma.js';

interface CreateOrderDto {
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientCompany?: string;
  notes?: string;
  priority?: OrderPriority;
  dueDate?: Date;
  items?: Array<{
    productId?: string;
    name: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }>;
}

interface UpdateOrderDto {
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
  internalNotes?: string;
  priority?: OrderPriority;
  dueDate?: Date | null;
  assignedToId?: string | null;
}

export const ordersService = {
  /**
   * Pobierz wszystkie zamowienia (z RLS)
   */
  async findAll(req: Request, options?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(options?.status && { status: options.status }),
    };

    const [orders, total] = await Promise.all([
      req.db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: true,
          assignedTo: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
      }),
      req.db.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Pobierz zamowienie po ID
   */
  async findById(req: Request, id: string) {
    return req.db.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        assignedTo: {
          select: { id: true, name: true, phone: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        clientUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  /**
   * Utworz zamowienie
   */
  async create(req: Request, data: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber(req);

    const order = await req.db.order.create({
      data: {
        tenantId: req.tenant!.tenantId,
        orderNumber,
        status: 'NEW',
        priority: data.priority || 'NORMAL',
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        clientCompany: data.clientCompany,
        notes: data.notes,
        dueDate: data.dueDate,
        createdById: req.user!.userId,
        items: data.items ? {
          create: data.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
            totalPrice: (item.unitPrice || 0) * item.quantity,
            notes: item.notes,
          })),
        } : undefined,
        statusHistory: {
          create: {
            toStatus: 'NEW',
            changedById: req.user!.userId,
          },
        },
      },
      include: { items: true },
    });

    // Audit
    await audit.emit(req, {
      action: AuditAction.ORDER_CREATED,
      entityType: 'Order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        status: order.status,
        itemCount: data.items?.length || 0,
      },
    });

    return order;
  },

  /**
   * Aktualizuj zamowienie
   */
  async update(req: Request, id: string, data: UpdateOrderDto) {
    const order = await req.db.order.update({
      where: { id },
      data: {
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        notes: data.notes,
        internalNotes: data.internalNotes,
        priority: data.priority,
        dueDate: data.dueDate,
        assignedToId: data.assignedToId,
      },
      include: { items: true },
    });

    // Audit
    await audit.emit(req, {
      action: AuditAction.ORDER_UPDATED,
      entityType: 'Order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        updatedFields: Object.keys(data),
      },
    });

    return order;
  },

  /**
   * Zmien status zamowienia
   */
  async updateStatus(
    req: Request,
    id: string,
    newStatus: OrderStatus,
    reason?: string
  ) {
    const order = await req.db.order.findUnique({ where: { id } });
    if (!order) throw new Error('Order not found');

    const oldStatus = order.status;

    const updated = await req.db.order.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
        statusHistory: {
          create: {
            fromStatus: oldStatus,
            toStatus: newStatus,
            changedById: req.user?.userId,
            reason,
          },
        },
      },
    });

    // Audit
    await audit.emit(req, {
      action: AuditAction.ORDER_STATUS_CHANGED,
      entityType: 'Order',
      entityId: id,
      metadata: {
        orderNumber: updated.orderNumber,
        fromStatus: oldStatus,
        toStatus: newStatus,
        reason,
      },
    });

    return updated;
  },

  /**
   * Przypisz zamowienie do pracownika
   */
  async assign(req: Request, id: string, assignedToId: string | null) {
    const order = await req.db.order.update({
      where: { id },
      data: { assignedToId },
    });

    // Audit
    await audit.emit(req, {
      action: AuditAction.ORDER_ASSIGNED,
      entityType: 'Order',
      entityId: id,
      metadata: {
        orderNumber: order.orderNumber,
        assignedToId,
      },
    });

    return order;
  },

  /**
   * Usun zamowienie
   */
  async delete(req: Request, id: string) {
    const order = await req.db.order.findUnique({ where: { id } });

    await req.db.order.delete({ where: { id } });

    // Audit
    await audit.emit(req, {
      action: AuditAction.ORDER_DELETED,
      entityType: 'Order',
      entityId: id,
      metadata: {
        orderNumber: order?.orderNumber,
      },
    });
  },

  /**
   * Dodaj komentarz
   */
  async addComment(
    req: Request,
    orderId: string,
    content: string,
    isInternal = false
  ) {
    return req.db.orderComment.create({
      data: {
        orderId,
        userId: req.user!.userId,
        content,
        isInternal,
      },
    });
  },

  /**
   * Generuj unikalny numer zamowienia
   */
  async generateOrderNumber(req: Request): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    // Znajdz ostatni numer w tym roku
    const lastOrder = await prisma.order.findFirst({
      where: {
        tenantId: req.tenant!.tenantId,
        orderNumber: { startsWith: prefix },
      },
      orderBy: { orderNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastOrder) {
      const lastNumberStr = lastOrder.orderNumber.replace(prefix, '');
      nextNumber = parseInt(lastNumberStr, 10) + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  },
};

export default ordersService;
