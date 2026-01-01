import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * AdminGuard - Protects routes that require platform admin access
 *
 * Platform admins are identified by:
 * - User.role = 'PLATFORM_ADMIN'
 * - User.email in PLATFORM_ADMIN_EMAILS environment variable
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has PLATFORM_ADMIN role
    if (user.role === 'PLATFORM_ADMIN') {
      return true;
    }

    // Check if user email is in allowed platform admin emails
    const platformAdminEmails = (
      process.env.PLATFORM_ADMIN_EMAILS || ''
    ).split(',').map(email => email.trim());

    if (platformAdminEmails.includes(user.email)) {
      return true;
    }

    throw new ForbiddenException('Platform admin access required');
  }
}
