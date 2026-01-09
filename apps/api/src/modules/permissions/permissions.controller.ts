import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PermissionsService, UpdatePermissionsDto } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * GET /api/permissions/users/:userId
   * Get all module permissions for a specific user (Admin/Manager only)
   */
  @Get('users/:userId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getUserPermissions(
    @Tenant() tenant: TenantContext,
    @Param('userId') userId: string,
  ) {
    return this.permissionsService.getUserPermissions(userId);
  }

  /**
   * PUT /api/permissions/users/:userId/modules/:moduleCode
   * Set permission for a user on a specific module (Admin only)
   */
  @Put('users/:userId/modules/:moduleCode')
  @Roles(UserRole.ADMIN)
  async setUserPermission(
    @Tenant() tenant: TenantContext,
    @Param('userId') userId: string,
    @Param('moduleCode') moduleCode: string,
    @Body() permissions: { canRead: boolean; canWrite: boolean; canDelete: boolean },
  ) {
    return this.permissionsService.setUserPermission(userId, moduleCode, permissions);
  }

  /**
   * POST /api/permissions/users/:userId/bulk
   * Bulk update permissions for a user (Admin only)
   */
  @Post('users/:userId/bulk')
  @Roles(UserRole.ADMIN)
  async bulkUpdatePermissions(
    @Tenant() tenant: TenantContext,
    @Param('userId') userId: string,
    @Body() dto: { permissions: UpdatePermissionsDto[] },
  ) {
    return this.permissionsService.bulkUpdateUserPermissions(userId, dto.permissions);
  }

  /**
   * DELETE /api/permissions/users/:userId/modules/:moduleCode
   * Remove permission for a specific module (Admin only)
   */
  @Delete('users/:userId/modules/:moduleCode')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeUserPermission(
    @Tenant() tenant: TenantContext,
    @Param('userId') userId: string,
    @Param('moduleCode') moduleCode: string,
  ) {
    await this.permissionsService.removeUserPermission(userId, moduleCode);
  }

  /**
   * POST /api/permissions/users/:userId/grant-full-access
   * Grant full access to all specified modules (Admin only)
   */
  @Post('users/:userId/grant-full-access')
  @Roles(UserRole.ADMIN)
  async grantFullAccess(
    @Tenant() tenant: TenantContext,
    @Param('userId') userId: string,
    @Body() dto: { moduleCodes: string[] },
  ) {
    return this.permissionsService.grantFullAccess(userId, dto.moduleCodes);
  }
}
