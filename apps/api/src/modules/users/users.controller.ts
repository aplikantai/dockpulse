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
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserListResponseDto,
  ChangePasswordDto,
  ResetPasswordDto,
  UpdatePermissionsDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===========================================
  // USER CRUD
  // ===========================================

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Owner/Admin only)' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(
    @Tenant() tenant: TenantContext,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(tenant.id, dto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all users for tenant (with pagination and filters)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'List of users', type: UserListResponseDto })
  async findAll(
    @Tenant() tenant: TenantContext,
    @Query('role') role?: UserRole,
    @Query('active') active?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<UserListResponseDto> {
    return this.usersService.findAll(tenant.id, {
      role,
      active: active !== undefined ? active === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user data', type: UserResponseDto })
  async getMe(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(tenant.id, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User data', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(tenant.id, id);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: UserResponseDto })
  async updateMe(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Users can only update their own personal info, not role/permissions
    const safeDto: UpdateUserDto = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      name: dto.name,
      phone: dto.phone,
      avatar: dto.avatar,
    };
    return this.usersService.update(tenant.id, user.userId, safeDto);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (Owner/Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Owner/Admin only - soft delete)' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<void> {
    return this.usersService.remove(tenant.id, id);
  }

  // ===========================================
  // PASSWORD MANAGEMENT
  // ===========================================

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password (requires old password)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Old password is incorrect' })
  async changeOwnPassword(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(tenant.id, user.userId, dto);
    return { message: 'Password changed successfully' };
  }

  @Post(':id/reset-password')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password (Owner/Admin only - no old password required)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.resetPassword(tenant.id, id, dto);
    return { message: 'Password reset successfully' };
  }

  // ===========================================
  // PERMISSIONS MANAGEMENT
  // ===========================================

  @Put(':id/permissions')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user permissions (Owner/Admin only)' })
  @ApiResponse({ status: 200, description: 'Permissions updated', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updatePermissions(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updatePermissions(tenant.id, id, dto);
  }

  // ===========================================
  // ACCOUNT MANAGEMENT
  // ===========================================

  @Post(':id/unlock')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock user account (Owner/Admin only)' })
  @ApiResponse({ status: 200, description: 'Account unlocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unlockUser(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.usersService.unlockUser(tenant.id, id);
    return { message: 'Account unlocked successfully' };
  }
}
