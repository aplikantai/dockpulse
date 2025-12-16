import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderStatus, OrderPriority } from '@prisma/client';
import { ordersService } from './orders.service.js';

const createOrderSchema = z.object({
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientCompany: z.string().optional(),
  notes: z.string().optional(),
  priority: z.nativeEnum(OrderPriority).optional(),
  dueDate: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0).optional(),
    notes: z.string().optional(),
  })).optional(),
});

const updateOrderSchema = z.object({
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  priority: z.nativeEnum(OrderPriority).optional(),
  dueDate: z.string().datetime().nullable().optional().transform((v) => v ? new Date(v) : null),
  assignedToId: z.string().uuid().nullable().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  reason: z.string().optional(),
});

const addCommentSchema = z.object({
  content: z.string().min(1),
  isInternal: z.boolean().optional(),
});

export const ordersController = {
  /**
   * GET /api/orders
   */
  async findAll(req: Request, res: Response) {
    try {
      const { status, page, limit } = req.query;

      const result = await ordersService.findAll(req, {
        status: status as OrderStatus | undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(result);
    } catch (error) {
      console.error('Orders findAll error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  },

  /**
   * GET /api/orders/:id
   */
  async findById(req: Request, res: Response) {
    try {
      const order = await ordersService.findById(req, req.params.id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Orders findById error:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  },

  /**
   * POST /api/orders
   */
  async create(req: Request, res: Response) {
    try {
      const data = createOrderSchema.parse(req.body);
      const order = await ordersService.create(req, data);

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      console.error('Orders create error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  },

  /**
   * PUT /api/orders/:id
   */
  async update(req: Request, res: Response) {
    try {
      const data = updateOrderSchema.parse(req.body);
      const order = await ordersService.update(req, req.params.id, data);

      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      console.error('Orders update error:', error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  },

  /**
   * PATCH /api/orders/:id/status
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const data = updateStatusSchema.parse(req.body);
      const order = await ordersService.updateStatus(
        req,
        req.params.id,
        data.status,
        data.reason
      );

      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      console.error('Orders updateStatus error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  },

  /**
   * PATCH /api/orders/:id/assign
   */
  async assign(req: Request, res: Response) {
    try {
      const { assignedToId } = req.body;
      const order = await ordersService.assign(req, req.params.id, assignedToId);

      res.json(order);
    } catch (error) {
      console.error('Orders assign error:', error);
      res.status(500).json({ error: 'Failed to assign order' });
    }
  },

  /**
   * DELETE /api/orders/:id
   */
  async delete(req: Request, res: Response) {
    try {
      await ordersService.delete(req, req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Orders delete error:', error);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  },

  /**
   * POST /api/orders/:id/comments
   */
  async addComment(req: Request, res: Response) {
    try {
      const data = addCommentSchema.parse(req.body);
      const comment = await ordersService.addComment(
        req,
        req.params.id,
        data.content,
        data.isInternal
      );

      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      console.error('Orders addComment error:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  },
};

export default ordersController;
