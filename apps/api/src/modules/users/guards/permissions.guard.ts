import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { Permission } from '../permissions';
import { UserRole } from '@prisma/client';

/**
 * PermissionsGuard - sprawdza czy użytkownik ma wymagane uprawnienia
 *
 * Logika:
 * 1. Jeśli brak dekoratora @RequirePermission, przepuszcza request
 * 2. PLATFORM_ADMIN i OWNER mają dostęp do wszystkiego
 * 3. Sprawdza user.permissions[] z bazą danych
 * 4. Wymaga WSZYSTKICH podanych uprawnień (AND logic)
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Brak dekoratora @RequirePermission - przepuszcza
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Brak użytkownika (nie powinno się zdarzyć po JwtAuthGuard)
    if (!user) {
      return false;
    }

    // PLATFORM_ADMIN i OWNER mają dostęp do wszystkiego w swoim tenantcie
    if (user.role === UserRole.PLATFORM_ADMIN || user.role === UserRole.OWNER) {
      return true;
    }

    // Sprawdź czy użytkownik ma wszystkie wymagane uprawnienia
    const userPermissions: string[] = user.permissions || [];

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
