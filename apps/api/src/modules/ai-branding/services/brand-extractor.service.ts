import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BrandExtractionStatus, AiProvider } from '@prisma/client';
import { WebScraperService } from './web-scraper.service';
import { AiAnalyzerService } from './ai-analyzer.service';
import {
  BrandExtractionResult,
  AnalyzeBrandDto,
  BrandAnalysisResponseDto,
} from '../dto/brand-extraction.dto';

/**
 * BrandExtractorService - Main service for extracting brand data from websites
 */
@Injectable()
export class BrandExtractorService {
  private readonly logger = new Logger(BrandExtractorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scraper: WebScraperService,
    private readonly aiAnalyzer: AiAnalyzerService,
  ) {}

  /**
   * Extract brand data from a website URL
   */
  async extractBrand(dto: AnalyzeBrandDto, userId?: string): Promise<BrandAnalysisResponseDto> {
    const startTime = Date.now();

    // Validate URL
    const domain = this.scraper.extractDomain(dto.url);
    if (!domain) {
      throw new BadRequestException('Invalid URL');
    }

    // Check for recent extraction (cache for 1 hour)
    const cached = await this.findRecentExtraction(domain);
    if (cached && cached.status === 'COMPLETED') {
      this.logger.log(`Using cached extraction for ${domain}`);
      return this.mapToResponse(cached);
    }

    // Create extraction record
    const extraction = await this.prisma.brandExtraction.create({
      data: {
        tenantId: dto.tenantId,
        inputUrl: dto.url,
        inputDomain: domain,
        status: 'PROCESSING',
        initiatedBy: userId,
      },
    });

    try {
      // Step 1: Scrape website
      this.logger.log(`Scraping ${dto.url}...`);
      const scrapedData = await this.scraper.scrape(dto.url);

      // Step 2: Extract from meta tags
      let result = this.scraper.extractBrandFromMetaTags(scrapedData) as BrandExtractionResult;

      // Step 3: Enhance with AI (if not skipped)
      if (!dto.skipAi) {
        this.logger.log(`Running AI analysis for ${domain}...`);
        const aiData = await this.aiAnalyzer.analyzeBrand(scrapedData);

        // Merge AI data with meta data (AI takes priority for missing fields)
        result = this.mergeBrandData(result, aiData);
      }

      // Step 4: Try Clearbit for logo if not found
      if (!result.logo?.url) {
        result.logo = {
          url: `https://logo.clearbit.com/${domain}`,
        };
      }

      // Finalize
      const processingTime = Date.now() - startTime;

      const updated = await this.prisma.brandExtraction.update({
        where: { id: extraction.id },
        data: {
          status: 'COMPLETED',
          result: result as any,
          companyName: result.companyName,
          logoUrl: result.logo?.url,
          faviconUrl: result.favicon?.url,
          primaryColor: result.brandColors?.primary,
          secondaryColor: result.brandColors?.secondary,
          description: result.description,
          industry: result.industry,
          processingTimeMs: processingTime,
          confidence: result.confidence,
          source: result.source,
        },
      });

      this.logger.log(`Brand extraction completed for ${domain} in ${processingTime}ms`);

      return this.mapToResponse(updated);
    } catch (error) {
      this.logger.error(`Brand extraction failed for ${domain}: ${error.message}`);

      await this.prisma.brandExtraction.update({
        where: { id: extraction.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      return {
        id: extraction.id,
        status: 'FAILED',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Get extraction by ID
   */
  async getExtraction(id: string): Promise<BrandAnalysisResponseDto | null> {
    const extraction = await this.prisma.brandExtraction.findUnique({
      where: { id },
    });

    if (!extraction) return null;

    return this.mapToResponse(extraction);
  }

  /**
   * Get extraction history
   */
  async getHistory(
    tenantId?: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: BrandAnalysisResponseDto[]; total: number }> {
    const where = tenantId ? { tenantId } : {};

    const [items, total] = await Promise.all([
      this.prisma.brandExtraction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.brandExtraction.count({ where }),
    ]);

    return {
      items: items.map(this.mapToResponse),
      total,
    };
  }

  /**
   * Retry failed extraction
   */
  async retryExtraction(id: string, userId?: string): Promise<BrandAnalysisResponseDto> {
    const extraction = await this.prisma.brandExtraction.findUnique({
      where: { id },
    });

    if (!extraction) {
      throw new BadRequestException('Extraction not found');
    }

    if (extraction.status !== 'FAILED') {
      throw new BadRequestException('Only failed extractions can be retried');
    }

    return this.extractBrand(
      { url: extraction.inputUrl, tenantId: extraction.tenantId || undefined },
      userId,
    );
  }

  /**
   * Find recent extraction for domain (cache)
   */
  private async findRecentExtraction(domain: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return this.prisma.brandExtraction.findFirst({
      where: {
        inputDomain: domain,
        createdAt: { gte: oneHourAgo },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Merge meta data with AI data
   */
  private mergeBrandData(
    metaData: Partial<BrandExtractionResult>,
    aiData: Partial<BrandExtractionResult>,
  ): BrandExtractionResult {
    const merged: BrandExtractionResult = {
      companyName: aiData.companyName || metaData.companyName || 'Unknown',
      domain: metaData.domain || '',
      description: aiData.description || metaData.description || '',
      tagline: aiData.tagline,
      industry: aiData.industry,
      logo: metaData.logo || null,
      favicon: metaData.favicon || null,
      brandColors: {
        primary: aiData.brandColors?.primary || metaData.brandColors?.primary || '#3B82F6',
        secondary: aiData.brandColors?.secondary || metaData.brandColors?.secondary || '#1E40AF',
        accent: aiData.brandColors?.accent,
      },
      contact: metaData.contact || {},
      socialLinks: metaData.socialLinks || {},
      extractedAt: new Date(),
      confidence: this.calculateConfidence(metaData, aiData),
      source: aiData.companyName ? 'mixed' : 'meta_tags',
    };

    return merged;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    metaData: Partial<BrandExtractionResult>,
    aiData: Partial<BrandExtractionResult>,
  ): number {
    let score = 0.5; // Base score

    // Add for meta data found
    if (metaData.companyName) score += 0.1;
    if (metaData.description) score += 0.05;
    if (metaData.logo?.url) score += 0.1;
    if (metaData.brandColors?.primary !== '#3B82F6') score += 0.05; // Not default

    // Add for AI data
    if (aiData.companyName) score += 0.1;
    if (aiData.industry) score += 0.05;
    if (aiData.confidence) score += aiData.confidence * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Map extraction to response DTO
   */
  private mapToResponse(extraction: any): BrandAnalysisResponseDto {
    return {
      id: extraction.id,
      status: extraction.status,
      result: extraction.result as BrandExtractionResult | undefined,
      errorMessage: extraction.errorMessage || undefined,
      processingTimeMs: extraction.processingTimeMs || undefined,
      confidence: extraction.confidence || undefined,
    };
  }
}
