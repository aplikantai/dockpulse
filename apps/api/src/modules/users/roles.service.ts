import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleListResponseDto,
} from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================
  // CREATE ROLE
  // ===========================================

  async create(
    tenantId: string,
    dto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    // Check if role name already exists for this tenant
    const existingRole = await this.prisma.roleDefinition.findFirst({
      where: {
        tenantId,
        name: dto.name,
      },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // If inheritsFrom is provided, validate it exists
    if (dto.inheritsFrom) {
      const parentRole = await this.prisma.roleDefinition.findFirst({
        where: {
          id: dto.inheritsFrom,
          tenantId,
        },
      });

      if (!parentRole) {
        throw new BadRequestException('Parent role not found');
      }
    }

    // Create role
    const role = await this.prisma.roleDefinition.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        color: dto.color || '#6B7280',
        permissions: dto.permissions,
        inheritsFrom: dto.inheritsFrom,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return this.mapRoleToResponse(role);
  }

  // ===========================================
  // FIND ALL ROLES
  // ===========================================

  async findAll(
    tenantId: string,
    options?: {
      isActive?: boolean;
    },
  ): Promise<RoleListResponseDto> {
    const where: any = { tenantId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [roles, total] = await Promise.all([
      this.prisma.roleDefinition.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.roleDefinition.count({ where }),
    ]);

    return {
      roles: roles.map((r) => this.mapRoleToResponse(r)),
      total,
    };
  }

  // ===========================================
  // FIND ONE ROLE
  // ===========================================

  async findOne(tenantId: string, roleId: string): Promise<RoleResponseDto> {
    const role = await this.prisma.roleDefinition.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.mapRoleToResponse(role);
  }

  // ===========================================
  // UPDATE ROLE
  // ===========================================

  async update(
    tenantId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    // Check if role exists
    const existingRole = await this.prisma.roleDefinition.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    // Check if new name is already taken
    if (dto.name && dto.name !== existingRole.name) {
      const nameExists = await this.prisma.roleDefinition.findFirst({
        where: {
          tenantId,
          name: dto.name,
          id: { not: roleId },
        },
      });

      if (nameExists) {
        throw new ConflictException('Role name already in use');
      }
    }

    // If inheritsFrom is provided, validate it exists
    if (dto.inheritsFrom) {
      const parentRole = await this.prisma.roleDefinition.findFirst({
        where: {
          id: dto.inheritsFrom,
          tenantId,
        },
      });

      if (!parentRole) {
        throw new BadRequestException('Parent role not found');
      }

      // Prevent circular inheritance
      if (dto.inheritsFrom === roleId) {
        throw new BadRequestException('Role cannot inherit from itself');
      }
    }

    // Update role
    const role = await this.prisma.roleDefinition.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        permissions: dto.permissions,
        inheritsFrom: dto.inheritsFrom,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });

    return this.mapRoleToResponse(role);
  }

  // ===========================================
  // REMOVE ROLE
  // ===========================================

  async remove(tenantId: string, roleId: string): Promise<void> {
    const role = await this.prisma.roleDefinition.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if any users are using this role
    const usersWithRole = await this.prisma.user.count({
      where: {
        tenantId,
        customRole: role.name,
      },
    });

    if (usersWithRole > 0) {
      throw new BadRequestException(
        `Cannot delete role. ${usersWithRole} user(s) are using this role`,
      );
    }

    // Check if any roles inherit from this role
    const childRoles = await this.prisma.roleDefinition.count({
      where: {
        tenantId,
        inheritsFrom: roleId,
      },
    });

    if (childRoles > 0) {
      throw new BadRequestException(
        `Cannot delete role. ${childRoles} role(s) inherit from this role`,
      );
    }

    // Delete role
    await this.prisma.roleDefinition.delete({
      where: { id: roleId },
    });
  }

  // ===========================================
  // GET ROLE WITH INHERITED PERMISSIONS
  // ===========================================

  async getRoleWithInheritedPermissions(
    tenantId: string,
    roleId: string,
  ): Promise<RoleResponseDto & { inheritedPermissions: string[] }> {
    const role = await this.findOne(tenantId, roleId);

    // If no inheritance, return role permissions
    if (!role.inheritsFrom) {
      return {
        ...role,
        inheritedPermissions: [],
      };
    }

    // Get parent role permissions
    const parentRole = await this.findOne(tenantId, role.inheritsFrom);

    // Merge permissions (unique)
    const allPermissions = [
      ...new Set([...parentRole.permissions, ...role.permissions]),
    ];

    return {
      ...role,
      inheritedPermissions: parentRole.permissions,
      permissions: allPermissions,
    };
  }

  // ===========================================
  // HELPER: Map role to response DTO
  // ===========================================

  private mapRoleToResponse(role: any): RoleResponseDto {
    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: role.permissions || [],
      inheritsFrom: role.inheritsFrom,
      isActive: role.isActive,
      sortOrder: role.sortOrder,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
