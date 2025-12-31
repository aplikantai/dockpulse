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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { PlatformAuthService } from './platform-auth.service';
import {
  PlatformAdminGuard,
  SuperAdminGuard,
  PlatformAdminRequest,
} from './guards/platform-admin.guard';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantBrandingDto,
  TenantStatus,
  TenantPlan,
  PlatformLoginDto,
  CreatePlatformAdminDto,
} from './dto/platform.dto';

@ApiTags('Platform Admin')
@Controller('platform')
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly authService: PlatformAuthService,
  ) {}

  // ============ AUTH ============

  @Post('auth/login')
  @ApiOperation({ summary: 'Login administratora platformy' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: PlatformLoginDto) {
    return this.authService.login(dto);
  }

  @Get('auth/me')
  @ApiOperation({ summary: 'Dane zalogowanego admina' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async getMe(@Req() req: PlatformAdminRequest) {
    return req.platformAdmin;
  }

  // ============ ADMINS (Super Admin only) ============

  @Get('admins')
  @ApiOperation({ summary: 'Lista adminów platformy' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard, SuperAdminGuard)
  async getAdmins() {
    return this.authService.getAdmins();
  }

  @Post('admins')
  @ApiOperation({ summary: 'Dodaj admina platformy' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard, SuperAdminGuard)
  async createAdmin(@Body() dto: CreatePlatformAdminDto) {
    return this.authService.createAdmin(dto);
  }

  // ============ TENANTS ============

  @Get('tenants')
  @ApiOperation({ summary: 'Lista wszystkich tenantów' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async getTenants(
    @Query('status') status?: TenantStatus,
    @Query('plan') plan?: TenantPlan,
    @Query('search') search?: string,
  ) {
    return this.platformService.getTenants({ status, plan, search });
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Szczegóły tenanta' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async getTenant(@Param('id') id: string) {
    return this.platformService.getTenant(id);
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Utwórz nowego tenanta' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.platformService.createTenant(dto);
  }

  @Put('tenants/:id')
  @ApiOperation({ summary: 'Aktualizuj tenanta' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.platformService.updateTenant(id, dto);
  }

  @Put('tenants/:id/branding')
  @ApiOperation({ summary: 'Aktualizuj branding tenanta' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async updateBranding(
    @Param('id') id: string,
    @Body() dto: TenantBrandingDto,
  ) {
    return this.platformService.updateBranding(id, dto);
  }

  @Post('tenants/:id/activate')
  @ApiOperation({ summary: 'Aktywuj tenanta' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  @HttpCode(HttpStatus.OK)
  async activateTenant(@Param('id') id: string) {
    return this.platformService.activateTenant(id);
  }

  @Post('tenants/:id/suspend')
  @ApiOperation({ summary: 'Zawieś tenanta' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  @HttpCode(HttpStatus.OK)
  async suspendTenant(@Param('id') id: string) {
    return this.platformService.suspendTenant(id);
  }

  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Usuń tenanta (soft delete)' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard, SuperAdminGuard)
  async deleteTenant(@Param('id') id: string) {
    return this.platformService.deleteTenant(id);
  }

  // ============ MODULES ============

  @Get('modules')
  @ApiOperation({ summary: 'Lista dostępnych modułów' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async getAvailableModules() {
    return this.platformService.getAvailableModules();
  }

  @Get('tenants/:id/modules')
  @ApiOperation({ summary: 'Moduły tenanta' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async getTenantModules(@Param('id') id: string) {
    return this.platformService.getTenantModules(id);
  }

  // ============ STATS ============

  @Get('stats')
  @ApiOperation({ summary: 'Statystyki platformy' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async getStats() {
    return this.platformService.getPlatformStats();
  }

  // ============ PUBLIC (for onboarding) ============

  @Get('tenants/check/:slug')
  @ApiOperation({ summary: 'Sprawdź dostępność slug' })
  async checkSlug(@Param('slug') slug: string) {
    try {
      await this.platformService.getTenantBySlug(slug);
      return { available: false };
    } catch {
      return { available: true };
    }
  }
}
