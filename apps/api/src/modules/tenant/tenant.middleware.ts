import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../database/prisma.service';
import { TenantContext } from './tenant.interface';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.baseUrl + (req.path || req.url);

    console.log('[TenantMiddleware] Path:', path, 'URL:', req.url, 'BaseURL:', req.baseUrl, 'OriginalUrl:', req.originalUrl);

    // Skip tenant resolution for health checks and public endpoints
    if (
      path === '/health' ||
      path === '/api/health' ||
      path.includes('/health') ||
      path.includes('/api/v1/health') ||
      path === '/api/branding/preview' ||
      path === '/api/branding/health' ||
      path === '/api/settings/ai/models' ||
      path.includes('/branding/preview') ||
      path.includes('/branding/health') ||
      path.includes('/platform/tenants/register') ||
      path.includes('/platform/tenants/check') ||
      path.includes('/platform/auth/login') ||
      path.includes('/platform/modules/available') ||
      path.includes('/platform/tenants/') && path.includes('/modules') ||
      path.includes('/api/docs') || // Swagger
      path.includes('/api-json') || // Swagger JSON
      (path.includes('/api/branding/') && req.method === 'GET') ||
      // Allow GET requests to fetch tenant data by slug (for dashboard)
      (path.includes('/platform/tenants/') && req.method === 'GET' && !path.includes('/modules') && !path.includes('/usage') && !path.includes('/register') && !path.includes('/check'))
    ) {
      return next();
    }

    // Get tenant from header or subdomain
    const tenantSlug = this.extractTenantSlug(req);

    // Skip tenant check for localhost (development mode)
    const host = req.headers.host || '';
    if (host.startsWith('localhost') || host.includes(':')) {
      console.log('[TenantMiddleware] Skipping tenant check for localhost/development');
      return next();
    }

    if (!tenantSlug) {
      throw new BadRequestException('Missing x-tenant-id header');
    }

    // Resolve tenant from database
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        branding: true,
        settings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantSlug}' not found`);
    }

    // Attach tenant to request
    req.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      branding: tenant.branding,
      settings: tenant.settings,
    };

    next();
  }

  private extractTenantSlug(req: Request): string | undefined {
    // Priority 1: x-tenant-id header
    const headerTenant = req.headers['x-tenant-id'];
    if (headerTenant && typeof headerTenant === 'string') {
      return headerTenant;
    }

    // Priority 2: Subdomain (e.g., tenant1.dockpulse.app)
    const host = req.headers.host;
    if (host) {
      // Skip localhost and hosts with ports
      if (host.startsWith('localhost') || host.includes(':')) {
        return undefined;
      }

      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'app' && subdomain !== 'admin') {
        return subdomain;
      }
    }

    // Priority 3: Query param (for development)
    const queryTenant = req.query.tenant;
    if (queryTenant && typeof queryTenant === 'string') {
      return queryTenant;
    }

    return undefined;
  }
}
