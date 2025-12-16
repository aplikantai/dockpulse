import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../infra/db/prisma.js';
import { TenantContext } from '../../types/express.js';

/**
 * Middleware do rozwiazywania tenant z subdomeny lub headera
 * Musi byc wywolany przed wszystkimi route'ami wymagajacymi tenant context
 */
export const resolveTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Wyciagnij slug z Host header
    const host = req.get('host') || req.get('x-forwarded-host') || '';
    const slug = extractSlugFromHost(host);

    // 2. Fallback na header X-Tenant-Slug (dev/testing)
    const tenantSlug = slug || req.get('x-tenant-slug');

    if (!tenantSlug) {
      return res.status(400).json({
        error: 'Missing tenant identifier',
        message: 'Use subdomain (firma.dockpulse.com) or X-Tenant-Slug header',
      });
    }

    // 3. Znajdz tenant w bazie (bez RLS - globalna tabela)
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, plan: true, isActive: true },
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: `No tenant with slug: ${tenantSlug}`,
      });
    }

    if (!tenant.isActive) {
      return res.status(403).json({
        error: 'Tenant is disabled',
        message: 'This organization has been deactivated',
      });
    }

    // 4. Ustaw tenant context na request
    req.tenant = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      plan: tenant.plan,
    } satisfies TenantContext;

    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Wyciaga slug subdomeny z hosta
 * firma1.dockpulse.com -> firma1
 * firma1.localhost:4000 -> firma1
 * localhost:4000 -> null
 */
function extractSlugFromHost(host: string): string | null {
  const parts = host.split('.');

  // Dla produkcji: firma1.dockpulse.com (3+ części)
  if (host.includes('dockpulse.com') && parts.length >= 3) {
    return parts[0];
  }

  // Dla dev: firma1.localhost:4000 (2+ części z localhost)
  if (host.includes('localhost') && parts.length >= 2) {
    const firstPart = parts[0];
    // Upewnij sie ze to nie jest sam "localhost"
    if (firstPart !== 'localhost' && !firstPart.includes(':')) {
      return firstPart;
    }
  }

  return null;
}

/**
 * Middleware ktory NIE wymaga tenant (dla publicznych endpointow)
 * Ustawia tenant jesli jest dostepny, ale nie blokuje requestu
 */
export const optionalTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const host = req.get('host') || req.get('x-forwarded-host') || '';
    const slug = extractSlugFromHost(host) || req.get('x-tenant-slug');

    if (slug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: { id: true, slug: true, plan: true, isActive: true },
      });

      if (tenant?.isActive) {
        req.tenant = {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          plan: tenant.plan,
        };
      }
    }

    next();
  } catch {
    // Ignoruj bledy - tenant jest opcjonalny
    next();
  }
};
