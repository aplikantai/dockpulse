import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate limiter per tenant (nie per IP)
 * Zapobiega nadmiernemu obciazeniu pojedynczego tenanta
 */
export const tenantRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minuta
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 req/min per tenant
  keyGenerator: (req: Request) => {
    // Klucz = tenant ID (nie IP!)
    return req.tenant?.tenantId || req.ip || 'unknown';
  },
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Nie limituj health check
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Bardziej restrykcyjny limiter dla auth endpoints
 * Zapobiega brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 10, // 10 prob logowania na 15 min
  keyGenerator: (req: Request) => {
    // Klucz = tenant + IP (lub phone jesli podany)
    const tenantPart = req.tenant?.tenantId || 'global';
    const identifier = req.body?.phone || req.ip || 'unknown';
    return `${tenantPart}:${identifier}`;
  },
  message: {
    error: 'Too many login attempts',
    message: 'Please try again in 15 minutes',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter dla uploadu plikow
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 20, // 20 uploadow na minute per tenant
  keyGenerator: (req: Request) => {
    return req.tenant?.tenantId || req.ip || 'unknown';
  },
  message: {
    error: 'Too many uploads',
    message: 'Please try again later',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
});

export default tenantRateLimiter;
