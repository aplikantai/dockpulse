import { Module, OnModuleInit } from '@nestjs/common';
import { DataBusService } from '../data-bus/data-bus.service';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import {
  ModuleCategory,
  ModuleDefinitionFactory,
  TenantPlan,
} from '../module-registry/interfaces/module-definition.interface';
import { PrismaModule } from '../database/prisma.module';

// Services
import { WebScraperService } from './services/web-scraper.service';
import { AiAnalyzerService } from './services/ai-analyzer.service';
import { BrandExtractorService } from './services/brand-extractor.service';
import { TenantOnboardingService } from './services/tenant-onboarding.service';

// Controllers
import { AiBrandingController } from './controllers/ai-branding.controller';

/**
 * AiBrandingModule - OMENROUTER
 *
 * AI-powered brand extraction and tenant onboarding system.
 *
 * Features:
 * - AI_BRANDING.EXTRACTION - Extract branding from website URL
 * - AI_BRANDING.ONBOARDING - Automated tenant creation with branding
 * - AI_BRANDING.PROVIDERS - Multiple AI provider support (Ollama, Groq, OpenAI, etc.)
 */
@Module({
  imports: [PrismaModule],
  controllers: [AiBrandingController],
  providers: [
    WebScraperService,
    AiAnalyzerService,
    BrandExtractorService,
    TenantOnboardingService,
  ],
  exports: [
    WebScraperService,
    AiAnalyzerService,
    BrandExtractorService,
    TenantOnboardingService,
  ],
})
export class AiBrandingModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly dataBus: DataBusService,
  ) {}

  async onModuleInit() {
    // Register module in Module Registry
    this.moduleRegistry.register(
      ModuleDefinitionFactory.create({
        code: '@ai-branding',
        name: 'AI Branding (OMENROUTER)',
        description: 'Automatyczna ekstrakcja brandingu z wykorzystaniem AI i onboarding tenantów',
        version: '1.0.0',
        category: ModuleCategory.PLATFORM,
        moduleClass: AiBrandingModule,
        dependencies: [],
        defaultEnabled: true, // Platform-level, always enabled
        isCore: true,
        icon: 'sparkles',
        requiredPlan: TenantPlan.STARTER,
        features: [
          {
            code: 'AI_BRANDING.EXTRACTION',
            name: 'Ekstrakcja brandingu',
            description: 'Automatyczne pobieranie logo, kolorów i danych firmy z URL',
            defaultEnabled: true,
          },
          {
            code: 'AI_BRANDING.ONBOARDING',
            name: 'Automatyczny onboarding',
            description: 'Tworzenie tenanta z automatycznym brandingiem',
            defaultEnabled: true,
          },
          {
            code: 'AI_BRANDING.PROVIDERS',
            name: 'Konfiguracja AI',
            description: 'Wybór i konfiguracja providerów AI (Ollama, Groq, OpenAI)',
            defaultEnabled: true,
          },
          {
            code: 'AI_BRANDING.PORTAL_TOKENS',
            name: 'Tokeny dostępu portal',
            description: 'Dostęp do portalu klienta bez logowania (link z tokenem)',
            defaultEnabled: false,
          },
        ],
        defaultConfig: {
          defaultProvider: 'OLLAMA',
          defaultModel: 'llama2',
          extractionTimeout: 30000,
          cacheExtractionHours: 24,
          maxExtractionsPerHour: 50,
        },
      }),
    );

    console.log('[AiBrandingModule] Registered @ai-branding module (OMENROUTER)');
  }
}
