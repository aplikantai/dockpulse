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
import { Public } from '../auth/decorators/public.decorator';
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
  RegisterTenantDto,
} from './dto/platform.dto';

@ApiTags('Platform Admin')
@Controller('platform')
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly authService: PlatformAuthService,
  ) {}

  // ============ AUTH ============

  @Public()
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

  // ============ STATS ============

  @Get('stats')
  @ApiOperation({ summary: 'Statystyki platformy' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async getStats() {
    return this.platformService.getPlatformStats();
  }

  @Get('tenants/:id/usage')
  @ApiOperation({ summary: 'Usage metrics dla tenanta' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async getTenantUsage(@Param('id') id: string) {
    return this.platformService.getTenantUsage(id);
  }

  // ============ PUBLIC (for onboarding) ============

  @Public()
  @Post('tenants/register')
  @ApiOperation({ summary: 'Publiczna rejestracja nowego tenanta (landing page)' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterTenantDto) {
    return this.platformService.registerTenant(dto);
  }

  @Public()
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

  @Public()
  @Get('tenants/by-slug/:slug')
  @ApiOperation({ summary: 'Pobierz dane tenanta (publiczny endpoint dla dashboard)' })
  async getTenantBySlug(@Param('slug') slug: string) {
    return this.platformService.getTenantWithModules(slug);
  }

  // ============ MODULES (Public - dostępne dla wszystkich) ============

  @Public()
  @Get('modules/available')
  @ApiOperation({ summary: 'Lista wszystkich dostępnych modułów w systemie' })
  async getAvailableModules() {
    return this.platformService.getAvailableModules();
  }

  @Public()
  @Get('tenants/:slug/modules')
  @ApiOperation({ summary: 'Pobierz aktywne moduły dla tenanta (publiczny)' })
  async getTenantModules(@Param('slug') slug: string) {
    return this.platformService.getTenantModules(slug);
  }

  @Post('tenants/:id/modules')
  @ApiOperation({ summary: 'Aktywuj/dezaktywuj moduł dla tenanta' })
  @ApiBearerAuth()
  @UseGuards(PlatformAdminGuard)
  async toggleTenantModule(
    @Param('id') tenantId: string,
    @Body() dto: { moduleCode: string; isEnabled: boolean; config?: any },
  ) {
    return this.platformService.toggleTenantModule(
      tenantId,
      dto.moduleCode,
      dto.isEnabled,
      dto.config,
    );
  }
}
