import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogOptions {
  tenantId: string;
  userId?: string;
  userName?: string;
  userIp?: string;
  userAgent?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  oldValues?: any;
  newValues?: any;
  changes?: Array<{ field: string; from: any; to: any }>;
  metadata?: any;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(options: AuditLogOptions): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: options.tenantId,
          userId: options.userId,
          userName: options.userName,
          userIp: options.userIp,
          userAgent: options.userAgent,
          action: options.action,
          entityType: options.entityType,
          entityId: options.entityId,
          entityName: options.entityName,
          oldValues: options.oldValues || null,
          newValues: options.newValues || null,
          changes: options.changes || null,
          metadata: options.metadata || null,
        },
      });
    } catch (error) {
      // Log audit errors but don't fail the request
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(
    tenantId: string,
    entityType: string,
    entityId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    tenantId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Get all audit logs with filters
   */
  async getAuditLogs(
    tenantId: string,
    filters?: {
      userId?: string;
      entityType?: string;
      entityId?: string;
      action?: AuditAction;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{
    logs: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where: any = { tenantId };

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;
    if (filters?.action) where.action = filters.action;

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Compare old and new values to generate list of changes
   */
  static generateChanges(
    oldValues: any,
    newValues: any,
  ): Array<{ field: string; from: any; to: any }> {
    const changes: Array<{ field: string; from: any; to: any }> = [];

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]);

    for (const key of allKeys) {
      const oldValue = oldValues?.[key];
      const newValue = newValues?.[key];

      // Skip if values are the same
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        continue;
      }

      changes.push({
        field: key,
        from: oldValue,
        to: newValue,
      });
    }

    return changes;
  }

  /**
   * Helper to extract user info from request
   */
  static getUserInfoFromRequest(request: any): {
    userId?: string;
    userName?: string;
    userIp?: string;
    userAgent?: string;
  } {
    return {
      userId: request.user?.userId || request.user?.id,
      userName: request.user?.name || request.user?.email,
      userIp:
        request.ip ||
        request.headers['x-forwarded-for'] ||
        request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
    };
  }
}
