import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MODULES, DEFAULT_MODULES, ORDER_STATUSES, ENTITY_NAMING } from '../../common/constants';
import { AISettingsDto, TenantAISettings } from './dto/ai-settings.dto';

type TemplateType = 'services' | 'production' | 'trade';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================
  // MODULES
  // ===========================================

  async getModules(tenantId: string) {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { template: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const modules = await (this.prisma as any).tenantModule.findMany({
      where: { tenantId },
      orderBy: { moduleCode: 'asc' },
    });

    // Get default modules for this template
    const template = tenant.template as TemplateType;
    const defaultModules = DEFAULT_MODULES[template] || DEFAULT_MODULES.services;

    return {
      template,
      modules,
      defaultModules,
      availableModules: Object.values(MODULES),
    };
  }

  async toggleModule(tenantId: string, moduleCode: string, isEnabled: boolean) {
    // Upsert module configuration
    const module = await (this.prisma as any).tenantModule.upsert({
      where: {
        tenantId_moduleCode: { tenantId, moduleCode },
      },
      update: { isEnabled },
      create: {
        tenantId,
        moduleCode,
        isEnabled,
      },
    });

    return module;
  }

  async isModuleEnabled(tenantId: string, moduleCode: string): Promise<boolean> {
    const module = await (this.prisma as any).tenantModule.findUnique({
      where: {
        tenantId_moduleCode: { tenantId, moduleCode },
      },
    });

    if (module) {
      return module.isEnabled;
    }

    // Check if it's a default module for this tenant's template
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { template: true },
    });

    if (!tenant) return false;

    const template = tenant.template as TemplateType;
    const defaultModules = DEFAULT_MODULES[template] || DEFAULT_MODULES.services;
    return defaultModules.includes(moduleCode as any);
  }

  async initializeModulesForTenant(tenantId: string, template: TemplateType) {
    const defaultModules = DEFAULT_MODULES[template] || DEFAULT_MODULES.services;
    const allModules = Object.values(MODULES);

    const modulesToCreate = allModules.map((moduleCode) => ({
      tenantId,
      moduleCode,
      isEnabled: defaultModules.includes(moduleCode as any),
    }));

    await (this.prisma as any).tenantModule.createMany({
      data: modulesToCreate,
      skipDuplicates: true,
    });

    return this.getModules(tenantId);
  }

  // ===========================================
  // FIELD CONFIGS
  // ===========================================

  async getFieldConfigs(tenantId: string, entityType?: string) {
    const where: any = { tenantId };
    if (entityType) {
      where.entityType = entityType;
    }

    return (this.prisma as any).fieldConfig.findMany({
      where,
      orderBy: [{ entityType: 'asc' }, { displayOrder: 'asc' }],
    });
  }

  async updateFieldConfig(
    tenantId: string,
    entityType: string,
    fieldName: string,
    data: {
      isVisible?: boolean;
      isRequired?: boolean;
      displayOrder?: number;
      label?: string;
    },
  ) {
    return (this.prisma as any).fieldConfig.upsert({
      where: {
        tenantId_entityType_fieldName: { tenantId, entityType, fieldName },
      },
      update: data,
      create: {
        tenantId,
        entityType,
        fieldName,
        ...data,
      },
    });
  }

  // ===========================================
  // WORKFLOW TRIGGERS
  // ===========================================

  async getTriggers(tenantId: string, eventType?: string) {
    const where: any = { tenantId };
    if (eventType) {
      where.eventType = eventType;
    }

    return (this.prisma as any).workflowTrigger.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async toggleTrigger(tenantId: string, triggerCode: string, isEnabled: boolean) {
    return (this.prisma as any).workflowTrigger.update({
      where: {
        tenantId_code: { tenantId, code: triggerCode },
      },
      data: { isEnabled },
    });
  }

  async createTrigger(
    tenantId: string,
    data: {
      code: string;
      name: string;
      eventType: string;
      actionType: string;
      actionConfig?: object;
      conditions?: object;
      isEnabled?: boolean;
    },
  ) {
    return (this.prisma as any).workflowTrigger.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        eventType: data.eventType,
        actionType: data.actionType,
        actionConfig: data.actionConfig || {},
        conditions: data.conditions || {},
        isEnabled: data.isEnabled ?? true,
      },
    });
  }

  // ===========================================
  // TEMPLATE HELPERS
  // ===========================================

  getOrderStatuses(template: TemplateType) {
    return ORDER_STATUSES[template] || ORDER_STATUSES.services;
  }

  getEntityNaming(template: TemplateType) {
    return ENTITY_NAMING[template] || ENTITY_NAMING.services;
  }

  async getTenantConfig(tenantId: string) {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { template: true, settings: true, branding: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const template = tenant.template as TemplateType;

    return {
      template,
      statuses: this.getOrderStatuses(template),
      naming: this.getEntityNaming(template),
      settings: tenant.settings,
      branding: tenant.branding,
    };
  }

  // ===========================================
  // AI SETTINGS
  // ===========================================

  async getAISettings(tenantId: string): Promise<TenantAISettings> {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const settings = (tenant.settings || {}) as any;
    const aiSettings = settings.ai || {};

    return {
      openrouterApiKey: aiSettings.openrouterApiKey || null,
      models: aiSettings.models || {
        text: 'google/gemini-2.0-flash-exp:free',
        vision: 'google/gemini-2.0-flash-exp:free',
        code: 'mistralai/devstral-2512:free',
      },
      enableAIBranding: aiSettings.enableAIBranding ?? true,
      enableAIAssistant: aiSettings.enableAIAssistant ?? false,
    };
  }

  async updateAISettings(
    tenantId: string,
    dto: AISettingsDto,
  ): Promise<TenantAISettings> {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const settings = (tenant.settings || {}) as any;
    const currentAI = settings.ai || {};

    // Merge new AI settings
    const updatedAI: TenantAISettings = {
      openrouterApiKey: dto.openrouterApiKey ?? currentAI.openrouterApiKey,
      models: {
        text: dto.models?.textModel ?? currentAI.models?.text ?? 'google/gemini-2.0-flash-exp:free',
        vision: dto.models?.visionModel ?? currentAI.models?.vision ?? 'google/gemini-2.0-flash-exp:free',
        code: dto.models?.codeModel ?? currentAI.models?.code ?? 'mistralai/devstral-2512:free',
      },
      enableAIBranding: dto.enableAIBranding ?? currentAI.enableAIBranding ?? true,
      enableAIAssistant: dto.enableAIAssistant ?? currentAI.enableAIAssistant ?? false,
    };

    // Update tenant settings
    await (this.prisma as any).tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          ai: updatedAI,
        },
      },
    });

    return updatedAI;
  }
}
