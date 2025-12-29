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
    // Skip tenant resolution for health checks and public endpoints
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }

    // Get tenant from header or subdomain
    const tenantSlug = this.extractTenantSlug(req);

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
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
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
