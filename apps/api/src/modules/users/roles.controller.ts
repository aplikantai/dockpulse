import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleListResponseDto,
} from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';

@ApiTags('roles')
@Controller('roles')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ===========================================
  // ROLE CRUD
  // ===========================================

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a custom role (Owner/Admin only)' })
  @ApiResponse({ status: 201, description: 'Role created', type: RoleResponseDto })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async create(
    @Tenant() tenant: TenantContext,
    @Body() dto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.create(tenant.id, dto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all custom roles for tenant' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of roles', type: RoleListResponseDto })
  async findAll(
    @Tenant() tenant: TenantContext,
    @Query('isActive') isActive?: string,
  ): Promise<RoleListResponseDto> {
    return this.rolesService.findAll(tenant.id, {
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role data', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<RoleResponseDto> {
    return this.rolesService.findOne(tenant.id, id);
  }

  @Get(':id/with-inherited')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get role with inherited permissions' })
  @ApiResponse({ status: 200, description: 'Role with inherited permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleWithInherited(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<any> {
    return this.rolesService.getRoleWithInheritedPermissions(tenant.id, id);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update custom role (Owner/Admin only)' })
  @ApiResponse({ status: 200, description: 'Role updated', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete custom role (Owner/Admin only)' })
  @ApiResponse({ status: 204, description: 'Role deleted' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete role in use' })
  async remove(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<void> {
    return this.rolesService.remove(tenant.id, id);
  }
}
