import { PrismaClient, TenantRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      user?: JwtPayload;
      portalUser?: PortalUser;
      membership?: MembershipContext;
      db: PrismaClient;
    }
  }
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  plan: string;
}

export interface JwtPayload {
  userId: string;
  phone: string;
  role?: string;
}

export interface PortalUser {
  clientUserId: string;
  email: string;
  name: string;
  tenantId: string;
}

export interface MembershipContext {
  id: string;
  role: TenantRole;
  permissions: string[];
  isActive: boolean;
}

export {};
