import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dns from 'dns';
import { promisify } from 'util';
import {
  BrandingResult,
  BrandColors,
  ExtractedCompanyData,
  BrandingSettings,
} from './interfaces/branding.interface';
import {
  EXTRACT_COMPANY_DATA_PROMPT,
  EXTRACT_COLORS_PROMPT,
} from './prompts';
import { S3Service } from '../storage/s3.service';
import { OpenRouterService } from './services/openrouter.service';
import { PrismaService } from '../database/prisma.service';

const dnsLookup = promisify(dns.lookup);

@Injectable()
export class BrandingService {
  private readonly logger = new Logger(BrandingService.name);

  private readonly CACHE_TTL = 300000; // 5 minutes
  private readonly CACHE_PREFIX = 'branding:';

  constructor(
    private readonly s3Service: S3Service,
    private readonly openRouterService: OpenRouterService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * SSRF Protection: Validate URL is safe to fetch
   * Blocks private IPs, localhost, metadata endpoints
   */
  private async validateUrlSecurity(url: string): Promise<void> {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new BadRequestException('Only HTTP/HTTPS URLs are allowed');
    }

    const hostname = parsedUrl.hostname;

    // Block localhost variants
    const localhostPatterns = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
    if (localhostPatterns.includes(hostname.toLowerCase())) {
      throw new BadRequestException('Localhost URLs are not allowed');
    }

    // Resolve hostname to IP and check if private
    try {
      const { address } = await dnsLookup(hostname);
      if (this.isPrivateIP(address)) {
        throw new BadRequestException('Private IP addresses are not allowed');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Cannot resolve hostname: ${hostname}`);
    }
  }

  /**
   * Check if IP is private/internal
   */
  private isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);

    // IPv4 checks
    if (parts.length === 4) {
      // 10.0.0.0/8
      if (parts[0] === 10) return true;
      // 172.16.0.0/12
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) return true;
      // 127.0.0.0/8 (localhost)
      if (parts[0] === 127) return true;
      // 169.254.0.0/16 (link-local, includes AWS metadata)
      if (parts[0] === 169 && parts[1] === 254) return true;
      // 0.0.0.0
      if (parts.every(p => p === 0)) return true;
    }

    // IPv6 localhost
    if (ip === '::1' || ip === '::') return true;

    return false;
  }

  /**
   * Extract branding information from a website URL
   */
  async extractBrandingFromWebsite(
    websiteUrl: string,
    tenantSlug: string
  ): Promise<BrandingResult> {
    this.logger.log(`Extracting branding from: ${websiteUrl}`);

    try {
      // 1. Fetch HTML
      const html = await this.fetchWebsiteHTML(websiteUrl);

      // 2. Extract company data with LLM
      const companyData = await this.extractCompanyData(html, websiteUrl);

      // 3. Process assets (download and prepare URLs)
      const logoUrl = this.resolveUrl(companyData.logoUrl, websiteUrl);
      const faviconUrl = this.resolveUrl(companyData.faviconUrl, websiteUrl);

      // 4. Extract colors from favicon (better compatibility than logo - usually PNG not SVG)
      const imageUrl = faviconUrl || logoUrl;
      const colors = imageUrl
        ? await this.extractColorsFromLogo(imageUrl)
        : this.getDefaultColors();

      return {
        companyData: {
          name: companyData.companyName,
          nip: companyData.nip,
          address: companyData.address,
          phone: companyData.phone,
          email: companyData.email,
        },
        branding: {
          logoUrl: logoUrl || '/assets/default-logo.png',
          faviconUrl: faviconUrl || '/favicon.ico',
          colors,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to extract branding: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch HTML content from a website (with SSRF protection)
   */
  private async fetchWebsiteHTML(url: string): Promise<string> {
    // SSRF Protection
    await this.validateUrlSecurity(url);

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DockPulse/1.0; +https://dockpulse.com)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'pl,en;q=0.9',
        },
        timeout: 15000,
        maxRedirects: 5,
      });
      return response.data;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch ${url}: ${error.message}`);
      throw new Error(`Cannot fetch website: ${url}`);
    }
  }

  /**
   * Extract company data using LLM
   */
  private async extractCompanyData(
    html: string,
    baseUrl: string
  ): Promise<ExtractedCompanyData> {
    // Parse HTML to extract meta tags first
    const $ = cheerio.load(html);

    const metaInfo = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      ogTitle: $('meta[property="og:title"]').attr('content'),
      favicon:
        $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        '/favicon.ico',
    };

    // Find potential logos
    const logoSelectors = [
      'img[alt*="logo" i]',
      'img[src*="logo" i]',
      'img[class*="logo" i]',
      'header img:first-of-type',
      '.logo img',
      '#logo img',
    ];

    let logoUrl: string | undefined;
    for (const selector of logoSelectors) {
      const logo = $(selector).first();
      if (logo.length) {
        logoUrl = logo.attr('src');
        break;
      }
    }

    // Truncate HTML for LLM (keep first 8000 chars)
    const truncatedHtml = html.slice(0, 8000);

    try {
      const content = await this.openRouterService.textCompletion({
        messages: [
          {
            role: 'user',
            content: EXTRACT_COMPANY_DATA_PROMPT
              .replace('{{HTML}}', truncatedHtml)
              .replace('{{META}}', JSON.stringify(metaInfo))
              .replace('{{BASE_URL}}', baseUrl),
          },
        ],
        responseFormat: { type: 'json_object' },
        temperature: 0.1,
        maxTokens: 1000,
      });

      const result = JSON.parse(content) as ExtractedCompanyData;

      // Use found logo if LLM didn't find one
      if (!result.logoUrl && logoUrl) {
        result.logoUrl = logoUrl;
      }

      // Use meta favicon if not found
      if (!result.faviconUrl && metaInfo.favicon) {
        result.faviconUrl = metaInfo.favicon;
      }

      // Fallback company name to title
      if (!result.companyName && metaInfo.title) {
        result.companyName = metaInfo.title.split('|')[0].split('-')[0].trim();
      }

      return result;
    } catch (error) {
      this.logger.error(`LLM extraction failed: ${error.message}`);

      // Return fallback data
      return {
        companyName: metaInfo.title?.split('|')[0]?.split('-')[0]?.trim() || 'Company',
        logoUrl: logoUrl,
        faviconUrl: metaInfo.favicon,
      };
    }
  }

  /**
   * Extract colors from logo using algorithmic pixel analysis
   * Fast, free, no AI required!
   */
  private async extractColorsFromLogo(logoUrl: string): Promise<BrandColors> {
    if (!logoUrl) {
      return this.getDefaultColors();
    }

    try {
      // Import color extractor
      const { extractColorsFromImage } = await import('./utils/color-extractor');

      // Resolve relative URL to absolute
      const absoluteUrl = this.resolveUrl(logoUrl, logoUrl);
      if (!absoluteUrl) {
        throw new Error('Invalid logo URL');
      }

      this.logger.log(`Extracting colors from logo: ${absoluteUrl}`);

      // Extract dominant colors using k-means clustering
      const colors = await extractColorsFromImage(absoluteUrl);

      this.logger.log(`Extracted colors: ${JSON.stringify(colors)}`);

      return {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
      };
    } catch (error) {
      this.logger.warn(`Color extraction failed (using defaults): ${error.message}`);
      return this.getDefaultColors();
    }
  }

  /**
   * Convert image URL to base64 (with SSRF protection)
   */
  private async imageToBase64(url: string): Promise<string> {
    // Handle data URIs (commonly used for embedded logos)
    if (url.startsWith('data:')) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        // Already base64 encoded
        return match[2];
      }

      // Handle URL-encoded data URIs
      const urlEncodedMatch = url.match(/^data:([^,]+),(.+)$/);
      if (urlEncodedMatch) {
        const decodedData = decodeURIComponent(urlEncodedMatch[2]);
        return Buffer.from(decodedData).toString('base64');
      }

      throw new Error('Invalid data URI format');
    }

    // SSRF Protection for HTTP/HTTPS URLs
    await this.validateUrlSecurity(url);

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DockPulse/1.0)',
      },
    });
    return Buffer.from(response.data).toString('base64');
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(path: string | undefined, baseUrl: string): string | undefined {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    try {
      return new URL(path, baseUrl).href;
    } catch {
      return undefined;
    }
  }

  /**
   * Get default DockPulse color palette
   */
  private getDefaultColors(): BrandColors {
    return {
      primary: '#6366f1',    // Indigo (from logo gradient)
      secondary: '#8b5cf6',  // Purple (from logo gradient)
      accent: '#22d3ee',     // Cyan (pulse line color)
    };
  }

  /**
   * Generate color shades from a base color
   */
  generateColorShades(hexColor: string): Record<string, string> {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return {};

    const shades: Record<string, string> = {};

    // Light shades (50-400)
    const lightFactors = [0.95, 0.9, 0.8, 0.6, 0.4];
    [50, 100, 200, 300, 400].forEach((shade, index) => {
      shades[shade] = this.lightenColor(rgb, lightFactors[index]);
    });

    // Base (500)
    shades[500] = hexColor;

    // Dark shades (600-900)
    const darkFactors = [0.1, 0.25, 0.4, 0.55];
    [600, 700, 800, 900].forEach((shade, index) => {
      shades[shade] = this.darkenColor(rgb, darkFactors[index]);
    });

    return shades;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private lightenColor(
    rgb: { r: number; g: number; b: number },
    factor: number
  ): string {
    const r = Math.round(rgb.r + (255 - rgb.r) * factor);
    const g = Math.round(rgb.g + (255 - rgb.g) * factor);
    const b = Math.round(rgb.b + (255 - rgb.b) * factor);
    return this.rgbToHex(r, g, b);
  }

  private darkenColor(
    rgb: { r: number; g: number; b: number },
    factor: number
  ): string {
    const r = Math.round(rgb.r * (1 - factor));
    const g = Math.round(rgb.g * (1 - factor));
    const b = Math.round(rgb.b * (1 - factor));
    return this.rgbToHex(r, g, b);
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Upload branding assets to S3 and return new URLs
   */
  async uploadBrandingAssets(
    tenantSlug: string,
    logoUrl: string,
    faviconUrl?: string,
  ): Promise<{ logoUrl: string; faviconUrl?: string }> {
    const result: { logoUrl: string; faviconUrl?: string } = {
      logoUrl: logoUrl,
    };

    try {
      // Upload logo
      if (logoUrl && !logoUrl.startsWith('/assets/')) {
        const logoKey = this.s3Service.generateAssetKey(tenantSlug, 'logo', 'logo.png');
        const uploadResult = await this.s3Service.uploadFromUrl(logoKey, logoUrl, 'image/png');
        result.logoUrl = uploadResult.url;
        this.logger.log(`Logo uploaded to S3: ${result.logoUrl}`);
      }

      // Upload favicon
      if (faviconUrl && !faviconUrl.startsWith('/')) {
        const faviconKey = this.s3Service.generateAssetKey(tenantSlug, 'favicon', 'favicon.ico');
        const uploadResult = await this.s3Service.uploadFromUrl(faviconKey, faviconUrl);
        result.faviconUrl = uploadResult.url;
        this.logger.log(`Favicon uploaded to S3: ${result.faviconUrl}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to upload assets: ${error.message}`);
      // Return original URLs on failure
    }

    return result;
  }

  /**
   * Save branding to tenant in platform database (invalidates cache)
   */
  async saveBrandingToTenant(
    tenantSlug: string,
    branding: BrandingResult,
  ): Promise<void> {
    this.logger.log(`Saving branding for tenant: ${tenantSlug}`);

    const brandingSettings: BrandingSettings = {
      logoUrl: branding.branding.logoUrl,
      faviconUrl: branding.branding.faviconUrl,
      companyName: branding.companyData.name,
      colors: branding.branding.colors,
      companyData: {
        nip: branding.companyData.nip,
        address: branding.companyData.address,
        phone: branding.companyData.phone,
        email: branding.companyData.email,
      },
    };

    await (this.prisma as any).tenant.update({
      where: { slug: tenantSlug },
      data: {
        branding: brandingSettings as any, // Prisma JSONB
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    const cacheKey = `${this.CACHE_PREFIX}${tenantSlug}`;
    try {
      await this.cacheManager.del(cacheKey);
      this.logger.debug(`Cache invalidated for tenant: ${tenantSlug}`);
    } catch (error) {
      this.logger.warn(`Cache invalidation error: ${error.message}`);
    }

    this.logger.log(`Branding saved for tenant: ${tenantSlug}`);
  }

  /**
   * Get branding from tenant (with caching)
   */
  async getTenantBranding(tenantSlug: string): Promise<BrandingSettings | null> {
    const cacheKey = `${this.CACHE_PREFIX}${tenantSlug}`;

    // Check cache first
    try {
      const cached = await this.cacheManager.get<BrandingSettings>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for tenant: ${tenantSlug}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache read error: ${error.message}`);
    }

    // Query database
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { slug: tenantSlug },
      select: { branding: true },
    });

    if (!tenant?.branding || Object.keys(tenant.branding as object).length === 0) {
      return null;
    }

    const branding = tenant.branding as BrandingSettings;

    // Store in cache
    try {
      await this.cacheManager.set(cacheKey, branding, this.CACHE_TTL);
      this.logger.debug(`Cached branding for tenant: ${tenantSlug}`);
    } catch (error) {
      this.logger.warn(`Cache write error: ${error.message}`);
    }

    return branding;
  }

  /**
   * Extract and save branding (full flow)
   */
  async extractAndSaveBranding(
    websiteUrl: string,
    tenantSlug: string,
  ): Promise<BrandingResult> {
    // 1. Extract branding data
    const branding = await this.extractBrandingFromWebsite(websiteUrl, tenantSlug);

    // 2. Upload assets to S3
    const uploadedAssets = await this.uploadBrandingAssets(
      tenantSlug,
      branding.branding.logoUrl,
      branding.branding.faviconUrl,
    );

    // 3. Merge with uploaded URLs
    const result: BrandingResult = {
      ...branding,
      branding: {
        ...branding.branding,
        ...uploadedAssets,
      },
    };

    // 4. Save to database (skip for preview)
    if (tenantSlug !== 'preview') {
      await this.saveBrandingToTenant(tenantSlug, result);
    }

    return result;
  }

  /**
   * Extract branding without saving (for preview)
   */
  async extractAndPersistBranding(
    websiteUrl: string,
    tenantSlug: string,
  ): Promise<BrandingResult> {
    return this.extractAndSaveBranding(websiteUrl, tenantSlug);
  }
}
