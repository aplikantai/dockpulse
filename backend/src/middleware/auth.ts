import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/express.js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

/**
 * Middleware do weryfikacji JWT z httpOnly cookie
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Czytaj token z COOKIE (nie z header Authorization!)
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'NO_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
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

/**
 * Opcjonalna autentykacja - nie blokuje requestu
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.access_token;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded;
    } catch {
      // Ignoruj bledne tokeny
    }
  }

  next();
};
