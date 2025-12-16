import { Request } from 'express';
import { prisma } from '../../infra/db/prisma.js';

/**
 * Akcje audytu - enum dla type safety
 */
export enum AuditAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',

  // Orders
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_DELETED = 'ORDER_DELETED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_ASSIGNED = 'ORDER_ASSIGNED',

  // Customers
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED = 'CUSTOMER_DELETED',

  // Products
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',

  // Files
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DELETED = 'FILE_DELETED',

  // Settings
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',

  // Users/Membership
  USER_INVITED = 'USER_INVITED',
  USER_REMOVED = 'USER_REMOVED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',

  // Portal/Client
  CLIENT_REGISTERED = 'CLIENT_REGISTERED',
  CLIENT_LOGIN = 'CLIENT_LOGIN',
  CLIENT_LOGOUT = 'CLIENT_LOGOUT',
  PORTAL_ORDER_CREATED = 'PORTAL_ORDER_CREATED',
  PORTAL_COMMENT_ADDED = 'PORTAL_COMMENT_ADDED',
  PORTAL_FILE_UPLOADED = 'PORTAL_FILE_UPLOADED',

  // Data export
  DATA_EXPORTED = 'DATA_EXPORTED',
}

interface AuditPayload {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit service - logowanie wszystkich waznych akcji
 * NIGDY nie loguj PII (telefon, email, haslo)
 */
export const audit = {
  /**
   * Emituj event audytu
   */
  async emit(req: Request, payload: AuditPayload): Promise<void> {
    try {
      if (!req.tenant?.tenantId) {
        console.warn('Audit: missing tenant context');
        return;
      }

      // Redakcja PII z metadata
      const safeMetadata = redactPII(payload.metadata || {});

      await prisma.auditEvent.create({
        data: {
          tenantId: req.tenant.tenantId,
          userId: req.user?.userId || req.portalUser?.clientUserId || null,
          action: payload.action,
          entityType: payload.entityType || null,
          entityId: payload.entityId || null,
          metadata: safeMetadata,
          ipAddress: getClientIP(req),
          userAgent: req.get('user-agent')?.substring(0, 500) || null,
        },
      });
    } catch (error) {
      // Audit failure nie powinien blokować operacji
      console.error('Audit emit error:', error);
    }
  },

  /**
   * Pobierz historie dla encji
   */
  async getEntityHistory(
    tenantId: string,
    entityType: string,
    entityId: string,
    limit = 100
  ) {
    return prisma.auditEvent.findMany({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Pobierz ostatnie wydarzenia (dashboard)
   */
  async getRecent(tenantId: string, limit = 50) {
    return prisma.auditEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Pobierz wydarzenia po akcji
   */
  async getByAction(tenantId: string, action: AuditAction, limit = 50) {
    return prisma.auditEvent.findMany({
      where: { tenantId, action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};

/**
 * Usuwa PII z metadata
 */
function redactPII(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'phone',
    'email',
    'password',
    'token',
    'telefon',
    'haslo',
    'nazwisko',
    'clientPhone',
    'clientEmail',
    'clientName',
    'passwordHash',
    'secret',
    'apiKey',
  ];

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redactPII(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Pobiera IP klienta (za proxy)
 */
function getClientIP(req: Request): string | null {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || null;
}

export default audit;
