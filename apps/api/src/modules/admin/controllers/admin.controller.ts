import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminService } from '../services/admin.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  CreateTenantUserDto,
  UpdateTenantUserDto,
} from '../dto/platform-stats.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { CreateAdminDto, UpdateAdminDto, ChangeAdminPasswordDto } from '../dto/admin-user.dto';

/**
 * AdminController - Platform Admin API endpoints
 *
 * Base path: /api/admin
 *
 * TODO: Implement proper admin authentication!
 * Currently stats endpoint is public for testing chart functionality.
 * Other endpoints should add @UseGuards(JwtAuthGuard, AdminGuard) individually.
 */
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /api/admin/stats
   * Get platform-wide statistics
   * TODO: Add authentication - currently public for testing
   */
  @Public()
  @Get('stats')
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  /**
   * GET /api/admin/tenants
   * Get list of all tenants
   */
  @Get('tenants')
  async getTenants() {
    return this.adminService.getTenants();
  }

  /**
   * GET /api/admin/tenants/:id
   * Get tenant details
   */
  @Get('tenants/:id')
  async getTenantDetail(@Param('id') tenantId: string) {
    return this.adminService.getTenantDetail(tenantId);
  }

  /**
   * POST /api/admin/tenants
   * Create new tenant
   */
  @Post('tenants')
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.adminService.createTenant(dto);
  }

  /**
   * PUT /api/admin/tenants/:id
   * Update tenant
   */
  @Put('tenants/:id')
  async updateTenant(
    @Param('id') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.adminService.updateTenant(tenantId, dto);
  }

  /**
   * DELETE /api/admin/tenants/:id
   * Soft delete tenant (marks as deleted, preserves data)
   */
  @Delete('tenants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTenant(@Param('id') tenantId: string) {
    await this.adminService.deleteTenant(tenantId);
  }

  /**
   * DELETE /api/admin/tenants/:id/permanent
   * Permanently delete tenant (WARNING: irreversible!)
   */
  @Delete('tenants/:id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  async permanentlyDeleteTenant(@Param('id') tenantId: string) {
    await this.adminService.permanentlyDeleteTenant(tenantId);
  }

  /**
   * POST /api/admin/tenants/:id/suspend
   * Suspend tenant
   */
  @Post('tenants/:id/suspend')
  async suspendTenant(
    @Param('id') tenantId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendTenant(tenantId, reason);
  }

  /**
   * POST /api/admin/tenants/:id/reactivate
   * Reactivate suspended tenant
   */
  @Post('tenants/:id/reactivate')
  async reactivateTenant(@Param('id') tenantId: string) {
    return this.adminService.reactivateTenant(tenantId);
  }

  /**
   * GET /api/admin/tenants/:id/stats
   * Get detailed statistics for a specific tenant
   */
  @Get('tenants/:id/stats')
  async getTenantStats(@Param('id') tenantId: string) {
    return this.adminService.getTenantStats(tenantId);
  }

  // ============================================
  // TENANT USER MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/tenants/:tenantId/users
   * Get all users for a tenant
   */
  @Get('tenants/:tenantId/users')
  async getTenantUsers(@Param('tenantId') tenantId: string) {
    return this.adminService.getTenantUsers(tenantId);
  }

  /**
   * POST /api/admin/tenants/:tenantId/users
   * Create user for tenant
   */
  @Post('tenants/:tenantId/users')
  async createTenantUser(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateTenantUserDto,
  ) {
    return this.adminService.createTenantUser(tenantId, dto);
  }

  /**
   * PUT /api/admin/tenants/:tenantId/users/:userId
   * Update tenant user
   */
  @Put('tenants/:tenantId/users/:userId')
  async updateTenantUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTenantUserDto,
  ) {
    return this.adminService.updateTenantUser(tenantId, userId, dto);
  }

  /**
   * DELETE /api/admin/tenants/:tenantId/users/:userId
   * Delete tenant user
   */
  @Delete('tenants/:tenantId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTenantUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    await this.adminService.deleteTenantUser(tenantId, userId);
  }

  /**
   * POST /api/admin/tenants/:tenantId/users/:userId/reset-password
   * Reset tenant user password
   */
  @Post('tenants/:tenantId/users/:userId/reset-password')
  async resetTenantUserPassword(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body('newPassword') newPassword?: string,
  ) {
    return this.adminService.resetTenantUserPassword(tenantId, userId, newPassword);
  }

  // ============================================
  // MODULE MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/modules
   * Get module catalog (all available modules)
   */
  @Get('modules')
  async getModuleCatalog() {
    return this.adminService.getModuleCatalog();
  }

  /**
   * POST /api/admin/tenants/:tenantId/modules/:moduleCode
   * Install module for specific tenant (force install)
   */
  @Post('tenants/:tenantId/modules/:moduleCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  async installModuleForTenant(
    @Param('tenantId') tenantId: string,
    @Param('moduleCode') moduleCode: string,
  ) {
    await this.adminService.installModuleForTenant(tenantId, moduleCode);
  }

  /**
   * DELETE /api/admin/tenants/:tenantId/modules/:moduleCode
   * Uninstall module from specific tenant
   */
  @Delete('tenants/:tenantId/modules/:moduleCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  async uninstallModuleFromTenant(
    @Param('tenantId') tenantId: string,
    @Param('moduleCode') moduleCode: string,
  ) {
    await this.adminService.uninstallModuleFromTenant(tenantId, moduleCode);
  }

  // ============================================
  // PLATFORM ADMIN USER MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/admins
   * Get all platform admins
   */
  @Public()  // TODO: Add auth for production
  @Get('admins')
  async getPlatformAdmins() {
    return this.adminService.getPlatformAdmins();
  }

  /**
   * POST /api/admin/admins
   * Create new platform admin
   */
  @Public()  // TODO: Add auth for production
  @Post('admins')
  async createPlatformAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createPlatformAdmin(dto);
  }

  /**
   * PUT /api/admin/admins/:id
   * Update platform admin
   */
  @Public()  // TODO: Add auth for production
  @Put('admins/:id')
  async updatePlatformAdmin(
    @Param('id') adminId: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.adminService.updatePlatformAdmin(adminId, dto);
  }

  /**
   * PUT /api/admin/admins/:id/password
   * Change platform admin password
   */
  @Public()  // TODO: Add auth for production
  @Put('admins/:id/password')
  @HttpCode(HttpStatus.OK)
  async changeAdminPassword(
    @Param('id') adminId: string,
    @Body() dto: ChangeAdminPasswordDto,
  ) {
    await this.adminService.changeAdminPassword(adminId, dto.newPassword);
    return { message: 'Password changed successfully' };
  }

  /**
   * DELETE /api/admin/admins/:id
   * Delete platform admin
   */
  @Public()  // TODO: Add auth for production
  @Delete('admins/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlatformAdmin(@Param('id') adminId: string) {
    await this.adminService.deletePlatformAdmin(adminId);
  }
}
