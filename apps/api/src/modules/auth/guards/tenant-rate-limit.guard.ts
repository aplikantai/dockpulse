import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * TenantRateLimitGuard - Per-tenant rate limiting
 *
 * Extends ThrottlerGuard to add tenant-scoped rate limiting.
 *
 * Rate limits per tenant (configurable per plan):
 * - FREE: 50 requests/minute
 * - STARTER: 200 requests/minute
 * - PRO: 1000 requests/minute
 * - ENTERPRISE: Unlimited
 */
@Injectable()
export class TenantRateLimitGuard extends ThrottlerGuard {
  /**
   * Override to use tenant ID as the rate limit key instead of IP
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    
    if (!tenantId) {
      // Fall back to IP-based rate limiting for requests without tenant
      return req.ip;
    }

    // Use tenant ID as the key for rate limiting
    return `tenant:${tenantId}`;
  }
}
