import { IsString, IsOptional, IsUrl, IsEnum, IsNumber, Min, Max } from 'class-validator';

/**
 * Result of brand extraction
 */
export interface BrandExtractionResult {
  // Basic info
  companyName: string;
  domain: string;

  // Visual
  logo: {
    url: string;
    base64?: string;
    dominantColors?: string[];
  } | null;
  favicon: {
    url: string;
    base64?: string;
  } | null;
  brandColors: {
    primary: string;
    secondary: string;
    accent?: string;
  };

  // Information
  description: string;
  tagline?: string;
  industry?: string;

  // Contact
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
    twitter?: string;
    youtube?: string;
  };

  // Metadata
  extractedAt: Date;
  confidence: number;
  source: 'meta_tags' | 'ai_analysis' | 'mixed' | 'clearbit';
}

/**
 * Request to analyze a website for branding
 */
export class AnalyzeBrandDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  skipAi?: boolean; // Only use meta tags, skip AI analysis
}

/**
 * Response from brand analysis
 */
export class BrandAnalysisResponseDto {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: BrandExtractionResult;
  errorMessage?: string;
  processingTimeMs?: number;
  confidence?: number;
}

/**
 * AI Provider configuration
 */
export enum AiProviderEnum {
  OLLAMA = 'OLLAMA',
  GROQ = 'GROQ',
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  MISTRAL = 'MISTRAL',
}

/**
 * DTO for AI config
 */
export class AiConfigDto {
  @IsEnum(AiProviderEnum)
  provider: AiProviderEnum;

  @IsString()
  modelName: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsUrl()
  baseUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(32000)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;
}

/**
 * Update AI config
 */
export class UpdateAiConfigDto {
  @IsOptional()
  @IsEnum(AiProviderEnum)
  provider?: AiProviderEnum;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  brandExtraction?: boolean;

  @IsOptional()
  contentGeneration?: boolean;

  @IsOptional()
  isActive?: boolean;
}

/**
 * AI Provider info
 */
export interface AiProviderInfo {
  provider: AiProviderEnum;
  name: string;
  description: string;
  isFree: boolean;
  requiresApiKey: boolean;
  defaultModel: string;
  availableModels: string[];
  features: string[];
}

/**
 * List of available AI providers
 */
export const AI_PROVIDERS: AiProviderInfo[] = [
  {
    provider: AiProviderEnum.OLLAMA,
    name: 'Ollama (Local)',
    description: 'Run AI models locally. Free, private, no API key needed.',
    isFree: true,
    requiresApiKey: false,
    defaultModel: 'llama2',
    availableModels: ['llama2', 'llama2:13b', 'mistral', 'codellama', 'vicuna'],
    features: ['brandExtraction', 'contentGeneration'],
  },
  {
    provider: AiProviderEnum.GROQ,
    name: 'Groq (Cloud)',
    description: 'Ultra-fast inference. Free tier: 30 req/min.',
    isFree: true,
    requiresApiKey: true,
    defaultModel: 'llama-3.1-70b-versatile',
    availableModels: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    features: ['brandExtraction', 'contentGeneration', 'chatAssistant'],
  },
  {
    provider: AiProviderEnum.MISTRAL,
    name: 'Mistral AI',
    description: 'European AI. Free tier available.',
    isFree: true,
    requiresApiKey: true,
    defaultModel: 'mistral-small-latest',
    availableModels: ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
    features: ['brandExtraction', 'contentGeneration'],
  },
  {
    provider: AiProviderEnum.OPENAI,
    name: 'OpenAI',
    description: 'GPT-4 and GPT-3.5. Paid, best quality.',
    isFree: false,
    requiresApiKey: true,
    defaultModel: 'gpt-4o-mini',
    availableModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    features: ['brandExtraction', 'contentGeneration', 'chatAssistant'],
  },
  {
    provider: AiProviderEnum.ANTHROPIC,
    name: 'Anthropic (Claude)',
    description: 'Claude models. Paid, excellent reasoning.',
    isFree: false,
    requiresApiKey: true,
    defaultModel: 'claude-3-haiku-20240307',
    availableModels: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
    features: ['brandExtraction', 'contentGeneration', 'chatAssistant'],
  },
];
