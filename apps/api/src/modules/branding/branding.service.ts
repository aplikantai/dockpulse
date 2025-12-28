import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import {
  BrandingResult,
  BrandColors,
  ExtractedCompanyData,
} from './interfaces/branding.interface';
import {
  EXTRACT_COMPANY_DATA_PROMPT,
  EXTRACT_COLORS_PROMPT,
  OPENROUTER_MODELS,
} from './prompts';

@Injectable()
export class BrandingService {
  private readonly logger = new Logger(BrandingService.name);
  private readonly openrouter: OpenAI;

  constructor() {
    this.openrouter = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://dockpulse.com',
        'X-Title': 'DockPulse',
      },
    });
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

      // 4. Extract colors from logo with Vision API
      const colors = logoUrl
        ? await this.extractColorsFromLogo(logoUrl)
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
   * Fetch HTML content from a website
   */
  private async fetchWebsiteHTML(url: string): Promise<string> {
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
      const response = await this.openrouter.chat.completions.create({
        model: OPENROUTER_MODELS.text.primary,
        messages: [
          {
            role: 'user',
            content: EXTRACT_COMPANY_DATA_PROMPT
              .replace('{{HTML}}', truncatedHtml)
              .replace('{{META}}', JSON.stringify(metaInfo))
              .replace('{{BASE_URL}}', baseUrl),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty LLM response');
      }

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
   * Extract colors from logo using Vision AI
   */
  private async extractColorsFromLogo(logoUrl: string): Promise<BrandColors> {
    if (!logoUrl) {
      return this.getDefaultColors();
    }

    try {
      // Convert logo to base64
      const logoBase64 = await this.imageToBase64(logoUrl);

      const response = await this.openrouter.chat.completions.create({
        model: OPENROUTER_MODELS.vision.primary,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACT_COLORS_PROMPT },
              {
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${logoBase64}` },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty Vision API response');
      }

      const colors = JSON.parse(content);

      // Validate HEX format
      const isValidHex = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);

      return {
        primary: isValidHex(colors.primary) ? colors.primary : '#2B579A',
        secondary: isValidHex(colors.secondary) ? colors.secondary : '#4472C4',
        accent: isValidHex(colors.accent) ? colors.accent : '#70AD47',
      };
    } catch (error) {
      this.logger.error(`Color extraction failed: ${error.message}`);
      return this.getDefaultColors();
    }
  }

  /**
   * Convert image URL to base64
   */
  private async imageToBase64(url: string): Promise<string> {
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
      primary: '#2B579A',
      secondary: '#4472C4',
      accent: '#70AD47',
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
}
