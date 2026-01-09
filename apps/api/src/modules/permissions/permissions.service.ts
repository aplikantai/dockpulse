import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface UpdatePermissionsDto {
  moduleCode: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string) {
    return (this.prisma as any).userModulePermission.findMany({
      where: { userId },
      orderBy: { moduleCode: 'asc' },
    });
  }

  /**
   * Set permissions for a user on a specific module
   */
  async setUserPermission(
    userId: string,
    moduleCode: string,
    permissions: { canRead: boolean; canWrite: boolean; canDelete: boolean },
  ) {
    // Check if user exists
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return (this.prisma as any).userModulePermission.upsert({
      where: {
        userId_moduleCode: {
          userId,
          moduleCode,
        },
      },
      create: {
        userId,
        moduleCode,
        canRead: permissions.canRead,
        canWrite: permissions.canWrite,
        canDelete: permissions.canDelete,
      },
      update: {
        canRead: permissions.canRead,
        canWrite: permissions.canWrite,
        canDelete: permissions.canDelete,
      },
    });
  }

  /**
   * Bulk update permissions for a user
   */
  async bulkUpdateUserPermissions(userId: string, permissions: UpdatePermissionsDto[]) {
    // Check if user exists
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use transaction to update all permissions
    const results = await Promise.all(
      permissions.map((perm) =>
        this.setUserPermission(userId, perm.moduleCode, {
          canRead: perm.canRead,
          canWrite: perm.canWrite,
          canDelete: perm.canDelete,
        }),
      ),
    );

    return results;
  }

  /**
   * Remove permission for a specific module
   */
  async removeUserPermission(userId: string, moduleCode: string) {
    const permission = await (this.prisma as any).userModulePermission.findUnique({
      where: {
        userId_moduleCode: {
          userId,
          moduleCode,
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await (this.prisma as any).userModulePermission.delete({
      where: {
        userId_moduleCode: {
          userId,
          moduleCode,
        },
      },
    });
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    moduleCode: string,
    permissionType: 'read' | 'write' | 'delete',
  ): Promise<boolean> {
    const permission = await (this.prisma as any).userModulePermission.findUnique({
      where: {
        userId_moduleCode: {
          userId,
          moduleCode,
        },
      },
    });

    if (!permission) {
      return false;
    }

    switch (permissionType) {
      case 'read':
        return permission.canRead;
      case 'write':
        return permission.canWrite;
      case 'delete':
        return permission.canDelete;
      default:
        return false;
    }
  }

  /**
   * Grant full access to all modules for a user (useful for managers/admins)
   */
  async grantFullAccess(userId: string, moduleCodes: string[]) {
    const results = await Promise.all(
      moduleCodes.map((moduleCode) =>
        this.setUserPermission(userId, moduleCode, {
          canRead: true,
          canWrite: true,
          canDelete: true,
        }),
      ),
    );

    return results;
  }
}
