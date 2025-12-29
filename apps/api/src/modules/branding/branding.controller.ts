import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { BrandingService } from './branding.service';
import {
  ExtractBrandingDto,
  PreviewBrandingDto,
} from './dto/extract-branding.dto';
import { BrandingResult, BrandingSettings } from './interfaces/branding.interface';
import { OpenRouterService } from './services/openrouter.service';

@Controller('branding')
export class BrandingController {
  private readonly logger = new Logger(BrandingController.name);

  constructor(
    private readonly brandingService: BrandingService,
    private readonly openRouterService: OpenRouterService,
  ) {}

  /**
   * Extract and SAVE branding to tenant
   * POST /api/branding/extract
   * Rate limited: 10 requests per minute (heavy LLM + scraping operation)
   */
  @Post('extract')
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async extractBranding(
    @Body() dto: ExtractBrandingDto,
  ): Promise<BrandingResult> {
    this.logger.log(`Extracting and saving branding for tenant: ${dto.tenantSlug}`);

    return this.brandingService.extractAndSaveBranding(
      dto.websiteUrl,
      dto.tenantSlug,
    );
  }

  /**
   * Preview branding (without saving)
   * POST /api/branding/preview
   * Rate limited: 10 requests per minute (heavy LLM + scraping operation)
   */
  @Post('preview')
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async previewBranding(
    @Body() dto: PreviewBrandingDto,
  ): Promise<BrandingResult> {
    this.logger.log(`Previewing branding for URL: ${dto.websiteUrl}`);

    return this.brandingService.extractBrandingFromWebsite(
      dto.websiteUrl,
      'preview',
    );
  }

  /**
   * Generate color shades from a base color
   * POST /api/branding/colors/shades
   */
  @Post('colors/shades')
  @HttpCode(HttpStatus.OK)
  async generateColorShades(
    @Body() dto: { color: string },
  ): Promise<Record<string, string>> {
    return this.brandingService.generateColorShades(dto.color);
  }

  /**
   * Health check for OpenRouter models
   * GET /api/branding/health
   * IMPORTANT: Must be BEFORE :tenantSlug to avoid route collision
   */
  @Get('health')
  async healthCheck() {
    return this.openRouterService.healthCheck();
  }

  /**
   * Get tenant branding
   * GET /api/branding/:tenantSlug
   * NOTE: Wildcard route - must be LAST among GET routes
   */
  @Get(':tenantSlug')
  async getTenantBranding(
    @Param('tenantSlug') tenantSlug: string,
  ): Promise<BrandingSettings> {
    this.logger.log(`Getting branding for tenant: ${tenantSlug}`);

    const branding = await this.brandingService.getTenantBranding(tenantSlug);

    if (!branding) {
      throw new NotFoundException(`Branding not found for tenant: ${tenantSlug}`);
    }

    return branding;
  }
}
