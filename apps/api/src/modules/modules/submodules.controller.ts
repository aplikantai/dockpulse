import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SubmodulesService } from './submodules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ModuleCode } from './submodule-registry';

/**
 * SubmodulesController - REST API for submodule management
 *
 * Endpoints:
 * - GET    /submodules                   - Get all available submodules (catalog)
 * - GET    /submodules/enabled           - Get enabled submodules for current tenant
 * - GET    /submodules/pricing           - Get pricing catalog (addons only)
 * - GET    /submodules/module/:code      - Get submodules for specific module
 * - POST   /submodules/:code/enable      - Enable a submodule
 * - POST   /submodules/:code/disable     - Disable a submodule
 * - POST   /submodules/batch-enable      - Batch enable submodules
 * - GET    /submodules/:code/check       - Check if submodule is enabled
 */
@ApiTags('submodules')
@Controller('submodules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubmodulesController {
  constructor(private readonly submodulesService: SubmodulesService) {}

  // ===========================================
  // CATALOG & DISCOVERY
  // ===========================================

  @Get()
  @ApiOperation({
    summary: 'Get all available submodules',
    description:
      'Returns the complete submodule catalog with definitions, pricing, and metadata',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete submodule catalog',
  })
  async getAllSubmodules() {
    return {
      submodules: this.submodulesService.getAllSubmodules(),
      total: this.submodulesService.getAllSubmodules().length,
    };
  }

  @Get('module/:moduleCode')
  @ApiOperation({
    summary: 'Get submodules for a specific module',
    description: 'Returns all submodules that belong to a parent module',
  })
  @ApiParam({
    name: 'moduleCode',
    description: 'Parent module code',
    example: 'CRM',
  })
  @ApiResponse({
    status: 200,
    description: 'Submodules for the specified module',
  })
  async getSubmodulesByModule(@Param('moduleCode') moduleCode: string) {
    // Validate module code
    if (!Object.values(ModuleCode).includes(moduleCode as ModuleCode)) {
      throw new BadRequestException(`Invalid module code: ${moduleCode}`);
    }

    const submodules = this.submodulesService.getSubmodulesByModule(
      moduleCode as ModuleCode,
    );

    return {
      moduleCode,
      submodules,
      total: submodules.length,
    };
  }

  @Get('pricing')
  @ApiOperation({
    summary: 'Get pricing catalog',
    description:
      'Returns all addon submodules with pricing information (for pricing page)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing catalog with addon submodules',
  })
  async getPricingCatalog() {
    return {
      addons: this.submodulesService.getPricingCatalog(),
      total: this.submodulesService.getAddonSubmodules().length,
    };
  }

  // ===========================================
  // TENANT-SPECIFIC OPERATIONS
  // ===========================================

  @Get('enabled')
  @ApiOperation({
    summary: 'Get enabled submodules for current tenant',
    description:
      'Returns all submodules that are currently enabled for the authenticated tenant',
  })
  @ApiQuery({
    name: 'details',
    required: false,
    type: Boolean,
    description: 'Include full submodule definitions',
  })
  @ApiResponse({
    status: 200,
    description: 'List of enabled submodules',
  })
  async getEnabledSubmodules(
    @CurrentUser() user: CurrentUserData,
    @Query('details') details?: string,
  ) {
    const includeDetails = details === 'true';

    if (includeDetails) {
      const submodules =
        await this.submodulesService.getEnabledSubmodulesWithDetails(
          user.tenantId,
        );
      return {
        tenantId: user.tenantId,
        submodules,
        total: submodules.length,
      };
    }

    const codes = await this.submodulesService.getEnabledSubmodules(
      user.tenantId,
    );
    return {
      tenantId: user.tenantId,
      submodules: codes,
      total: codes.length,
    };
  }

  @Get(':code/check')
  @ApiOperation({
    summary: 'Check if submodule is enabled',
    description:
      'Check if a specific submodule is enabled for the current tenant',
  })
  @ApiParam({
    name: 'code',
    description: 'Submodule code',
    example: 'CRM.SEGMENTS',
  })
  @ApiResponse({
    status: 200,
    description: 'Submodule enabled status',
  })
  async checkSubmoduleEnabled(
    @CurrentUser() user: CurrentUserData,
    @Param('code') code: string,
  ) {
    const isEnabled = await this.submodulesService.isSubmoduleEnabled(
      user.tenantId,
      code,
    );

    return {
      tenantId: user.tenantId,
      submoduleCode: code,
      isEnabled,
    };
  }

  // ===========================================
  // ENABLE / DISABLE
  // ===========================================

  @Post(':code/enable')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Enable a submodule',
    description:
      'Enable a submodule for the current tenant (validates dependencies and conflicts)',
  })
  @ApiParam({
    name: 'code',
    description: 'Submodule code to enable',
    example: 'CRM.SEGMENTS',
  })
  @ApiResponse({
    status: 200,
    description: 'Submodule enabled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (missing dependencies, conflicts, etc.)',
  })
  @ApiResponse({
    status: 404,
    description: 'Submodule not found',
  })
  async enableSubmodule(
    @CurrentUser() user: CurrentUserData,
    @Param('code') code: string,
  ) {
    await this.submodulesService.enableSubmodule(user.tenantId, code, user.userId);

    return {
      success: true,
      message: `Submodule ${code} enabled successfully`,
      tenantId: user.tenantId,
      submoduleCode: code,
    };
  }

  @Post(':code/disable')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Disable a submodule',
    description:
      'Disable a submodule for the current tenant (checks for dependent submodules)',
  })
  @ApiParam({
    name: 'code',
    description: 'Submodule code to disable',
    example: 'CRM.SEGMENTS',
  })
  @ApiResponse({
    status: 200,
    description: 'Submodule disabled successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error (cannot disable default-enabled or has dependents)',
  })
  @ApiResponse({
    status: 404,
    description: 'Submodule not found',
  })
  async disableSubmodule(
    @CurrentUser() user: CurrentUserData,
    @Param('code') code: string,
  ) {
    await this.submodulesService.disableSubmodule(user.tenantId, code);

    return {
      success: true,
      message: `Submodule ${code} disabled successfully`,
      tenantId: user.tenantId,
      submoduleCode: code,
    };
  }

  @Post('batch-enable')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Batch enable multiple submodules',
    description:
      'Enable multiple submodules at once (reports success/failure for each)',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch operation completed',
  })
  async batchEnableSubmodules(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { submoduleCodes: string[] },
  ) {
    if (!body.submoduleCodes || !Array.isArray(body.submoduleCodes)) {
      throw new BadRequestException('submoduleCodes must be an array');
    }

    const result = await this.submodulesService.batchEnableSubmodules(
      user.tenantId,
      body.submoduleCodes,
      user.userId,
    );

    return {
      success: true,
      tenantId: user.tenantId,
      ...result,
    };
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  @Post('initialize')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Initialize default submodules',
    description:
      'Initialize all default-enabled submodules for the current tenant (typically called during onboarding)',
  })
  @ApiResponse({
    status: 200,
    description: 'Default submodules initialized',
  })
  async initializeDefaultSubmodules(@CurrentUser() user: CurrentUserData) {
    await this.submodulesService.initializeDefaultSubmodules(user.tenantId, user.userId);

    return {
      success: true,
      message: 'Default submodules initialized successfully',
      tenantId: user.tenantId,
    };
  }
}
