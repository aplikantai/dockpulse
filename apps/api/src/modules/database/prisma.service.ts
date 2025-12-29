import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable({ scope: Scope.DEFAULT })
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _tenantId: string | null = null;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  /**
   * Set tenant context for subsequent queries
   */
  setTenant(tenantId: string) {
    this._tenantId = tenantId;
    return this;
  }

  /**
   * Get current tenant ID
   */
  getTenantId(): string | null {
    return this._tenantId;
  }

  /**
   * Clear tenant context
   */
  clearTenant() {
    this._tenantId = null;
    return this;
  }

  /**
   * Execute a callback with tenant context
   */
  async withTenant<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
    const previousTenantId = this._tenantId;
    try {
      this._tenantId = tenantId;
      return await callback();
    } finally {
      this._tenantId = previousTenantId;
    }
  }

  /**
   * Add tenant filter to where clause
   */
  withTenantFilter<T extends { tenantId?: string }>(where: T = {} as T): T & { tenantId: string } {
    if (!this._tenantId) {
      throw new Error('Tenant context not set. Call setTenant() first.');
    }
    return { ...where, tenantId: this._tenantId };
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /**
   * Clean database for testing
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase can only be used in test environment');
    }

    const tableNames = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;

    for (const { tablename } of tableNames) {
      if (tablename !== '_prisma_migrations') {
        await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      }
    }
  }
}
