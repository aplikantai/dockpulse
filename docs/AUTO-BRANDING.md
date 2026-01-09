# DockPulse - Auto-Branding & OMENROUTER

> AI-powered self-service onboarding z automatycznym pobieraniem brandingu firmy

---

## 1. OVERVIEW

**OMENROUTER** to system self-service onboardingu umożliwiający:

1. **Automatyczną ekstrakcję brandingu** - logo, kolory, dane firmy z URL
2. **Self-service rejestrację** - użytkownik sam zakłada konto
3. **AI-powered analysis** - LLM do ekstrakcji danych, Vision AI do kolorów
4. **Multi-provider support** - OpenRouter, OpenAI, Ollama

### Główne funkcje

| Funkcja | Opis |
|---------|------|
| Brand Extraction | Pobieranie HTML → LLM analysis → Logo/Colors/Data |
| Subdomain Validation | Sprawdzanie dostępności + sugestie alternatyw |
| Tenant Onboarding | Tworzenie tenanta + admin + moduły |
| Rebrand | Re-ekstrakcja brandingu dla istniejącego tenanta |

---

## 2. ARCHITEKTURA

### 2.1. Struktura modułu

```
apps/api/src/modules/ai-branding/
├── ai-branding.module.ts           # Główny moduł
├── controllers/
│   └── ai-branding.controller.ts   # REST API endpoints
├── services/
│   ├── web-scraper.service.ts      # Pobieranie HTML stron
│   ├── ai-analyzer.service.ts      # Integracja z LLM/Vision
│   ├── brand-extractor.service.ts  # Orkiestracja ekstrakcji
│   └── tenant-onboarding.service.ts # Self-service onboarding
├── dto/
│   ├── brand-extraction.dto.ts     # DTO dla ekstrakcji
│   └── tenant-onboarding.dto.ts    # DTO dla onboardingu
└── index.ts
```

### 2.2. Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│  KROK 1: Użytkownik podaje URL                              │
│  Input: https://przyklad-firmy.pl                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 2: Web Scraping (WebScraperService)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ a) HTTP GET z User-Agent                            │   │
│  │ b) Ekstrakcja <meta>, <link rel="icon">, <img>      │   │
│  │ c) Pobieranie logo/favicon jako base64              │   │
│  │ d) Sanityzacja HTML dla LLM                         │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 3: AI Analysis (AiAnalyzerService)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ a) LLM Text: Extract company data from HTML         │   │
│  │    Model: meta-llama/llama-3.2-3b-instruct:free     │   │
│  │ b) Vision AI: Extract colors from logo              │   │
│  │    Model: google/gemini-2.0-flash-exp:free          │   │
│  │ c) JSON response parsing + validation               │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 4: Brand Extraction (BrandExtractorService)           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - Orkiestracja scraper + analyzer                   │   │
│  │ - Zapis do BrandExtraction entity                   │   │
│  │ - Cache wyników (7 dni)                             │   │
│  │ - Confidence score calculation                      │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 5: Tenant Onboarding (TenantOnboardingService)        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - Walidacja subdomeny                               │   │
│  │ - Generowanie hasła tymczasowego                    │   │
│  │ - Transaction: Tenant + User + TenantModules        │   │
│  │ - Aktywacja domyślnych modułów (plan-dependent)     │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 6: Success Response                                   │
│  - URLs: portal, admin, api                                 │
│  - Dane logowania (email + tempPassword)                    │
│  - Branding preview                                         │
│  - Next steps                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. SERWISY

### 3.1. WebScraperService

**Lokalizacja**: `services/web-scraper.service.ts`

```typescript
@Injectable()
export class WebScraperService {
  // Główna metoda scrapowania
  async scrapeWebsite(url: string): Promise<ScrapedData> {
    // 1. Fetch HTML
    const html = await this.fetchHtml(url);

    // 2. Parse z cheerio
    const $ = cheerio.load(html);

    // 3. Ekstrakcja meta danych
    const metadata = this.extractMetadata($, url);

    // 4. Pobranie logo jako base64
    const logoBase64 = await this.downloadAsBase64(metadata.logoUrl);

    // 5. Sanityzacja HTML dla LLM
    const sanitizedHtml = this.sanitizeForLlm(html);

    return {
      url,
      domain: this.extractDomain(url),
      metadata,
      html: sanitizedHtml,
      logoBase64,
      faviconBase64,
    };
  }

  // Ekstrakcja domeny
  extractDomain(url: string): string {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  }
}
```

### 3.2. AiAnalyzerService

**Lokalizacja**: `services/ai-analyzer.service.ts`

```typescript
@Injectable()
export class AiAnalyzerService {
  private openrouter: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    this.openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }

  // Analiza tekstu (ekstrakcja danych firmy)
  async analyzeText(prompt: string, html: string): Promise<BrandAnalysisResult> {
    const response = await this.openrouter.chat.completions.create({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [
        { role: 'user', content: prompt.replace('{{HTML}}', html) }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  // Analiza obrazu (ekstrakcja kolorów)
  async analyzeImage(imageBase64: string): Promise<ColorAnalysisResult> {
    const response = await this.openrouter.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: EXTRACT_COLORS_PROMPT },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${imageBase64}` }
          }
        ]
      }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  // Test połączenia z providerem
  async testConnection(provider: string, config: ProviderConfig): Promise<TestResult> {
    // ...
  }
}
```

### 3.3. BrandExtractorService

**Lokalizacja**: `services/brand-extractor.service.ts`

```typescript
@Injectable()
export class BrandExtractorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scraper: WebScraperService,
    private readonly analyzer: AiAnalyzerService,
  ) {}

  async extractBrand(dto: AnalyzeBrandDto, userId?: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    // 1. Check cache (7 dni)
    const cached = await this.findCached(dto.url);
    if (cached && !dto.forceRefresh) {
      return this.formatResult(cached);
    }

    // 2. Scrape website
    const scraped = await this.scraper.scrapeWebsite(dto.url);

    // 3. AI Analysis - text
    const textAnalysis = await this.analyzer.analyzeText(
      EXTRACT_COMPANY_PROMPT,
      scraped.html
    );

    // 4. AI Analysis - colors (jeśli jest logo)
    let colors = DEFAULT_COLORS;
    if (scraped.logoBase64) {
      colors = await this.analyzer.analyzeImage(scraped.logoBase64);
    }

    // 5. Calculate confidence
    const confidence = this.calculateConfidence(textAnalysis, colors);

    // 6. Save to database
    const extraction = await this.prisma.brandExtraction.create({
      data: {
        url: dto.url,
        domain: scraped.domain,
        status: 'COMPLETED',
        result: {
          companyName: textAnalysis.companyName,
          domain: scraped.domain,
          logo: { url: scraped.metadata.logoUrl, base64: scraped.logoBase64 },
          favicon: { url: scraped.metadata.faviconUrl },
          brandColors: colors,
          description: textAnalysis.description,
          contact: textAnalysis.contact,
          socialLinks: textAnalysis.socialLinks,
        },
        confidence,
        processingTimeMs: Date.now() - startTime,
        tenantId: dto.tenantId,
        createdBy: userId,
      },
    });

    return this.formatResult(extraction);
  }
}
```

### 3.4. TenantOnboardingService

**Lokalizacja**: `services/tenant-onboarding.service.ts`

```typescript
@Injectable()
export class TenantOnboardingService {
  private readonly baseDomain = 'dockpulse.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandExtractor: BrandExtractorService,
    private readonly scraper: WebScraperService,
  ) {}

  // Full onboarding flow
  async onboardTenant(dto: OnboardTenantDto, adminUserId?: string): Promise<OnboardTenantResult> {
    // 1. Extract domain and generate subdomain
    const domain = this.scraper.extractDomain(dto.websiteUrl);
    let subdomain = dto.subdomain || this.generateSubdomain(domain);

    // 2. Validate subdomain
    const validation = await this.validateSubdomain({ subdomain });
    if (!validation.isAvailable) {
      subdomain = validation.suggestion || this.suggestAlternative(subdomain);
    }

    // 3. Extract branding (if not skipped)
    let branding = null;
    if (!dto.skipBrandExtraction) {
      const extraction = await this.brandExtractor.extractBrand({
        url: dto.websiteUrl,
      }, adminUserId);

      if (extraction.status === 'COMPLETED') {
        branding = extraction.result;
      }
    }

    // 4. Generate admin password
    const tempPassword = this.generateSecurePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 5. Create tenant with transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName || branding?.companyName || domain,
          slug: subdomain,
          subdomain,
          domain,
          websiteUrl: dto.websiteUrl,
          plan: dto.plan || 'STARTER',
          status: 'active',
          branding: branding as any,
          settings: { language: 'pl', timezone: 'Europe/Warsaw', currency: 'PLN' },
        },
      });

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail,
          name: dto.adminName || 'Administrator',
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

    return {
      tenant: { id: result.tenant.id, name: result.tenant.name, subdomain },
      branding: branding ? { ... } : null,
      adminUser: { id: result.adminUser.id, email: dto.adminEmail, tempPassword },
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

  // Subdomain validation
  async validateSubdomain(dto: ValidateSubdomainDto): Promise<SubdomainValidationResult> {
    const subdomain = this.normalizeSubdomain(dto.subdomain);
    const errors: string[] = [];

    // Format validation
    if (subdomain.length < 3) errors.push('Subdomena musi mieć co najmniej 3 znaki');
    if (subdomain.length > 30) errors.push('Subdomena może mieć maksymalnie 30 znaków');
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
      errors.push('Subdomena może zawierać tylko małe litery, cyfry i myślniki');
    }

    // Reserved check
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      errors.push('Ta subdomena jest zarezerwowana');
    }

    if (errors.length > 0) {
      return { subdomain, isAvailable: false, errors, suggestion: this.suggestAlternative(subdomain) };
    }

    // Database check
    const existing = await this.prisma.tenant.findFirst({
      where: { OR: [{ subdomain }, { slug: subdomain }] },
    });

    if (existing) {
      return { subdomain, isAvailable: false, errors: ['Ta subdomena jest już zajęta'], suggestion: this.suggestAlternative(subdomain) };
    }

    return { subdomain, isAvailable: true };
  }

  // Enable default modules based on plan
  private async enableDefaultModules(tx: any, tenantId: string, plan?: TenantPlanEnum): Promise<void> {
    const defaultModules = ['@customers', '@products', '@orders', '@quotes'];

    if (plan === 'PRO' || plan === 'ENTERPRISE') {
      defaultModules.push('@stock', '@calendar', '@invoicing');
    }

    if (plan === 'ENTERPRISE') {
      defaultModules.push('@wms', '@production', '@pricing', '@loyalty');
    }

    for (const moduleCode of defaultModules) {
      await tx.tenantModule.create({
        data: { tenantId, moduleCode, isEnabled: true, config: {} },
      });
    }
  }
}
```

---

## 4. API ENDPOINTS

### 4.1. Controller

**Lokalizacja**: `controllers/ai-branding.controller.ts`

```typescript
@Controller({ path: 'ai-branding', version: '1' })
export class AiBrandingController {

  // Brand extraction
  @Public()
  @Post('analyze')
  async analyzeBrand(@Body() dto: AnalyzeBrandDto, @Headers('x-user-id') userId?: string) {
    return this.brandExtractor.extractBrand(dto, userId);
  }

  // Subdomain validation
  @Public()
  @Post('validate-subdomain')
  @HttpCode(HttpStatus.OK)
  async validateSubdomain(@Body() dto: ValidateSubdomainDto) {
    return this.onboarding.validateSubdomain(dto);
  }

  // Self-service onboarding
  @Public()
  @Post('onboard')
  async onboardTenant(@Body() dto: OnboardTenantDto, @Headers('x-user-id') userId?: string) {
    return this.onboarding.onboardTenant(dto, userId);
  }

  // Rebrand existing tenant
  @Post('tenants/:id/rebrand')
  async rebrandTenant(
    @Param('id') tenantId: string,
    @Body() dto: RebrandTenantDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.onboarding.rebrandTenant(tenantId, dto.websiteUrl, userId);
  }

  // AI providers list
  @Public()
  @Get('providers')
  getProviders() {
    return AI_PROVIDERS;
  }

  // AI config
  @Get('config')
  async getConfig(@Headers('x-tenant-id') tenantId?: string) {
    // ...
  }

  // Test AI provider
  @Post('config/test-provider')
  @HttpCode(HttpStatus.OK)
  async testProvider(@Body() dto: TestProviderDto) {
    return this.aiAnalyzer.testConnection(dto.provider, dto);
  }
}
```

---

## 5. FRONTEND IMPLEMENTATION

### 5.1. OnboardingForm Component

**Lokalizacja**: `apps/web/src/components/landing/OnboardingForm.tsx`

```tsx
'use client';

import { useState } from 'react';

type OnboardingStep = 'url' | 'extracting' | 'preview' | 'success';

export function OnboardingForm() {
  const [step, setStep] = useState<OnboardingStep>('url');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [extractionData, setExtractionData] = useState(null);

  // Step 1: URL Input
  const handleAnalyze = async () => {
    setStep('extracting');

    const response = await fetch('/api/v1/ai-branding/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: websiteUrl }),
    });

    const data = await response.json();
    setExtractionData(data);

    // Pre-fill subdomain from company name
    if (data.result?.companyName) {
      setSubdomain(generateSubdomain(data.result.companyName));
    }

    // Pre-fill email from contact
    if (data.result?.contact?.email) {
      setAdminEmail(data.result.contact.email);
    }

    setStep('preview');
  };

  // Step 2: Create Tenant
  const handleCreateTenant = async () => {
    const response = await fetch('/api/v1/ai-branding/onboard', {
      method: 'POST',
      body: JSON.stringify({
        websiteUrl,
        subdomain,
        adminEmail,
        companyName: extractionData?.result?.companyName,
        extractionId: extractionData?.id,
      }),
    });

    const data = await response.json();
    setTenantData(data);
    setStep('success');
  };

  return (
    <div>
      {step === 'url' && <UrlInputStep onSubmit={handleAnalyze} />}
      {step === 'extracting' && <ExtractingAnimation />}
      {step === 'preview' && <PreviewStep onConfirm={handleCreateTenant} />}
      {step === 'success' && <SuccessStep data={tenantData} />}
    </div>
  );
}
```

### 5.2. Glassmorphism Design

```tsx
// iOS-inspired glass effect
<div className="
  backdrop-blur-xl
  bg-white/80
  rounded-3xl
  border border-white/20
  shadow-2xl shadow-blue-500/10
  p-8
">
  {/* Content */}
</div>
```

---

## 6. AI PROVIDERS

### 6.1. Supported Providers

```typescript
export const AI_PROVIDERS = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to multiple AI models through one API',
    models: {
      text: ['meta-llama/llama-3.2-3b-instruct:free', 'openai/gpt-4o'],
      vision: ['google/gemini-2.0-flash-exp:free', 'openai/gpt-4o'],
    },
    requiresApiKey: true,
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Direct OpenAI API access',
    models: {
      text: ['gpt-4o', 'gpt-4o-mini'],
      vision: ['gpt-4o'],
    },
    requiresApiKey: true,
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Self-hosted models',
    models: {
      text: ['llama3.2', 'mistral', 'qwen2.5'],
      vision: ['llava', 'bakllava'],
    },
    requiresApiKey: false,
    baseUrl: 'http://localhost:11434/v1',
  },
];
```

### 6.2. Free Models (OpenRouter)

| Model | Type | Use Case |
|-------|------|----------|
| `meta-llama/llama-3.2-3b-instruct:free` | Text | Company data extraction |
| `google/gemini-2.0-flash-exp:free` | Vision | Color extraction from logo |
| `qwen/qwen-2-7b-instruct:free` | Text | Fallback for text tasks |

---

## 7. DATABASE SCHEMA

### 7.1. BrandExtraction Entity

```prisma
model BrandExtraction {
  id              String   @id @default(uuid())
  url             String
  domain          String
  status          String   // PENDING | PROCESSING | COMPLETED | FAILED
  result          Json?    // BrandExtractionResult
  errorMessage    String?
  processingTimeMs Int?
  confidence      Float?
  tenantId        String?
  createdBy       String?
  createdAt       DateTime @default(now())
  expiresAt       DateTime // Cache expiration (7 days)

  @@index([domain])
  @@index([tenantId])
}
```

### 7.2. AiModelConfig Entity

```prisma
model AiModelConfig {
  id                String   @id @default(uuid())
  tenantId          String?
  provider          String   // openrouter | openai | ollama
  modelName         String
  apiKey            String?
  baseUrl           String?
  maxTokens         Int      @default(2000)
  temperature       Float    @default(0.7)
  brandExtraction   Boolean  @default(true)
  contentGeneration Boolean  @default(false)
  chatAssistant     Boolean  @default(false)
  isActive          Boolean  @default(true)
  isDefault         Boolean  @default(false)
  totalRequests     Int      @default(0)
  totalTokensUsed   Int      @default(0)
  lastRequestAt     DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([tenantId])
}
```

---

## 8. ENVIRONMENT VARIABLES

```env
# OpenRouter (AI)
OPENROUTER_API_KEY=sk-or-xxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# OpenAI (optional)
OPENAI_API_KEY=sk-xxxxx

# Ollama (optional, local)
OLLAMA_BASE_URL=http://localhost:11434/v1

# Base domain for tenant subdomains
BASE_DOMAIN=dockpulse.com
```

---

## 9. RESERVED SUBDOMAINS

```typescript
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
```

---

## 10. ERROR HANDLING

### 10.1. Fallback Scenarios

| Scenario | Fallback |
|----------|----------|
| Website unreachable | Return error, show manual form |
| Logo not found | Use placeholder with initials |
| Colors extraction failed | Use default DockPulse palette |
| Company data not found | Use domain name as company name |
| LLM API error | Retry with fallback model |

### 10.2. Default Colors

```typescript
const DEFAULT_COLORS = {
  primary: '#2563eb',   // Blue
  secondary: '#64748b', // Slate
  accent: '#10b981',    // Emerald
};
```

---

**Wersja**: 2.0
**Data**: Styczeń 2025
