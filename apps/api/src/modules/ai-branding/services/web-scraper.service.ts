import { Injectable, Logger } from '@nestjs/common';
import { BrandExtractionResult } from '../dto/brand-extraction.dto';

/**
 * Scraped page data
 */
export interface ScrapedPageData {
  url: string;
  domain: string;
  html: string;

  // Meta tags
  title?: string;
  description?: string;
  keywords?: string[];

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogSiteName?: string;

  // Twitter Card
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;

  // Favicon
  favicon?: string;
  appleTouchIcon?: string;

  // Theme
  themeColor?: string;

  // Schema.org
  schemaOrg?: any;

  // Links
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };

  // Contact
  emails: string[];
  phones: string[];
  addresses: string[];
}

/**
 * WebScraperService - Fetches and parses web pages for brand data
 */
@Injectable()
export class WebScraperService {
  private readonly logger = new Logger(WebScraperService.name);
  private readonly timeout = 15000; // 15 seconds

  /**
   * Scrape a URL and extract metadata
   */
  async scrape(url: string): Promise<ScrapedPageData> {
    const startTime = Date.now();

    try {
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(url);
      const domain = this.extractDomain(normalizedUrl);

      this.logger.log(`Scraping: ${normalizedUrl}`);

      // Fetch page HTML
      const html = await this.fetchPage(normalizedUrl);

      // Parse HTML for metadata
      const data = this.parseHtml(html, normalizedUrl, domain);

      const elapsed = Date.now() - startTime;
      this.logger.log(`Scraped ${domain} in ${elapsed}ms`);

      return data;
    } catch (error) {
      this.logger.error(`Failed to scrape ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract basic brand data from scraped page (without AI)
   */
  extractBrandFromMetaTags(data: ScrapedPageData): Partial<BrandExtractionResult> {
    const companyName =
      data.ogSiteName ||
      data.schemaOrg?.name ||
      data.ogTitle?.split(' - ')[0]?.split(' | ')[0] ||
      data.title?.split(' - ')[0]?.split(' | ')[0] ||
      this.formatDomainAsName(data.domain);

    const description =
      data.ogDescription ||
      data.description ||
      data.schemaOrg?.description ||
      '';

    const logoUrl =
      data.ogImage ||
      data.schemaOrg?.logo ||
      data.appleTouchIcon ||
      `https://logo.clearbit.com/${data.domain}`;

    const faviconUrl =
      data.favicon ||
      data.appleTouchIcon ||
      `https://${data.domain}/favicon.ico`;

    return {
      companyName,
      domain: data.domain,
      description,
      logo: logoUrl ? { url: logoUrl } : null,
      favicon: faviconUrl ? { url: faviconUrl } : null,
      brandColors: {
        primary: data.themeColor || '#3B82F6',
        secondary: '#1E40AF',
      },
      contact: {
        email: data.emails[0],
        phone: data.phones[0],
        address: data.addresses[0],
      },
      socialLinks: data.socialLinks,
      extractedAt: new Date(),
      confidence: 0.6, // Meta tags only = 60% confidence
      source: 'meta_tags',
    };
  }

  /**
   * Normalize URL (add https if missing)
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();

    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }

    // Remove trailing slash
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      // Fallback: extract from string
      return url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
    }
  }

  /**
   * Fetch page HTML
   */
  private async fetchPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DockPulseBot/1.0; +https://dockpulse.com/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Limit size (max 5MB)
      if (html.length > 5 * 1024 * 1024) {
        return html.substring(0, 5 * 1024 * 1024);
      }

      return html;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse HTML and extract metadata
   */
  private parseHtml(html: string, url: string, domain: string): ScrapedPageData {
    const data: ScrapedPageData = {
      url,
      domain,
      html,
      socialLinks: {},
      emails: [],
      phones: [],
      addresses: [],
    };

    // Helper to extract meta content
    const getMeta = (name: string, property?: string): string | undefined => {
      const nameMatch = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'));
      if (nameMatch) return nameMatch[1];

      const propertyMatch = html.match(new RegExp(`<meta[^>]+property=["']${property || name}["'][^>]+content=["']([^"']+)["']`, 'i'));
      if (propertyMatch) return propertyMatch[1];

      // Try reverse order (content before name)
      const reverseMatch = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${property || name}["']`, 'i'));
      return reverseMatch?.[1];
    };

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    data.title = titleMatch?.[1]?.trim();

    // Meta description
    data.description = getMeta('description');

    // Keywords
    const keywords = getMeta('keywords');
    if (keywords) {
      data.keywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
    }

    // Open Graph
    data.ogTitle = getMeta('og:title', 'og:title');
    data.ogDescription = getMeta('og:description', 'og:description');
    data.ogImage = getMeta('og:image', 'og:image');
    data.ogSiteName = getMeta('og:site_name', 'og:site_name');

    // Twitter Card
    data.twitterTitle = getMeta('twitter:title', 'twitter:title');
    data.twitterDescription = getMeta('twitter:description', 'twitter:description');
    data.twitterImage = getMeta('twitter:image', 'twitter:image');

    // Theme color
    data.themeColor = getMeta('theme-color') || getMeta('msapplication-TileColor');

    // Favicon
    const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i);
    if (faviconMatch) {
      data.favicon = this.resolveUrl(faviconMatch[1], url);
    }

    // Apple touch icon
    const appleIconMatch = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i);
    if (appleIconMatch) {
      data.appleTouchIcon = this.resolveUrl(appleIconMatch[1], url);
    }

    // Schema.org JSON-LD
    const schemaMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (schemaMatch) {
      try {
        const schemas = JSON.parse(schemaMatch[1]);
        const orgSchema = Array.isArray(schemas)
          ? schemas.find(s => s['@type'] === 'Organization')
          : schemas['@type'] === 'Organization' ? schemas : null;
        data.schemaOrg = orgSchema;
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Social links
    const socialPatterns = [
      { key: 'facebook', pattern: /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"']+)["']/gi },
      { key: 'instagram', pattern: /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/gi },
      { key: 'linkedin', pattern: /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"']+)["']/gi },
      { key: 'twitter', pattern: /href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"']+)["']/gi },
      { key: 'youtube', pattern: /href=["'](https?:\/\/(?:www\.)?youtube\.com\/[^"']+)["']/gi },
    ];

    for (const { key, pattern } of socialPatterns) {
      const match = pattern.exec(html);
      if (match) {
        data.socialLinks[key as keyof typeof data.socialLinks] = match[1];
      }
    }

    // Email addresses
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emails = html.match(emailPattern) || [];
    data.emails = [...new Set(emails)].slice(0, 5);

    // Phone numbers (Polish format)
    const phonePattern = /(?:\+48|48)?[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}/g;
    const phones = html.match(phonePattern) || [];
    data.phones = [...new Set(phones)].slice(0, 3);

    return data;
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(relative: string, base: string): string {
    if (relative.startsWith('http://') || relative.startsWith('https://') || relative.startsWith('//')) {
      return relative.startsWith('//') ? 'https:' + relative : relative;
    }

    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }

  /**
   * Format domain as company name
   */
  private formatDomainAsName(domain: string): string {
    // Remove TLD
    const name = domain.split('.')[0];

    // Capitalize first letter of each word
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
