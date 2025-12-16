import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../../infra/db/prisma.js';
import { audit, AuditAction } from '../../../core/audit/audit.service.js';
import { authenticatePortalUser } from '../middleware/portalAuth.js';

const router = Router();

// Wszystkie endpointy wymagaja auth portal
router.use(authenticatePortalUser);

const createOrderSchema = z.object({
  notes: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
  })).optional(),
});

const addCommentSchema = z.object({
  content: z.string().min(1),
});

/**
 * GET /api/portal/orders - Lista MOICH zamowien
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await req.db.order.findMany({
      where: {
        clientUserId: req.portalUser!.clientUserId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        attachments: {
          where: { isInternal: false }, // Tylko publiczne pliki
        },
        _count: {
          select: {
            comments: {
              where: { isInternal: false },
            },
          },
        },
      },
    });

    res.json({ data: orders });
  } catch (error) {
    console.error('Portal orders list error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/portal/orders/:id - Szczegoly MOJEGO zamowienia
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await req.db.order.findFirst({
      where: {
        id: req.params.id,
        clientUserId: req.portalUser!.clientUserId, // WAZNE: tylko swoje!
      },
      include: {
        items: true,
        attachments: {
          where: { isInternal: false },
        },
        comments: {
          where: { isInternal: false }, // Tylko publiczne komentarze
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Portal order detail error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * POST /api/portal/orders - Utworz nowe zamowienie
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);

    // Wygeneruj numer zamowienia
    const orderNumber = await generateOrderNumber(req.tenant!.tenantId);

    const order = await req.db.order.create({
      data: {
        tenantId: req.tenant!.tenantId,
        clientUserId: req.portalUser!.clientUserId,
        orderNumber,
        status: 'NEW',
        notes: data.notes,
        clientName: req.portalUser!.name,
        clientEmail: req.portalUser!.email,
        items: data.items ? {
          create: data.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: 0, // Do wyceny przez firme
            totalPrice: 0,
          })),
        } : undefined,
        statusHistory: {
          create: {
            toStatus: 'NEW',
          },
        },
      },
      include: { items: true },
    });

    await audit.emit(req, {
      action: AuditAction.PORTAL_ORDER_CREATED,
      entityType: 'Order',
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber },
    });

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Portal order create error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * POST /api/portal/orders/:id/comments - Dodaj komentarz
 */
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const data = addCommentSchema.parse(req.body);

    // Sprawdz czy to moje zamowienie
    const order = await req.db.order.findFirst({
      where: {
        id: req.params.id,
        clientUserId: req.portalUser!.clientUserId,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const comment = await req.db.orderComment.create({
      data: {
        orderId: order.id,
        clientUserId: req.portalUser!.clientUserId,
        content: data.content,
        isInternal: false, // Komentarze klienta sa zawsze publiczne
      },
    });

    await audit.emit(req, {
      action: AuditAction.PORTAL_COMMENT_ADDED,
      entityType: 'Order',
      entityId: order.id,
    });

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Portal comment add error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

/**
 * Generuj unikalny numer zamowienia
 */
async function generateOrderNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  const lastOrder = await prisma.order.findFirst({
    where: {
      tenantId,
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
}

export default router;
