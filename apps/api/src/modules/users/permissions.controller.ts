import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  getAllPermissions,
  getPermissionsByModule,
  DEFAULT_ROLE_PERMISSIONS,
} from './permissions';

@ApiTags('permissions')
@Controller('permissions')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  // ===========================================
  // GET ALL PERMISSIONS
  // ===========================================

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all available permissions (Owner/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all permissions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', example: 'crm:view' },
          description: { type: 'string', example: 'Podgląd klientów' },
        },
      },
    },
  })
  getAllPermissions(): Array<{ key: string; description: string }> {
    return getAllPermissions();
  }

  // ===========================================
  // GET PERMISSIONS BY MODULE
  // ===========================================

  @Get('by-module')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get permissions grouped by module (Owner/Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions grouped by module',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
    },
  })
  getPermissionsByModule(): Record<
    string,
    Array<{ key: string; description: string }>
  > {
    return getPermissionsByModule();
  }

  // ===========================================
  // GET DEFAULT ROLE PERMISSIONS
  // ===========================================

  @Get('default-roles')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get default permissions for each role (Owner/Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Default permissions per role',
    schema: {
      type: 'object',
      properties: {
        OWNER: { type: 'array', items: { type: 'string' } },
        ADMIN: { type: 'array', items: { type: 'string' } },
        MANAGER: { type: 'array', items: { type: 'string' } },
        EMPLOYEE: { type: 'array', items: { type: 'string' } },
        VIEWER: { type: 'array', items: { type: 'string' } },
        PLATFORM_ADMIN: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  getDefaultRolePermissions(): Record<UserRole, string[]> {
    return DEFAULT_ROLE_PERMISSIONS;
  }
}
