# DockPulse - Auto-Branding System

> Inteligentny onboarding z automatycznym pobieraniem brandingu firmy

---

## 1. OVERVIEW

Auto-Branding to funkcja umozliwiajaca automatyczne pobranie brandingu firmy (logo, kolory, dane) na podstawie adresu strony WWW. Uzytkownik podaje tylko URL, a system:

1. Pobiera HTML strony
2. Ekstraktuje dane firmy przez LLM
3. Pobiera logo/favicon
4. Wykrywa kolory z logo przez Vision AI
5. Automatycznie styluje UI platformy

### Inspiracja wizualna

Styl **iOS Glassmorphism** wzorowany na projekcie **Bukieteria**:
- Blur background
- Przezroczystosc
- Subtelne cienie
- Zaokraglone rogi

---

## 2. ARCHITEKTURA

### 2.1. Pipeline Auto-Brandingu

```
┌─────────────────────────────────────────────────────────────┐
│  KROK 1: Uzytkownik podaje URL                              │
│  Input: https://przyklad-firmy.pl                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 2: Web Scraping + AI Analysis (OpenRouter)            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ a) Fetch HTML content (axios)                       │   │
│  │ b) Parse HTML (cheerio)                             │   │
│  │ c) Extract <meta>, <link>, <img>, <h1>              │   │
│  │ d) LLM prompt: "Extract company data from HTML"     │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 3: Color Extraction (Vision AI)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Input: Logo image (base64)                          │   │
│  │ LLM Vision: "Extract dominant colors from logo"     │   │
│  │ Output: { primary, secondary, accent }              │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 4: Asset Upload                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - Download logo & favicon                           │   │
│  │ - Upload to S3 (MinIO / Cloudflare R2)              │   │
│  │ - Generate CDN URLs                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 5: Theme Generation & Storage                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - Generate CSS variables                            │   │
│  │ - Create color shades (50-900)                      │   │
│  │ - Store in tenant.branding (JSONB)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  KROK 6: Apply Branding                                     │
│  - Logo in navbar                                           │
│  - Favicon in browser tab                                   │
│  - Primary color in buttons, links, accents                 │
│  - Company name in header                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Sequence Diagram

```
┌──────────┐    ┌─────────┐    ┌───────────┐    ┌──────────┐    ┌─────┐
│  Client  │    │   API   │    │  Branding │    │OpenRouter│    │ S3  │
└────┬─────┘    └────┬────┘    └─────┬─────┘    └────┬─────┘    └──┬──┘
     │               │               │               │             │
     │ POST /branding/extract        │               │             │
     │──────────────>│               │               │             │
     │               │               │               │             │
     │               │ extractBranding(url)          │             │
     │               │──────────────>│               │             │
     │               │               │               │             │
     │               │               │ fetch HTML    │             │
     │               │               │──────────────>│             │
     │               │               │<──────────────│             │
     │               │               │               │             │
     │               │               │ LLM: extract data           │
     │               │               │──────────────>│             │
     │               │               │<──────────────│             │
     │               │               │               │             │
     │               │               │ Vision: extract colors      │
     │               │               │──────────────>│             │
     │               │               │<──────────────│             │
     │               │               │               │             │
     │               │               │ upload logo/favicon         │
     │               │               │─────────────────────────────>│
     │               │               │<─────────────────────────────│
     │               │               │               │             │
     │               │<──────────────│               │             │
     │<──────────────│               │               │             │
     │               │               │               │             │
```

---

## 3. BACKEND IMPLEMENTATION

### 3.1. BrandingModule Structure

```
apps/api/src/modules/branding/
├── branding.module.ts
├── branding.controller.ts
├── branding.service.ts
├── dto/
│   └── extract-branding.dto.ts
├── interfaces/
│   └── branding.interface.ts
└── prompts/
    ├── extract-company-data.prompt.ts
    └── extract-colors.prompt.ts
```

### 3.2. BrandingService

```typescript
// apps/api/src/modules/branding/branding.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { S3Service } from '../storage/s3.service';
import {
  BrandingResult,
  CompanyData,
  BrandColors
} from './interfaces/branding.interface';
import {
  EXTRACT_COMPANY_DATA_PROMPT,
  EXTRACT_COLORS_PROMPT
} from './prompts';

@Injectable()
export class BrandingService {
  private readonly logger = new Logger(BrandingService.name);
  private readonly openrouter: OpenAI;

  constructor(private readonly s3Service: S3Service) {
    this.openrouter = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL,
        'X-Title': 'DockPulse',
      },
    });
  }

  async extractBrandingFromWebsite(
    websiteUrl: string,
    tenantSlug: string
  ): Promise<BrandingResult> {
    this.logger.log(`Extracting branding from: ${websiteUrl}`);

    // 1. Fetch HTML
    const html = await this.fetchWebsiteHTML(websiteUrl);

    // 2. Extract company data with LLM
    const companyData = await this.extractCompanyData(html, websiteUrl);

    // 3. Download and upload logo/favicon
    const logoUrl = await this.processAsset(
      companyData.logoUrl,
      websiteUrl,
      tenantSlug,
      'logo'
    );
    const faviconUrl = await this.processAsset(
      companyData.faviconUrl,
      websiteUrl,
      tenantSlug,
      'favicon'
    );

    // 4. Extract colors from logo with Vision API
    const colors = await this.extractColorsFromLogo(logoUrl);

    return {
      companyData: {
        name: companyData.companyName,
        nip: companyData.nip,
        address: companyData.address,
        phone: companyData.phone,
        email: companyData.email,
      },
      branding: {
        logoUrl,
        faviconUrl,
        colors,
      },
    };
  }

  private async fetchWebsiteHTML(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DockPulse/1.0)',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch ${url}: ${error.message}`);
      throw new Error(`Cannot fetch website: ${url}`);
    }
  }

  private async extractCompanyData(
    html: string,
    baseUrl: string
  ): Promise<CompanyData> {
    // Parse HTML to extract meta tags
    const $ = cheerio.load(html);

    const metaInfo = {
      title: $('title').text(),
      description: $('meta[name="description"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      favicon: $('link[rel="icon"]').attr('href') ||
               $('link[rel="shortcut icon"]').attr('href'),
    };

    // LLM extraction
    const response = await this.openrouter.chat.completions.create({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [
        {
          role: 'user',
          content: EXTRACT_COMPANY_DATA_PROMPT
            .replace('{{HTML}}', html.slice(0, 8000))
            .replace('{{META}}', JSON.stringify(metaInfo))
            .replace('{{BASE_URL}}', baseUrl),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);

    // Resolve relative URLs
    if (result.logoUrl && !result.logoUrl.startsWith('http')) {
      result.logoUrl = new URL(result.logoUrl, baseUrl).href;
    }
    if (result.faviconUrl && !result.faviconUrl.startsWith('http')) {
      result.faviconUrl = new URL(result.faviconUrl, baseUrl).href;
    }

    return result;
  }

  private async extractColorsFromLogo(logoUrl: string): Promise<BrandColors> {
    if (!logoUrl) {
      return this.getDefaultColors();
    }

    try {
      // Convert logo to base64
      const logoBase64 = await this.imageToBase64(logoUrl);

      const response = await this.openrouter.chat.completions.create({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACT_COLORS_PROMPT },
              {
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${logoBase64}` }
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const colors = JSON.parse(response.choices[0].message.content);

      // Validate HEX format
      const isValidHex = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);

      return {
        primary: isValidHex(colors.primary) ? colors.primary : '#2B579A',
        secondary: isValidHex(colors.secondary) ? colors.secondary : '#4472C4',
        accent: isValidHex(colors.accent) ? colors.accent : '#70AD47',
      };
    } catch (error) {
      this.logger.error(`Failed to extract colors: ${error.message}`);
      return this.getDefaultColors();
    }
  }

  private async processAsset(
    url: string | undefined,
    baseUrl: string,
    tenantSlug: string,
    type: 'logo' | 'favicon'
  ): Promise<string> {
    if (!url) {
      return type === 'logo'
        ? '/assets/default-logo.png'
        : '/assets/default-favicon.ico';
    }

    try {
      // Resolve URL
      const absoluteUrl = url.startsWith('http')
        ? url
        : new URL(url, baseUrl).href;

      // Download
      const response = await axios.get(absoluteUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/png';
      const extension = this.getExtension(absoluteUrl, contentType);

      // Upload to S3
      const key = `tenants/${tenantSlug}/${type}.${extension}`;
      await this.s3Service.upload(key, buffer, contentType);

      return `${process.env.S3_PUBLIC_URL}/${key}`;
    } catch (error) {
      this.logger.error(`Failed to process ${type}: ${error.message}`);
      return type === 'logo'
        ? '/assets/default-logo.png'
        : '/assets/default-favicon.ico';
    }
  }

  private async imageToBase64(url: string): Promise<string> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    return Buffer.from(response.data).toString('base64');
  }

  private getExtension(url: string, contentType: string): string {
    // Try from URL
    const urlExt = url.split('.').pop()?.split('?')[0]?.toLowerCase();
    if (urlExt && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(urlExt)) {
      return urlExt;
    }

    // Fallback to content-type
    const mimeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/x-icon': 'ico',
      'image/webp': 'webp',
    };

    return mimeMap[contentType] || 'png';
  }

  private getDefaultColors(): BrandColors {
    return {
      primary: '#2B579A',
      secondary: '#4472C4',
      accent: '#70AD47',
    };
  }
}
```

### 3.3. LLM Prompts

```typescript
// apps/api/src/modules/branding/prompts/extract-company-data.prompt.ts

export const EXTRACT_COMPANY_DATA_PROMPT = `
Analyze this website HTML and extract company information.

Base URL: {{BASE_URL}}
Meta information: {{META}}

HTML content (truncated):
{{HTML}}

Extract:
1. Company name (check <title>, <h1>, meta tags, footer)
2. NIP / Tax ID (look for patterns like "NIP: 123-456-78-90" or "NIP 1234567890")
3. Address (street, city, postal code - usually in footer or contact section)
4. Phone number (look for tel: links or patterns like +48 123 456 789)
5. Email contact (look for mailto: links or patterns like contact@domain.pl)
6. Logo URL (check <img> with alt containing "logo", or header images)
7. Favicon URL (check <link rel="icon"> or <link rel="shortcut icon">)

Return ONLY valid JSON with this exact structure:
{
  "companyName": "Company Name",
  "nip": "123-456-78-90",
  "address": {
    "street": "ul. Przykladowa 10",
    "city": "Warszawa",
    "postalCode": "00-001"
  },
  "phone": "+48 123 456 789",
  "email": "kontakt@firma.pl",
  "logoUrl": "/path/to/logo.png",
  "faviconUrl": "/favicon.ico"
}

If a field cannot be found, use null for that field.
`;

// apps/api/src/modules/branding/prompts/extract-colors.prompt.ts

export const EXTRACT_COLORS_PROMPT = `
Analyze this company logo image and extract the brand colors.

Extract:
1. Primary brand color (most dominant/important color in the logo)
2. Secondary color (second most prominent, or a complementary color if only one is present)
3. Accent color (tertiary color, or generate a harmonious complementary color)

Rules:
- All colors must be in HEX format (#RRGGBB)
- If logo has only 1 color, generate harmonious secondary and accent colors
- If logo is grayscale, generate a professional blue-based palette
- Avoid pure black (#000000) or pure white (#FFFFFF) as primary

Return ONLY valid JSON:
{
  "primary": "#RRGGBB",
  "secondary": "#RRGGBB",
  "accent": "#RRGGBB"
}
`;
```

### 3.4. Controller & DTO

```typescript
// apps/api/src/modules/branding/dto/extract-branding.dto.ts

import { IsUrl, IsString, MinLength } from 'class-validator';

export class ExtractBrandingDto {
  @IsUrl({}, { message: 'Invalid website URL' })
  websiteUrl: string;

  @IsString()
  @MinLength(3)
  tenantSlug: string;
}

// apps/api/src/modules/branding/branding.controller.ts

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BrandingService } from './branding.service';
import { ExtractBrandingDto } from './dto/extract-branding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Post('extract')
  async extractBranding(@Body() dto: ExtractBrandingDto) {
    return this.brandingService.extractBrandingFromWebsite(
      dto.websiteUrl,
      dto.tenantSlug
    );
  }

  @Post('preview')
  async previewBranding(@Body() dto: { websiteUrl: string }) {
    // Preview bez zapisu - tylko ekstrakcja
    return this.brandingService.extractBrandingFromWebsite(
      dto.websiteUrl,
      'preview'
    );
  }
}
```

---

## 4. DATABASE SCHEMA

### 4.1. Updated Tenant Model

```prisma
// packages/database/prisma/schema.prisma

model Tenant {
  id        String   @id @default(uuid())
  slug      String   @unique @db.VarChar(50)
  name      String   @db.VarChar(255)
  template  String   @db.VarChar(50)
  planId    String?  @map("plan_id")
  status    String   @default("active") @db.VarChar(20)
  settings  Json     @default("{}")

  // ✨ Auto-Branding
  branding  Json     @default("{}") // BrandingSettings

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  plan           Plan?           @relation(fields: [planId], references: [id])
  billingRecords BillingRecord[]

  @@map("tenants")
}
```

### 4.2. BrandingSettings Type

```typescript
// packages/shared/src/types/branding.ts

export interface BrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  companyName: string;
  colors: BrandColors;
  fonts?: BrandFonts;
  companyData?: CompanyData;
}

export interface BrandColors {
  primary: string;    // #RRGGBB
  secondary: string;  // #RRGGBB
  accent: string;     // #RRGGBB
}

export interface BrandFonts {
  heading?: string;
  body?: string;
}

export interface CompanyData {
  nip?: string;
  address?: Address;
  phone?: string;
  email?: string;
}

export interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}
```

---

## 5. FRONTEND IMPLEMENTATION

### 5.1. ThemeProvider

```tsx
// apps/web/src/providers/ThemeProvider.tsx

'use client';

import {
  createContext,
  useContext,
  useEffect,
  ReactNode
} from 'react';
import { useTenant } from '@/hooks/useTenant';
import { BrandingSettings, BrandColors } from '@dockpulse/shared';
import { generateColorShades } from '@/lib/colors';

interface ThemeContextValue {
  colors: BrandColors;
  logo: string;
  favicon: string;
  companyName: string;
  isLoaded: boolean;
}

const DEFAULT_THEME: ThemeContextValue = {
  colors: {
    primary: '#2B579A',
    secondary: '#4472C4',
    accent: '#70AD47',
  },
  logo: '/assets/default-logo.png',
  favicon: '/favicon.ico',
  companyName: 'DockPulse',
  isLoaded: false,
};

const ThemeContext = createContext<ThemeContextValue>(DEFAULT_THEME);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { tenant, isLoading } = useTenant();

  useEffect(() => {
    if (isLoading || !tenant?.branding) return;

    const branding = tenant.branding as BrandingSettings;
    const root = document.documentElement;

    // Apply primary color and shades
    const primaryShades = generateColorShades(branding.colors.primary);
    Object.entries(primaryShades).forEach(([shade, value]) => {
      root.style.setProperty(`--color-primary-${shade}`, value);
    });
    root.style.setProperty('--color-primary', branding.colors.primary);

    // Apply secondary color
    root.style.setProperty('--color-secondary', branding.colors.secondary);

    // Apply accent color
    root.style.setProperty('--color-accent', branding.colors.accent);

    // Update favicon
    const faviconLink = document.querySelector(
      "link[rel='icon']"
    ) as HTMLLinkElement;
    if (faviconLink && branding.faviconUrl) {
      faviconLink.href = branding.faviconUrl;
    }

    // Update document title
    if (branding.companyName) {
      document.title = `${branding.companyName} - DockPulse`;
    }
  }, [tenant, isLoading]);

  const value: ThemeContextValue = {
    colors: tenant?.branding?.colors || DEFAULT_THEME.colors,
    logo: tenant?.branding?.logoUrl || DEFAULT_THEME.logo,
    favicon: tenant?.branding?.faviconUrl || DEFAULT_THEME.favicon,
    companyName: tenant?.branding?.companyName || DEFAULT_THEME.companyName,
    isLoaded: !isLoading && !!tenant,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### 5.2. Color Utility

```typescript
// apps/web/src/lib/colors.ts

/**
 * Generate color shades from a base color
 * Returns shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900
 */
export function generateColorShades(
  hexColor: string
): Record<string, string> {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return {};

  const shades: Record<string, string> = {};

  // Light shades (50-400)
  const lightFactors = [0.95, 0.9, 0.8, 0.6, 0.4];
  [50, 100, 200, 300, 400].forEach((shade, index) => {
    shades[shade] = lighten(rgb, lightFactors[index]);
  });

  // Base (500)
  shades[500] = hexColor;

  // Dark shades (600-900)
  const darkFactors = [0.1, 0.25, 0.4, 0.55];
  [600, 700, 800, 900].forEach((shade, index) => {
    shades[shade] = darken(rgb, darkFactors[index]);
  });

  return shades;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function lighten(
  rgb: { r: number; g: number; b: number },
  factor: number
): string {
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);
  return rgbToHex(r, g, b);
}

function darken(
  rgb: { r: number; g: number; b: number },
  factor: number
): string {
  const r = Math.round(rgb.r * (1 - factor));
  const g = Math.round(rgb.g * (1 - factor));
  const b = Math.round(rgb.b * (1 - factor));
  return rgbToHex(r, g, b);
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
```

### 5.3. Tailwind Config (Dynamic Colors)

```typescript
// apps/web/tailwind.config.ts

import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 5.4. Onboarding Wizard - BrandingStep

```tsx
// apps/web/src/app/onboarding/steps/BrandingStep.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle, AlertCircle, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';

const schema = z.object({
  websiteUrl: z.string().url('Podaj prawidlowy adres URL'),
});

type FormData = z.infer<typeof schema>;

interface BrandingPreview {
  companyData: {
    name: string;
    nip?: string;
    phone?: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      postalCode?: string;
    };
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

interface BrandingStepProps {
  onComplete: (branding: BrandingPreview) => void;
  onSkip: () => void;
}

export function BrandingStep({ onComplete, onSkip }: BrandingStepProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [preview, setPreview] = useState<BrandingPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      websiteUrl: '',
    },
  });

  const handleExtract = async (data: FormData) => {
    setIsExtracting(true);
    setError(null);
    setPreview(null);

    try {
      const response = await fetch('/api/branding/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: data.websiteUrl }),
      });

      if (!response.ok) {
        throw new Error('Nie udalo sie pobrac danych');
      }

      const result: BrandingPreview = await response.json();
      setPreview(result);
      toast.success('Branding pobrany pomyslnie!');
    } catch (err) {
      setError('Nie udalo sie pobrac brandingu. Sprawdz adres URL.');
      toast.error('Blad podczas pobierania brandingu');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Palette className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Twoj branding
        </h2>
        <p className="mt-2 text-gray-600">
          Podaj adres strony WWW Twojej firmy, a my automatycznie pobierzemy
          logo, kolory i dane.
        </p>
      </div>

      {/* URL Input Form */}
      <Card className="p-6">
        <form onSubmit={form.handleSubmit(handleExtract)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adres strony WWW
            </label>
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="https://twoja-firma.pl"
                {...form.register('websiteUrl')}
                className="flex-1"
              />
              <Button type="submit" disabled={isExtracting}>
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pobieram...
                  </>
                ) : (
                  'Pobierz dane'
                )}
              </Button>
            </div>
            {form.formState.errors.websiteUrl && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.websiteUrl.message}
              </p>
            )}
          </div>
        </form>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Preview */}
      {preview && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <h3 className="font-semibold">Podglad brandingu</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="text-sm text-gray-600">Logo</label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <img
                  src={preview.branding.logoUrl}
                  alt="Logo"
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/default-logo.png';
                  }}
                />
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="text-sm text-gray-600">Kolory</label>
              <div className="flex gap-3 mt-2">
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-white shadow-lg"
                    style={{ background: preview.branding.colors.primary }}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Primary</span>
                </div>
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-white shadow-lg"
                    style={{ background: preview.branding.colors.secondary }}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Secondary</span>
                </div>
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-white shadow-lg"
                    style={{ background: preview.branding.colors.accent }}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Accent</span>
                </div>
              </div>
            </div>

            {/* Company Data */}
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Dane firmy</label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                <p>
                  <strong>Nazwa:</strong> {preview.companyData.name}
                </p>
                {preview.companyData.nip && (
                  <p>
                    <strong>NIP:</strong> {preview.companyData.nip}
                  </p>
                )}
                {preview.companyData.phone && (
                  <p>
                    <strong>Telefon:</strong> {preview.companyData.phone}
                  </p>
                )}
                {preview.companyData.email && (
                  <p>
                    <strong>Email:</strong> {preview.companyData.email}
                  </p>
                )}
                {preview.companyData.address?.city && (
                  <p>
                    <strong>Adres:</strong>{' '}
                    {[
                      preview.companyData.address.street,
                      preview.companyData.address.postalCode,
                      preview.companyData.address.city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setPreview(null)}>
              Edytuj recznie
            </Button>
            <Button onClick={() => onComplete(preview)}>
              Wyglada dobrze! Dalej
            </Button>
          </div>
        </Card>
      )}

      {/* Skip Option */}
      {!preview && (
        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Pomin i skonfiguruj pozniej
          </button>
        </div>
      )}
    </div>
  );
}
```

### 5.5. Glassmorphism Components

```tsx
// apps/web/src/components/ui/GlassCard.tsx

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function GlassCard({ children, className, accent }: GlassCardProps) {
  const { colors } = useTheme();

  return (
    <div
      className={cn(
        'backdrop-blur-xl',
        'bg-white/70 dark:bg-slate-900/70',
        'rounded-2xl',
        'border border-white/20',
        'shadow-lg shadow-black/5',
        'p-6',
        'transition-all hover:shadow-xl',
        className
      )}
      style={{
        borderLeft: accent ? `4px solid ${colors.accent}` : undefined,
      }}
    >
      {children}
    </div>
  );
}

// apps/web/src/components/ui/GlassNavbar.tsx

import { useTheme } from '@/providers/ThemeProvider';
import Link from 'next/link';

export function GlassNavbar() {
  const { logo, companyName, colors } = useTheme();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt={companyName} className="h-10 w-auto" />
          <span
            className="text-xl font-semibold"
            style={{ color: colors.primary }}
          >
            {companyName}
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/orders">Zamowienia</NavLink>
          <NavLink href="/customers">Klienci</NavLink>
          <NavLink href="/settings">Ustawienia</NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gray-600 hover:text-primary transition-colors"
    >
      {children}
    </Link>
  );
}
```

---

## 6. ENVIRONMENT VARIABLES

```env
# .env.example additions

# OpenRouter (AI)
OPENROUTER_API_KEY=sk-or-xxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# S3 Storage
S3_ENDPOINT=https://s3.dockpulse.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=dockpulse
S3_PUBLIC_URL=https://cdn.dockpulse.com
```

---

## 7. TESTING

### 7.1. Unit Tests

```typescript
// apps/api/test/branding.service.spec.ts

describe('BrandingService', () => {
  it('should extract company data from HTML', async () => {
    const html = `
      <html>
        <head><title>Test Company</title></head>
        <body>
          <img src="/logo.png" alt="logo">
          <p>NIP: 123-456-78-90</p>
        </body>
      </html>
    `;

    const result = await brandingService.extractCompanyData(
      html,
      'https://example.com'
    );

    expect(result.companyName).toBe('Test Company');
    expect(result.nip).toBe('123-456-78-90');
  });

  it('should generate valid color palette', async () => {
    const colors = await brandingService.extractColorsFromLogo(
      'https://example.com/logo.png'
    );

    expect(colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colors.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should return default colors on error', async () => {
    const colors = await brandingService.extractColorsFromLogo(
      'invalid-url'
    );

    expect(colors.primary).toBe('#2B579A');
  });
});
```

### 7.2. E2E Tests

```typescript
// apps/web/e2e/onboarding-branding.spec.ts

import { test, expect } from '@playwright/test';

test('should extract branding from website', async ({ page }) => {
  await page.goto('/onboarding/branding');

  await page.fill('input[type="url"]', 'https://bukieteria.pl');
  await page.click('button:has-text("Pobierz dane")');

  // Wait for extraction
  await expect(page.locator('text=Podglad brandingu')).toBeVisible({
    timeout: 30000,
  });

  // Verify logo is displayed
  await expect(page.locator('img[alt="Logo"]')).toBeVisible();

  // Verify colors are extracted
  const primaryColor = await page.locator('[data-testid="color-primary"]');
  await expect(primaryColor).toBeVisible();

  // Complete step
  await page.click('button:has-text("Wyglada dobrze")');
});
```

---

## 8. ERROR HANDLING

### 8.1. Fallback Scenarios

| Scenario | Fallback |
|----------|----------|
| Website unreachable | Show error, allow manual input |
| Logo not found | Use placeholder with company initials |
| Colors extraction failed | Use default DockPulse palette |
| NIP/Address not found | Leave fields empty for manual input |
| LLM API error | Retry with fallback model, then show error |

### 8.2. Rate Limiting

```typescript
// apps/api/src/modules/branding/branding.service.ts

@Injectable()
export class BrandingService {
  // Max 10 extractions per tenant per hour
  private readonly rateLimiter = new RateLimiter({
    points: 10,
    duration: 3600,
  });

  async extractBrandingFromWebsite(url: string, tenantSlug: string) {
    await this.rateLimiter.consume(tenantSlug);
    // ... rest of implementation
  }
}
```

---

## 9. OPENROUTER MODELS

### Free Tier Models

| Model ID | Type | Use Case |
|----------|------|----------|
| `meta-llama/llama-3.2-3b-instruct:free` | Text | Company data extraction |
| `google/gemini-2.0-flash-exp:free` | Vision | Color extraction from logo |
| `qwen/qwen-2-7b-instruct:free` | Text | Fallback for text tasks |
| `mistralai/mistral-7b-instruct:free` | Text | Alternative fallback |

### Model Selection Strategy

```typescript
const MODELS = {
  text: {
    primary: 'meta-llama/llama-3.2-3b-instruct:free',
    fallback: 'qwen/qwen-2-7b-instruct:free',
  },
  vision: {
    primary: 'google/gemini-2.0-flash-exp:free',
    fallback: 'meta-llama/llama-3.2-11b-vision-instruct:free',
  },
};
```

---

**Wersja**: 1.0
**Data**: Grudzien 2024
