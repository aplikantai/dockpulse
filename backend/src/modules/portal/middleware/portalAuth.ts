import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../infra/db/prisma.js';
import { PortalUser } from '../../../types/express.js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

interface PortalJwtPayload {
  clientUserId: string;
  tenantId: string;
  email: string;
  type: 'portal';
}

/**
 * Middleware do autentykacji uzytkownikow portalu
 */
export const authenticatePortalUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.portal_access_token;

  if (!token) {
    return res.status(401).json({
      error: 'Portal authentication required',
      code: 'NO_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as PortalJwtPayload;

    // Sprawdz czy tenant sie zgadza
    if (decoded.tenantId !== req.tenant?.tenantId) {
      return res.status(403).json({
        error: 'Invalid tenant',
        code: 'TENANT_MISMATCH',
      });
    }

    // Pobierz dane uzytkownika
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: decoded.clientUserId },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        isActive: true,
      },
    });

    if (!clientUser || !clientUser.isActive) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'USER_INACTIVE',
      });
    }

    req.portalUser = {
      clientUserId: clientUser.id,
      email: clientUser.email,
      name: clientUser.name,
      tenantId: clientUser.tenantId,
    } satisfies PortalUser;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};

export default authenticatePortalUser;
