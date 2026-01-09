import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BrandExtractorService } from './brand-extractor.service';
import { WebScraperService } from './web-scraper.service';
import {
  OnboardTenantDto,
  OnboardTenantResult,
  ValidateSubdomainDto,
  SubdomainValidationResult,
  TenantPlanEnum,
} from '../dto/tenant-onboarding.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * Reserved subdomains that cannot be used
 */
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'dashboard', 'portal',
  'mail', 'email', 'smtp', 'ftp', 'sftp', 'ssh',
  'dev', 'staging', 'test', 'demo', 'beta', 'alpha',
  'static', 'assets', 'cdn', 'media', 'images', 'files',
  'docs', 'help', 'support', 'status', 'health',
  'login', 'logout', 'auth', 'oauth', 'sso',
  'blog', 'news', 'careers', 'jobs', 'about', 'contact',
  'dockpulse', 'platform', 'system', 'root', 'null', 'undefined',
];

/**
 * TenantOnboardingService - Handles automated tenant creation with branding
 */
@Injectable()
export class TenantOnboardingService {
  private readonly logger = new Logger(TenantOnboardingService.name);
  private readonly baseDomain = 'dockpulse.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandExtractor: BrandExtractorService,
    private readonly scraper: WebScraperService,
  ) {}

  /**
   * Full tenant onboarding flow
   */
  async onboardTenant(dto: OnboardTenantDto, adminUserId?: string): Promise<OnboardTenantResult> {
    const startTime = Date.now();
    this.logger.log(`Starting onboarding for: ${dto.websiteUrl}`);

    // Step 1: Extract domain and generate subdomain
    const domain = this.scraper.extractDomain(dto.websiteUrl);
    let subdomain = dto.subdomain || dto.customSubdomain || this.generateSubdomain(domain);

    // Step 2: Validate subdomain availability
    const validation = await this.validateSubdomain({ subdomain });
    if (!validation.isAvailable) {
      if (validation.suggestion) {
        subdomain = validation.suggestion;
      } else {
        throw new ConflictException(`Subdomain "${subdomain}" is not available`);
      }
    }

    // Step 3: Extract branding (if not skipped)
    let branding = null;
    if (!dto.skipBrandExtraction) {
      const extraction = await this.brandExtractor.extractBrand({
        url: dto.websiteUrl,
      }, adminUserId);

      if (extraction.status === 'COMPLETED' && extraction.result) {
        branding = extraction.result;
      }
    }

    // Step 4: Generate admin password
    const tempPassword = this.generateSecurePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Step 5: Create tenant with transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName || branding?.companyName || this.formatDomainAsName(domain),
          slug: subdomain,
          subdomain,
          domain: domain,
          websiteUrl: dto.websiteUrl,
          plan: dto.plan || TenantPlanEnum.STARTER,
          status: 'active',
          branding: branding as any,
          onboardedAt: new Date(),
          onboardedBy: adminUserId,
          settings: {
            language: 'pl',
            timezone: 'Europe/Warsaw',
            currency: 'PLN',
          },
        },
      });

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail,
          phone: dto.adminPhone,
          name: dto.adminName || 'Administrator',
          firstName: dto.adminName?.split(' ')[0],
          lastName: dto.adminName?.split(' ').slice(1).join(' '),
          password: hashedPassword,
          role: 'OWNER',
          mustChangePw: true,
          active: true,
        },
      });

      // Enable default modules
      await this.enableDefaultModules(tx, tenant.id, dto.plan);

      return { tenant, adminUser };
    });

    const elapsed = Date.now() - startTime;
    this.logger.log(`Onboarding completed for ${subdomain}.${this.baseDomain} in ${elapsed}ms`);

    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        subdomain: result.tenant.subdomain!,
      },
      branding: branding ? {
        companyName: branding.companyName,
        logoUrl: branding.logo?.url,
        primaryColor: branding.brandColors?.primary,
        description: branding.description,
        confidence: branding.confidence,
      } : null,
      adminUser: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        tempPassword,
      },
      urls: {
        portal: `https://${subdomain}.${this.baseDomain}`,
        admin: `https://${subdomain}.${this.baseDomain}/admin`,
        api: `https://api.${this.baseDomain}/tenants/${result.tenant.id}`,
      },
      nextSteps: [
        'Zaloguj się hasłem tymczasowym i zmień je',
        'Sprawdź i dostosuj branding w ustawieniach',
        'Dodaj pierwszego klienta',
        'Skonfiguruj moduły według potrzeb',
      ],
    };
  }

  /**
   * Validate subdomain availability
   */
  async validateSubdomain(dto: ValidateSubdomainDto): Promise<SubdomainValidationResult> {
    const subdomain = this.normalizeSubdomain(dto.subdomain);
    const errors: string[] = [];

    // Check format
    if (subdomain.length < 3) {
      errors.push('Subdomena musi mieć co najmniej 3 znaki');
    }
    if (subdomain.length > 30) {
      errors.push('Subdomena może mieć maksymalnie 30 znaków');
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
      errors.push('Subdomena może zawierać tylko małe litery, cyfry i myślniki');
    }

    // Check reserved
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      errors.push('Ta subdomena jest zarezerwowana');
    }

    if (errors.length > 0) {
      return {
        subdomain,
        isAvailable: false,
        errors,
        suggestion: this.suggestAlternative(subdomain),
      };
    }

    // Check database
    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain },
          { slug: subdomain },
        ],
      },
    });

    if (existing) {
      return {
        subdomain,
        isAvailable: false,
        errors: ['Ta subdomena jest już zajęta'],
        suggestion: this.suggestAlternative(subdomain),
      };
    }

    return {
      subdomain,
      isAvailable: true,
    };
  }

  /**
   * Rebrand existing tenant
   */
  async rebrandTenant(tenantId: string, websiteUrl?: string, userId?: string): Promise<OnboardTenantResult['branding']> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const url = websiteUrl || tenant.websiteUrl;
    if (!url) {
      throw new BadRequestException('No website URL to extract branding from');
    }

    const extraction = await this.brandExtractor.extractBrand({ url, tenantId }, userId);

    if (extraction.status !== 'COMPLETED' || !extraction.result) {
      throw new BadRequestException(`Brand extraction failed: ${extraction.errorMessage}`);
    }

    // Update tenant branding
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        branding: extraction.result as any,
        name: extraction.result.companyName || tenant.name,
        websiteUrl: url,
      },
    });

    return {
      companyName: extraction.result.companyName,
      logoUrl: extraction.result.logo?.url,
      primaryColor: extraction.result.brandColors?.primary,
      description: extraction.result.description,
      confidence: extraction.result.confidence,
    };
  }

  /**
   * Generate subdomain from domain
   */
  private generateSubdomain(domain: string): string {
    // Remove TLD and common prefixes
    let subdomain = domain
      .split('.')[0]
      .replace(/^(www|app|portal|my)/, '')
      .toLowerCase();

    // Remove special characters
    subdomain = subdomain.replace(/[^a-z0-9-]/g, '');

    // Ensure minimum length
    if (subdomain.length < 3) {
      subdomain = domain.replace(/\./g, '').toLowerCase().substring(0, 15);
    }

    return subdomain.substring(0, 30);
  }

  /**
   * Normalize subdomain
   */
  private normalizeSubdomain(subdomain: string): string {
    return subdomain
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
  }

  /**
   * Suggest alternative subdomain
   */
  private suggestAlternative(subdomain: string): string {
    const suffix = Math.floor(Math.random() * 1000);
    return `${subdomain}${suffix}`.substring(0, 30);
  }

  /**
   * Format domain as company name
   */
  private formatDomainAsName(domain: string): string {
    const name = domain.split('.')[0];
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate secure temporary password
   */
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    const bytes = crypto.randomBytes(12);
    for (let i = 0; i < 12; i++) {
      password += chars[bytes[i] % chars.length];
    }
    return password;
  }

  /**
   * Enable default modules for tenant
   */
  private async enableDefaultModules(tx: any, tenantId: string, plan?: TenantPlanEnum): Promise<void> {
    const defaultModules = [
      '@customers',
      '@products',
      '@orders',
      '@quotes',
    ];

    // Add more modules for higher plans
    if (plan === TenantPlanEnum.PRO || plan === TenantPlanEnum.ENTERPRISE) {
      defaultModules.push('@stock', '@calendar', '@invoicing');
    }

    if (plan === TenantPlanEnum.ENTERPRISE) {
      defaultModules.push('@wms', '@production', '@pricing', '@loyalty');
    }

    for (const moduleCode of defaultModules) {
      await tx.tenantModule.create({
        data: {
          tenantId,
          moduleCode,
          isEnabled: true,
          config: {},
        },
      });
    }
  }
}
