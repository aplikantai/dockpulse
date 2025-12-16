import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  portalAuthService,
  setPortalAuthCookies,
  clearPortalAuthCookies,
} from './portal-auth.service.js';
import { audit, AuditAction } from '../../../core/audit/audit.service.js';
import { authRateLimiter } from '../../../middleware/rateLimiter.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  company: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/portal/auth/register
 */
router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({ error: 'Tenant required' });
    }

    const data = registerSchema.parse(req.body);
    const { user, tokens } = await portalAuthService.register(req.tenant.tenantId, data);

    setPortalAuthCookies(res, tokens);

    await audit.emit(req, {
      action: AuditAction.CLIENT_REGISTERED,
      entityType: 'ClientUser',
      entityId: user.id,
    });

    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error instanceof Error && error.message === 'Email already registered') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.error('Portal register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/portal/auth/login
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({ error: 'Tenant required' });
    }

    const data = loginSchema.parse(req.body);
    const { user, tokens } = await portalAuthService.login(
      req.tenant.tenantId,
      data.email,
      data.password
    );

    setPortalAuthCookies(res, tokens);

    await audit.emit(req, {
      action: AuditAction.CLIENT_LOGIN,
      entityType: 'ClientUser',
      entityId: user.id,
    });

    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    await audit.emit(req, {
      action: AuditAction.LOGIN_FAILED,
      metadata: { type: 'portal', reason: 'invalid_credentials' },
    });

    res.status(401).json({ error: 'Invalid credentials' });
  }
});

/**
 * POST /api/portal/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.portal_refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const tokens = await portalAuthService.refresh(refreshToken);
    setPortalAuthCookies(res, tokens);

    res.json({ success: true });
  } catch (error) {
    clearPortalAuthCookies(res);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /api/portal/auth/logout
 */
router.post('/logout', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.portal_refresh_token;

  if (refreshToken) {
    await portalAuthService.logout(refreshToken);
  }

  if (req.portalUser) {
    await audit.emit(req, {
      action: AuditAction.CLIENT_LOGOUT,
      entityType: 'ClientUser',
      entityId: req.portalUser.clientUserId,
    });
  }

  clearPortalAuthCookies(res);
  res.json({ success: true });
});

export default router;
