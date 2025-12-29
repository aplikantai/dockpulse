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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BrandingService } from './branding.service';
import {
  ExtractBrandingDto,
  PreviewBrandingDto,
  ColorShadesDto,
} from './dto/extract-branding.dto';
import { BrandingResult, BrandingSettings } from './interfaces/branding.interface';
import { OpenRouterService } from './services/openrouter.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('branding')
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
  @ApiOperation({
    summary: 'Extract and save branding',
    description: 'Extracts branding from website URL and saves to tenant database',
  })
  @ApiResponse({ status: 200, description: 'Branding extracted and saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid URL or SSRF attempt blocked' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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
  @ApiOperation({
    summary: 'Preview branding',
    description: 'Extracts branding from website URL without saving (for preview)',
  })
  @ApiResponse({ status: 200, description: 'Branding preview generated' })
  @ApiResponse({ status: 400, description: 'Invalid URL or SSRF attempt blocked' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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
  @ApiOperation({
    summary: 'Generate color shades',
    description: 'Generates 10 shades (50-900) from a base HEX color',
  })
  @ApiResponse({
    status: 200,
    description: 'Color shades generated',
    schema: {
      example: {
        '50': '#f0f4fa',
        '100': '#e1e8f4',
        '500': '#2B579A',
        '900': '#0f1e36',
      },
    },
  })
  async generateColorShades(
    @Body() dto: ColorShadesDto,
  ): Promise<Record<string, string>> {
    return this.brandingService.generateColorShades(dto.color);
  }

  /**
   * Health check for OpenRouter models
   * GET /api/branding/health
   * IMPORTANT: Must be BEFORE :tenantSlug to avoid route collision
   */
  @Public()
  @Get('health')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check OpenRouter LLM models availability',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status',
    schema: {
      example: {
        status: 'ok',
        models: { text_primary: true, vision_primary: true },
        lastChecked: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async healthCheck() {
    return this.openRouterService.healthCheck();
  }

  /**
   * Get tenant branding
   * GET /api/branding/:tenantSlug
   * NOTE: Wildcard route - must be LAST among GET routes
   */
  @Public()
  @Get(':tenantSlug')
  @ApiOperation({
    summary: 'Get tenant branding',
    description: 'Retrieve saved branding for a tenant (cached for 5 minutes)',
  })
  @ApiParam({ name: 'tenantSlug', description: 'Tenant slug identifier', example: 'my-company' })
  @ApiResponse({ status: 200, description: 'Branding data returned' })
  @ApiResponse({ status: 404, description: 'Tenant or branding not found' })
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
