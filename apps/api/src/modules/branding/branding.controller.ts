import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BrandingService } from './branding.service';
import {
  ExtractBrandingDto,
  PreviewBrandingDto,
} from './dto/extract-branding.dto';
import { BrandingResult } from './interfaces/branding.interface';

@Controller('branding')
export class BrandingController {
  private readonly logger = new Logger(BrandingController.name);

  constructor(private readonly brandingService: BrandingService) {}

  /**
   * Extract branding from website (for onboarding)
   * POST /api/branding/extract
   */
  @Post('extract')
  @HttpCode(HttpStatus.OK)
  async extractBranding(
    @Body() dto: ExtractBrandingDto
  ): Promise<BrandingResult> {
    this.logger.log(`Extracting branding for tenant: ${dto.tenantSlug}`);

    return this.brandingService.extractBrandingFromWebsite(
      dto.websiteUrl,
      dto.tenantSlug
    );
  }

  /**
   * Preview branding (without saving)
   * POST /api/branding/preview
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async previewBranding(
    @Body() dto: PreviewBrandingDto
  ): Promise<BrandingResult> {
    this.logger.log(`Previewing branding for URL: ${dto.websiteUrl}`);

    return this.brandingService.extractBrandingFromWebsite(
      dto.websiteUrl,
      'preview'
    );
  }

  /**
   * Generate color shades from a base color
   * POST /api/branding/colors/shades
   */
  @Post('colors/shades')
  @HttpCode(HttpStatus.OK)
  async generateColorShades(
    @Body() dto: { color: string }
  ): Promise<Record<string, string>> {
    return this.brandingService.generateColorShades(dto.color);
  }
}
