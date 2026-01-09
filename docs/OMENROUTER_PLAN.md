# OMENROUTER - Plan Implementacji

## Przegląd

OMENROUTER to system automatycznego onboardingu tenantów z wykorzystaniem AI do ekstrakcji brandingu firmy.

**Flow:**
```
User wpisuje URL firmy → AI analizuje stronę → Ekstrakcja brandingu →
Auto-wypełnienie danych → Tworzenie tenanta → Subdomena aktywna
```

---

## Faza 1: AI Brand Extraction Service

### 1.1 Nowy moduł: `@ai-branding`

```
apps/api/src/modules/ai-branding/
├── ai-branding.module.ts
├── services/
│   ├── brand-extractor.service.ts    # Główna logika ekstrakcji
│   ├── web-scraper.service.ts        # Pobieranie HTML/meta
│   ├── ai-analyzer.service.ts        # Integracja z modelami AI
│   └── logo-fetcher.service.ts       # Pobieranie logo/favicon
├── controllers/
│   └── ai-branding.controller.ts
├── dto/
│   ├── analyze-brand.dto.ts
│   └── brand-result.dto.ts
└── providers/
    ├── ollama.provider.ts            # Ollama (local)
    ├── groq.provider.ts              # Groq (free tier)
    └── openai.provider.ts            # OpenAI (paid)
```

### 1.2 Brand Extraction Pipeline

```typescript
interface BrandExtractionResult {
  // Podstawowe
  companyName: string;
  domain: string;

  // Wizualne
  logo: {
    url: string;
    base64?: string;
    dominantColors: string[];
  };
  favicon: {
    url: string;
    base64?: string;
  };
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };

  // Informacje
  description: string;
  industry: string;

  // Kontakt
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };

  // Social
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };

  // Metadane
  extractedAt: Date;
  confidence: number;
  source: 'meta_tags' | 'ai_analysis' | 'mixed';
}
```

### 1.3 Źródła danych do ekstrakcji

1. **Meta Tags** (szybkie, pewne):
   ```html
   <meta property="og:title" content="Nazwa Firmy">
   <meta property="og:description" content="Opis">
   <meta property="og:image" content="https://...logo.png">
   <meta name="theme-color" content="#FF5733">
   <link rel="icon" href="/favicon.ico">
   ```

2. **Schema.org** (strukturalne):
   ```json
   {
     "@type": "Organization",
     "name": "...",
     "logo": "...",
     "contactPoint": {...}
   }
   ```

3. **Clearbit API** (fallback dla logo):
   ```
   https://logo.clearbit.com/{domain}
   ```

4. **AI Analysis** (dla brakujących danych):
   - Analiza treści strony głównej
   - Ekstrakcja kolorów z CSS
   - Rozpoznawanie branży

---

## Faza 2: Admin Panel - AI Configuration

### 2.1 Nowe modele Prisma

```prisma
// AI Model Configuration
model AiModelConfig {
  id          String   @id @default(cuid())
  tenantId    String?  // null = global default

  // Provider settings
  provider    AiProvider @default(OLLAMA)
  modelName   String     @default("llama2")
  apiKey      String?    // encrypted
  baseUrl     String?    // for self-hosted

  // Usage limits
  maxTokens   Int       @default(2000)
  temperature Float     @default(0.7)

  // Features enabled
  brandExtraction  Boolean @default(true)
  contentGeneration Boolean @default(false)

  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant?  @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, provider])
}

enum AiProvider {
  OLLAMA      // Local, free
  GROQ        // Cloud, free tier
  OPENAI      // Cloud, paid
  ANTHROPIC   // Cloud, paid
  MISTRAL     // Cloud, free tier available
}

// Brand extraction history
model BrandExtraction {
  id           String   @id @default(cuid())
  tenantId     String?

  inputUrl     String
  status       BrandExtractionStatus @default(PENDING)

  // Results
  result       Json?    // BrandExtractionResult
  errorMessage String?

  // Metadata
  provider     AiProvider
  processingTime Int?   // ms
  confidence   Float?

  createdAt    DateTime @default(now())

  tenant       Tenant?  @relation(fields: [tenantId], references: [id])
}

enum BrandExtractionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### 2.2 Admin UI - AI Settings

```
/admin/settings/ai
├── Provider Selection (radio/select)
│   ├── Ollama (Local) - Recommended for privacy
│   ├── Groq (Free tier) - Fast, 30 req/min
│   ├── Mistral (Free tier) - Good quality
│   ├── OpenAI (Paid) - Best quality
│   └── Anthropic (Paid) - Best reasoning
├── Model Selection (depends on provider)
│   ├── Ollama: llama2, mistral, codellama
│   ├── Groq: llama-3.1-70b-versatile, mixtral-8x7b
│   └── OpenAI: gpt-4o-mini, gpt-4o
├── API Key (if needed)
├── Test Connection button
└── Usage Statistics
```

---

## Faza 3: Tenant Onboarding Flow

### 3.1 Nowy endpoint: POST /api/admin/tenants/onboard

```typescript
// Request
interface OnboardTenantDto {
  websiteUrl: string;
  adminEmail: string;
  adminName?: string;
  plan?: TenantPlan;
  skipBrandExtraction?: boolean;
}

// Response
interface OnboardTenantResult {
  tenant: {
    id: string;
    name: string;
    slug: string;
    subdomain: string; // firma.dockpulse.com
  };
  branding: BrandExtractionResult;
  adminUser: {
    id: string;
    email: string;
    tempPassword?: string;
  };
  portalUrl: string;
  adminUrl: string;
}
```

### 3.2 Onboarding Steps

```
1. VALIDATE
   └── Sprawdź czy URL jest dostępny
   └── Sprawdź czy subdomena wolna

2. EXTRACT
   └── Pobierz HTML strony
   └── Parsuj meta tags
   └── Pobierz logo (Clearbit fallback)
   └── AI: uzupełnij brakujące dane

3. CREATE_TENANT
   └── Utwórz rekord Tenant
   └── Zapisz branding
   └── Wygeneruj slug/subdomenę

4. SETUP_ADMIN
   └── Utwórz użytkownika admin
   └── Wyślij email z dostępem

5. CONFIGURE_MODULES
   └── Włącz domyślne moduły dla planu
   └── Zastosuj branding

6. FINALIZE
   └── Aktywuj subdomenę
   └── Zwróć dane dostępowe
```

---

## Faza 4: Subdomain Routing

### 4.1 Nginx Configuration

```nginx
# Wildcard SSL
server {
    listen 443 ssl;
    server_name *.dockpulse.com;

    ssl_certificate /etc/letsencrypt/live/dockpulse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dockpulse.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Tenant-Subdomain $subdomain;
    }
}
```

### 4.2 NestJS Middleware

```typescript
// tenant-resolver.middleware.ts
@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;

    // Extract subdomain: firma.dockpulse.com -> firma
    const subdomain = this.extractSubdomain(host);

    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      const tenant = await this.tenantService.findBySubdomain(subdomain);

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      req['tenant'] = tenant;
      req['tenantId'] = tenant.id;
    }

    next();
  }
}
```

### 4.3 Prisma: Tenant subdomain field

```prisma
model Tenant {
  // ... existing fields

  subdomain    String?   @unique  // firma
  customDomain String?   @unique  // firma.pl (optional)

  // Branding from extraction
  branding     Json?     // BrandExtractionResult

  @@index([subdomain])
}
```

---

## Faza 5: Customer Portal (Branded)

### 5.1 Portal Routes

```
https://firma.dockpulse.com/
├── /                    # Landing z logo firmy
├── /login               # Login klienta
├── /register            # Rejestracja (jeśli włączona)
├── /orders              # Moje zamówienia
├── /orders/:id          # Szczegóły zamówienia
├── /quotes              # Moje oferty
├── /quotes/:id          # Szczegóły oferty + akceptacja
├── /profile             # Mój profil
└── /loyalty             # Program lojalnościowy (jeśli włączony)
```

### 5.2 Dynamic Theming

```typescript
// portal-theme.service.ts
@Injectable()
export class PortalThemeService {
  async getThemeForTenant(tenantId: string): Promise<PortalTheme> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { branding: true },
    });

    const branding = tenant?.branding as BrandExtractionResult;

    return {
      logo: branding?.logo?.url || '/default-logo.svg',
      favicon: branding?.favicon?.url || '/favicon.ico',
      colors: {
        primary: branding?.brandColors?.primary || '#3B82F6',
        secondary: branding?.brandColors?.secondary || '#1E40AF',
        accent: branding?.brandColors?.accent || '#F59E0B',
      },
      companyName: branding?.companyName || tenant?.name || 'DockPulse',
    };
  }
}
```

### 5.3 Crystal iOS Design

```css
/* Glass morphism variables */
:root {
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  --glass-blur: blur(10px);
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--glass-shadow);
}
```

---

## Faza 6: Implementation Timeline

### Sprint 1: AI Branding Service
- [ ] Web scraper service (cheerio/puppeteer)
- [ ] Meta tags parser
- [ ] Clearbit integration
- [ ] Basic AI provider (Ollama)
- [ ] Brand extraction endpoint

### Sprint 2: Admin AI Configuration
- [ ] Prisma models for AI config
- [ ] Admin UI for provider selection
- [ ] API key management (encrypted)
- [ ] Test connection functionality

### Sprint 3: Tenant Onboarding
- [ ] Onboarding endpoint
- [ ] Subdomain generation
- [ ] Branding storage
- [ ] Admin user creation
- [ ] Email notifications

### Sprint 4: Subdomain Routing
- [ ] Nginx wildcard config
- [ ] TenantResolver middleware
- [ ] Custom domain support (optional)

### Sprint 5: Customer Portal
- [ ] Portal authentication
- [ ] Dynamic theming
- [ ] Order tracking
- [ ] Quote acceptance
- [ ] Loyalty integration

### Sprint 6: Polish & Testing
- [ ] Error handling
- [ ] Rate limiting
- [ ] Caching
- [ ] E2E tests
- [ ] Documentation

---

## API Endpoints Summary

```
# AI Branding
POST   /api/ai-branding/analyze          # Analyze website
GET    /api/ai-branding/history          # Extraction history
GET    /api/ai-branding/providers        # Available AI providers

# Admin - AI Config
GET    /api/admin/ai-config              # Get AI configuration
PUT    /api/admin/ai-config              # Update AI configuration
POST   /api/admin/ai-config/test         # Test connection

# Admin - Tenant Onboarding
POST   /api/admin/tenants/onboard        # Full onboarding flow
POST   /api/admin/tenants/:id/rebrand    # Re-extract branding
GET    /api/admin/tenants/:id/branding   # Get branding details

# Portal (per subdomain)
GET    /api/portal/theme                 # Get portal theme/branding
POST   /api/portal/auth/login            # Customer login
GET    /api/portal/orders                # Customer orders
GET    /api/portal/quotes                # Customer quotes
POST   /api/portal/quotes/:id/accept     # Accept quote
POST   /api/portal/quotes/:id/reject     # Reject quote
```

---

## Konfiguracja AI Providers

### Ollama (Local)
```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama2
ollama pull mistral

# Run
ollama serve
```

### Groq (Free Tier)
```
- 30 requests/minute
- Models: llama-3.1-70b-versatile, mixtral-8x7b-32768
- API Key: https://console.groq.com/
```

### Environment Variables
```env
# AI Providers
AI_DEFAULT_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
GROQ_API_KEY=gsk_xxx
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Brand extraction
CLEARBIT_ENABLED=true
BRAND_EXTRACTION_TIMEOUT=30000
```

---

## Security Considerations

1. **API Keys Storage**: Encrypted in database using AES-256
2. **Rate Limiting**: Max 10 brand extractions per hour per IP
3. **URL Validation**: Whitelist allowed protocols (http/https)
4. **Timeout**: 30s max for web scraping
5. **Content Size**: Max 5MB HTML download
6. **Subdomain Validation**: Prevent reserved words (api, www, admin)
