import { Router, Request, Response } from 'express';
import { audit } from '../../core/audit/audit.service.js';
import { requireMembership, requireRole } from '../../middleware/rbac.js';
import { prisma } from '../../infra/db/prisma.js';

const router = Router();

// Wszystkie endpointy wymagaja membership + rola OWNER/ADMIN
router.use(requireMembership);
router.use(requireRole('OWNER', 'ADMIN'));

/**
 * GET /api/audit - Lista eventow audytu
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, action, entityType } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      tenantId: req.tenant!.tenantId,
      ...(action && { action: action as string }),
      ...(entityType && { entityType: entityType as string }),
    };

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    res.json({
      data: events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Audit list error:', error);
    res.status(500).json({ error: 'Failed to fetch audit events' });
  }
});

/**
 * GET /api/audit/entity/:type/:id - Historia konkretnej encji
 */
router.get('/entity/:type/:id', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;

    const events = await audit.getEntityHistory(
      req.tenant!.tenantId,
      type,
      id
    );

    res.json({ data: events });
  } catch (error) {
    console.error('Audit entity history error:', error);
    res.status(500).json({ error: 'Failed to fetch entity history' });
  }
});

/**
 * GET /api/audit/recent - Ostatnie wydarzenia (dashboard)
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const events = await audit.getRecent(
      req.tenant!.tenantId,
      Math.min(100, parseInt(limit as string))
    );

    res.json({ data: events });
  } catch (error) {
    console.error('Audit recent error:', error);
    res.status(500).json({ error: 'Failed to fetch recent events' });
  }
});

export default router;
