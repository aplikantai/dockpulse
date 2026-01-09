import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service';

export const REQUIRE_MODULE_KEY = 'requireModule';
export const REQUIRE_PERMISSION_KEY = 'requirePermission';

export type PermissionType = 'read' | 'write' | 'delete';

export interface ModulePermissionMetadata {
  moduleCode: string;
  permission?: PermissionType;
}

/**
 * Guard that checks if user has permission to access a specific module
 */
@Injectable()
export class ModulePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<ModulePermissionMetadata>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModule) {
      // No module requirement, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Platform admins have access to everything
    if (user.role === 'PLATFORM_ADMIN' || user.isPlatformAdmin) {
      return true;
    }

    // Tenant admins have full access to all modules in their tenant
    if (user.role === 'admin') {
      return true;
    }

    // Check if user has permission for this module
    const permission = await (this.prisma as any).userModulePermission.findUnique({
      where: {
        userId_moduleCode: {
          userId: user.sub,
          moduleCode: requiredModule.moduleCode,
        },
      },
    });

    if (!permission) {
      throw new ForbiddenException(
        `You don't have access to the ${requiredModule.moduleCode} module`,
      );
    }

    // Check specific permission type if required
    const requiredPermission = requiredModule.permission || 'read';

    switch (requiredPermission) {
      case 'read':
        if (!permission.canRead) {
          throw new ForbiddenException(`You don't have read access to ${requiredModule.moduleCode}`);
        }
        break;
      case 'write':
        if (!permission.canWrite) {
          throw new ForbiddenException(`You don't have write access to ${requiredModule.moduleCode}`);
        }
        break;
      case 'delete':
        if (!permission.canDelete) {
          throw new ForbiddenException(`You don't have delete access to ${requiredModule.moduleCode}`);
        }
        break;
    }

    return true;
  }
}
