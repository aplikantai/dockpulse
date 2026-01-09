import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  ToggleModuleDto,
  UpdateFieldConfigDto,
  ToggleTriggerDto,
  CreateTriggerDto,
} from './dto/settings.dto';
import { AISettingsDto } from './dto/ai-settings.dto';
import { OpenRouterService } from '../branding/services/openrouter.service';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ===========================================
  // MODULES
  // ===========================================

  @Get('modules')
  @ApiOperation({ summary: 'Get tenant modules' })
  @ApiResponse({ status: 200, description: 'List of modules with enabled status' })
  async getModules(@CurrentUser() user: CurrentUserData) {
    return this.settingsService.getModules(user.tenantId);
  }

  @Patch('modules/:moduleCode')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle module on/off' })
  @ApiParam({ name: 'moduleCode', example: '@stock' })
  @ApiResponse({ status: 200, description: 'Module toggled' })
  async toggleModule(
    @CurrentUser() user: CurrentUserData,
    @Param('moduleCode') moduleCode: string,
    @Body() dto: ToggleModuleDto,
  ) {
    return this.settingsService.toggleModule(user.tenantId, moduleCode, dto.isEnabled);
  }

  @Post('modules/initialize')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Initialize modules for tenant' })
  @ApiResponse({ status: 201, description: 'Modules initialized' })
  async initializeModules(@CurrentUser() user: CurrentUserData) {
    // Get tenant template
    const config = await this.settingsService.getTenantConfig(user.tenantId);
    return this.settingsService.initializeModulesForTenant(
      user.tenantId,
      config.template as 'services' | 'production' | 'trade',
    );
  }

  // ===========================================
  // FIELD CONFIGS
  // ===========================================

  @Get('fields')
  @ApiOperation({ summary: 'Get field configurations' })
  @ApiQuery({ name: 'entityType', required: false, example: 'customer' })
  @ApiResponse({ status: 200, description: 'Field configurations' })
  async getFieldConfigs(
    @CurrentUser() user: CurrentUserData,
    @Query('entityType') entityType?: string,
  ) {
    return this.settingsService.getFieldConfigs(user.tenantId, entityType);
  }

  @Patch('fields/:entityType/:fieldName')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update field configuration' })
  @ApiParam({ name: 'entityType', example: 'customer' })
  @ApiParam({ name: 'fieldName', example: 'nip' })
  @ApiResponse({ status: 200, description: 'Field config updated' })
  async updateFieldConfig(
    @CurrentUser() user: CurrentUserData,
    @Param('entityType') entityType: string,
    @Param('fieldName') fieldName: string,
    @Body() dto: UpdateFieldConfigDto,
  ) {
    return this.settingsService.updateFieldConfig(user.tenantId, entityType, fieldName, dto);
  }

  // ===========================================
  // TRIGGERS
  // ===========================================

  @Get('triggers')
  @ApiOperation({ summary: 'Get workflow triggers' })
  @ApiQuery({ name: 'eventType', required: false, example: 'order.created' })
  @ApiResponse({ status: 200, description: 'Workflow triggers' })
  async getTriggers(
    @CurrentUser() user: CurrentUserData,
    @Query('eventType') eventType?: string,
  ) {
    return this.settingsService.getTriggers(user.tenantId, eventType);
  }

  @Patch('triggers/:triggerCode')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle trigger on/off' })
  @ApiParam({ name: 'triggerCode', example: 'order.new.sms_admin' })
  @ApiResponse({ status: 200, description: 'Trigger toggled' })
  async toggleTrigger(
    @CurrentUser() user: CurrentUserData,
    @Param('triggerCode') triggerCode: string,
    @Body() dto: ToggleTriggerDto,
  ) {
    return this.settingsService.toggleTrigger(user.tenantId, triggerCode, dto.isEnabled);
  }

  @Post('triggers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create workflow trigger' })
  @ApiResponse({ status: 201, description: 'Trigger created' })
  async createTrigger(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateTriggerDto,
  ) {
    return this.settingsService.createTrigger(user.tenantId, dto);
  }

  // ===========================================
  // TENANT CONFIG
  // ===========================================

  @Get('config')
  @ApiOperation({ summary: 'Get full tenant configuration' })
  @ApiResponse({ status: 200, description: 'Tenant config with statuses, naming, etc.' })
  async getTenantConfig(@CurrentUser() user: CurrentUserData) {
    return this.settingsService.getTenantConfig(user.tenantId);
  }

  // ===========================================
  // AI SETTINGS
  // ===========================================

  @Get('ai')
  @ApiOperation({ summary: 'Get AI settings for tenant' })
  @ApiResponse({ status: 200, description: 'AI configuration including models and API keys' })
  async getAISettings(@CurrentUser() user: CurrentUserData) {
    return this.settingsService.getAISettings(user.tenantId);
  }

  @Patch('ai')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update AI settings' })
  @ApiResponse({ status: 200, description: 'AI settings updated' })
  async updateAISettings(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: AISettingsDto,
  ) {
    return this.settingsService.updateAISettings(user.tenantId, dto);
  }

  @Public()
  @Get('ai/models')
  @ApiOperation({ summary: 'Get available AI models' })
  @ApiResponse({ status: 200, description: 'List of available models (free + paid)' })
  async getAvailableModels() {
    return OpenRouterService.getAvailableModels();
  }
}
