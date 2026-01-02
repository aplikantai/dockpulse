import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminService } from '../services/admin.service';
import { CreateTenantDto } from '../dto/platform-stats.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

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
}
