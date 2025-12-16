import { Request, Response } from 'express';
import { z } from 'zod';
import { authService, setAuthCookies, clearAuthCookies } from '../../core/auth/auth.service.js';
import { audit, AuditAction } from '../../core/audit/audit.service.js';
import { prisma } from '../../infra/db/prisma.js';

const loginSchema = z.object({
  phone: z.string().min(9).max(15),
  password: z.string().min(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

export const authController = {
  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const { user, tokens } = await authService.login(data.phone, data.password);

      // Ustaw cookies
      setAuthCookies(res, tokens);

      // Audit: udane logowanie
      await audit.emit(req, {
        action: AuditAction.LOGIN,
        metadata: { loginMethod: 'phone' },
      });

      // Odpowiedz BEZ tokenow (sa w cookies)
      res.json({
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
        },
      });
    } catch (error) {
      // Audit: nieudane logowanie
      await audit.emit(req, {
        action: AuditAction.LOGIN_FAILED,
        metadata: { reason: 'invalid_credentials' },
      });

      res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }
  },

  /**
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'No refresh token',
          code: 'NO_REFRESH_TOKEN',
        });
      }

      const tokens = await authService.refresh(refreshToken);

      // Rotation: nowe cookies
      setAuthCookies(res, tokens);

      res.json({ success: true });
    } catch (error) {
      // Clear invalid cookies
      clearAuthCookies(res);

      res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Audit
    if (req.user) {
      await audit.emit(req, {
        action: AuditAction.LOGOUT,
      });
    }

    clearAuthCookies(res);
    res.json({ success: true });
  },

  /**
   * GET /api/auth/me
   */
  async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Pobierz membership dla biezacego tenanta (jesli jest)
    let membership = null;
    if (req.tenant) {
      const m = await prisma.membership.findUnique({
        where: {
          userId_tenantId: {
            userId: req.user.userId,
            tenantId: req.tenant.tenantId,
          },
        },
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
              logoUrl: true,
              primaryColor: true,
            },
          },
        },
      });

      if (m) {
        membership = {
          tenantId: m.tenant.id,
          tenantSlug: m.tenant.slug,
          tenantName: m.tenant.name,
          tenantLogo: m.tenant.logoUrl,
          tenantColor: m.tenant.primaryColor,
          role: m.role,
          permissions: m.permissions,
        };
      }
    }

    res.json({ user, membership });
  },

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const data = changePasswordSchema.parse(req.body);

      await authService.changePassword(
        req.user.userId,
        data.currentPassword,
        data.newPassword
      );

      // Audit
      await audit.emit(req, {
        action: AuditAction.PASSWORD_CHANGED,
      });

      // Clear cookies (wylogowanie)
      clearAuthCookies(res);

      res.json({
        success: true,
        message: 'Password changed. Please login again.',
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to change password',
      });
    }
  },

  /**
   * GET /api/auth/memberships
   * Lista wszystkich tenantow do ktorych user nalezy
   */
  async memberships(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const memberships = await prisma.membership.findMany({
      where: {
        userId: req.user.userId,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            isActive: true,
          },
        },
      },
    });

    res.json({
      data: memberships
        .filter((m) => m.tenant.isActive)
        .map((m) => ({
          tenantId: m.tenant.id,
          tenantSlug: m.tenant.slug,
          tenantName: m.tenant.name,
          tenantLogo: m.tenant.logoUrl,
          tenantColor: m.tenant.primaryColor,
          role: m.role,
        })),
    });
  },
};

export default authController;
