import { Request, Response, NextFunction } from 'express';
import { TenantRole } from '@prisma/client';
import { prisma } from '../infra/db/prisma.js';

/**
 * Middleware wymagajacy membership w tenant
 * Sprawdza czy zalogowany user ma aktywne membership w biezacym tenancie
 */
export const requireMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.tenant) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Sprawdz czy user ma membership w tym tenancie
    const membership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: req.user.userId,
          tenantId: req.tenant.tenantId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      return res.status(403).json({
        error: 'No access to this organization',
        code: 'NO_MEMBERSHIP',
      });
    }

    // Dodaj membership do requestu
    req.membership = {
      id: membership.id,
      role: membership.role,
      permissions: membership.permissions,
      isActive: membership.isActive,
    };

    next();
  } catch (error) {
    console.error('Membership check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Factory middleware wymagajacy okreslonej roli
 */
export const requireRole = (...roles: TenantRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.membership) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.membership.role)) {
      return res.status(403).json({
        error: 'Insufficient role',
        required: roles,
        current: req.membership.role,
      });
    }

    next();
  };
};

/**
 * Factory middleware wymagajacy okreslonego uprawnienia
 * Owner/Admin maja automatycznie wszystkie uprawnienia
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.membership) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Owner/Admin maja wszystkie uprawnienia
    if (['OWNER', 'ADMIN'].includes(req.membership.role)) {
      return next();
    }

    if (!req.membership.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Missing permission',
        required: permission,
      });
    }

    next();
  };
};

/**
 * Helper: role hierarchia (OWNER > ADMIN > MANAGER > MEMBER)
 */
export const roleHierarchy: Record<TenantRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  MEMBER: 1,
};

/**
 * Sprawdza czy rola A jest >= rola B
 */
export const hasHigherOrEqualRole = (
  roleA: TenantRole,
  roleB: TenantRole
): boolean => {
  return roleHierarchy[roleA] >= roleHierarchy[roleB];
};
