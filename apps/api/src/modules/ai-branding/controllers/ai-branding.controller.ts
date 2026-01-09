import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Version,
} from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { BrandExtractorService } from '../services/brand-extractor.service';
import { TenantOnboardingService } from '../services/tenant-onboarding.service';
import { AiAnalyzerService } from '../services/ai-analyzer.service';
import { PrismaService } from '../../database/prisma.service';
import {
  AnalyzeBrandDto,
  UpdateAiConfigDto,
  AI_PROVIDERS,
  AiProviderEnum,
} from '../dto/brand-extraction.dto';
import {
  OnboardTenantDto,
  ValidateSubdomainDto,
  RebrandTenantDto,
} from '../dto/tenant-onboarding.dto';

/**
 * AiBrandingController - REST API for AI Branding / OMENROUTER
 *
 * Base path: /api/v1/ai-branding
 */
@Controller({ path: 'ai-branding', version: '1' })
export class AiBrandingController {
  constructor(
    private readonly brandExtractor: BrandExtractorService,
    private readonly onboarding: TenantOnboardingService,
    private readonly aiAnalyzer: AiAnalyzerService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================
  // BRAND EXTRACTION
  // ============================================

  /**
   * POST /api/ai-branding/analyze
   * Analyze website for brand information
   */
  @Public()
  @Post('analyze')
  async analyzeBrand(
    @Body() dto: AnalyzeBrandDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.brandExtractor.extractBrand(dto, userId);
  }

  /**
   * GET /api/ai-branding/extractions/:id
   * Get extraction by ID
   */
  @Get('extractions/:id')
  async getExtraction(@Param('id') id: string) {
    const result = await this.brandExtractor.getExtraction(id);
    if (!result) {
      throw new BadRequestException('Extraction not found');
    }
    return result;
  }

  /**
   * GET /api/ai-branding/history
   * Get extraction history
   */
  @Get('history')
  async getHistory(
    @Headers('x-tenant-id') tenantId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.brandExtractor.getHistory(
      tenantId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  /**
   * POST /api/ai-branding/extractions/:id/retry
   * Retry failed extraction
   */
  @Post('extractions/:id/retry')
  async retryExtraction(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.brandExtractor.retryExtraction(id, userId);
  }

  // ============================================
  // TENANT ONBOARDING
  // ============================================

  /**
   * POST /api/ai-branding/onboard
   * Full tenant onboarding with AI branding (public - self-service signup)
   */
  @Public()
  @Post('onboard')
  async onboardTenant(
    @Body() dto: OnboardTenantDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.onboarding.onboardTenant(dto, userId);
  }

  /**
   * POST /api/ai-branding/validate-subdomain
   * Validate subdomain availability
   */
  @Public()
  @Post('validate-subdomain')
  @HttpCode(HttpStatus.OK)
  async validateSubdomain(@Body() dto: ValidateSubdomainDto) {
    return this.onboarding.validateSubdomain(dto);
  }

  /**
   * POST /api/ai-branding/tenants/:id/rebrand
   * Re-extract branding for existing tenant
   */
  @Post('tenants/:id/rebrand')
  async rebrandTenant(
    @Param('id') tenantId: string,
    @Body() dto: RebrandTenantDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.onboarding.rebrandTenant(tenantId, dto.websiteUrl, userId);
  }

  // ============================================
  // AI CONFIGURATION
  // ============================================

  /**
   * GET /api/ai-branding/providers
   * Get available AI providers
   */
  @Public()
  @Get('providers')
  getProviders() {
    return AI_PROVIDERS;
  }

  /**
   * GET /api/ai-branding/config
   * Get AI configuration
   */
  @Get('config')
  async getConfig(@Headers('x-tenant-id') tenantId?: string) {
    const configs = await this.prisma.aiModelConfig.findMany({
      where: tenantId ? { OR: [{ tenantId }, { tenantId: null }] } : { tenantId: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return configs.map(c => ({
      id: c.id,
      tenantId: c.tenantId,
      provider: c.provider,
      modelName: c.modelName,
      baseUrl: c.baseUrl,
      maxTokens: c.maxTokens,
      temperature: c.temperature,
      brandExtraction: c.brandExtraction,
      contentGeneration: c.contentGeneration,
      chatAssistant: c.chatAssistant,
      isActive: c.isActive,
      isDefault: c.isDefault,
      totalRequests: c.totalRequests,
      totalTokensUsed: c.totalTokensUsed,
      lastRequestAt: c.lastRequestAt,
      // Don't expose API key
      hasApiKey: !!c.apiKey,
    }));
  }

  /**
   * POST /api/ai-branding/config
   * Create AI configuration
   */
  @Post('config')
  async createConfig(
    @Body() dto: UpdateAiConfigDto & { provider: AiProviderEnum },
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.prisma.aiModelConfig.create({
      data: {
        tenantId,
        provider: dto.provider,
        modelName: dto.modelName || 'llama2',
        apiKey: dto.apiKey,
        baseUrl: dto.baseUrl,
        maxTokens: dto.maxTokens || 2000,
        temperature: dto.temperature || 0.7,
        brandExtraction: dto.brandExtraction ?? true,
        contentGeneration: dto.contentGeneration ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * PUT /api/ai-branding/config/:id
   * Update AI configuration
   */
  @Put('config/:id')
  async updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateAiConfigDto,
  ) {
    return this.prisma.aiModelConfig.update({
      where: { id },
      data: {
        provider: dto.provider,
        modelName: dto.modelName,
        apiKey: dto.apiKey,
        baseUrl: dto.baseUrl,
        maxTokens: dto.maxTokens,
        temperature: dto.temperature,
        brandExtraction: dto.brandExtraction,
        contentGeneration: dto.contentGeneration,
        isActive: dto.isActive,
      },
    });
  }

  /**
   * POST /api/ai-branding/config/:id/test
   * Test AI provider connection
   */
  @Post('config/:id/test')
  async testConfig(@Param('id') id: string) {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new BadRequestException('Config not found');
    }

    return this.aiAnalyzer.testConnection(config.provider, {
      apiKey: config.apiKey || undefined,
      baseUrl: config.baseUrl || undefined,
      model: config.modelName,
    });
  }

  /**
   * POST /api/ai-branding/config/test-provider
   * Test AI provider without saving config
   */
  @Post('config/test-provider')
  @HttpCode(HttpStatus.OK)
  async testProvider(
    @Body() dto: { provider: AiProviderEnum; apiKey?: string; baseUrl?: string; model?: string },
  ) {
    return this.aiAnalyzer.testConnection(dto.provider as any, {
      apiKey: dto.apiKey,
      baseUrl: dto.baseUrl,
      model: dto.model,
    });
  }
}
