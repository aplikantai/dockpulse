import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiProvider } from '@prisma/client';
import { ScrapedPageData } from './web-scraper.service';
import { BrandExtractionResult } from '../dto/brand-extraction.dto';

/**
 * AI Analysis request
 */
interface AiAnalysisRequest {
  provider: AiProvider;
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * AI Analysis response
 */
interface AiAnalysisResponse {
  content: string;
  tokensUsed: number;
  processingTimeMs: number;
}

/**
 * AiAnalyzerService - Integrates with various AI providers
 */
@Injectable()
export class AiAnalyzerService {
  private readonly logger = new Logger(AiAnalyzerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyze scraped data with AI to extract brand information
   */
  async analyzeBrand(
    data: ScrapedPageData,
    config?: { provider?: AiProvider; model?: string; apiKey?: string; baseUrl?: string },
  ): Promise<Partial<BrandExtractionResult>> {
    const startTime = Date.now();

    // Get AI config
    const aiConfig = await this.getAiConfig(config);

    if (!aiConfig) {
      this.logger.warn('No AI config available, skipping AI analysis');
      return {};
    }

    // Build prompt
    const prompt = this.buildBrandExtractionPrompt(data);

    try {
      const response = await this.callAiProvider({
        provider: aiConfig.provider,
        model: aiConfig.modelName,
        prompt,
        maxTokens: aiConfig.maxTokens,
        temperature: aiConfig.temperature,
        apiKey: aiConfig.apiKey || config?.apiKey,
        baseUrl: aiConfig.baseUrl || config?.baseUrl,
      });

      // Parse AI response
      const brandData = this.parseAiResponse(response.content);

      // Update usage stats
      await this.updateUsageStats(aiConfig.id, response.tokensUsed);

      const elapsed = Date.now() - startTime;
      this.logger.log(`AI analysis completed in ${elapsed}ms using ${aiConfig.provider}`);

      return brandData;
    } catch (error) {
      this.logger.error(`AI analysis failed: ${error.message}`);
      return {};
    }
  }

  /**
   * Get AI configuration
   */
  private async getAiConfig(override?: { provider?: AiProvider; apiKey?: string; baseUrl?: string }) {
    // First try to get active config
    const config = await this.prisma.aiModelConfig.findFirst({
      where: {
        isActive: true,
        brandExtraction: true,
        ...(override?.provider ? { provider: override.provider } : {}),
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    if (config) {
      return config;
    }

    // Fallback: create default Ollama config
    return this.prisma.aiModelConfig.create({
      data: {
        provider: 'OLLAMA',
        modelName: 'llama2',
        baseUrl: 'http://localhost:11434',
        isActive: true,
        isDefault: true,
        brandExtraction: true,
      },
    });
  }

  /**
   * Build prompt for brand extraction
   */
  private buildBrandExtractionPrompt(data: ScrapedPageData): string {
    // Truncate HTML to essential parts
    const truncatedHtml = this.truncateHtml(data.html, 3000);

    return `Analyze this website and extract brand information.

Website: ${data.url}
Domain: ${data.domain}

Current metadata found:
- Title: ${data.title || 'Not found'}
- Description: ${data.description || 'Not found'}
- OG Site Name: ${data.ogSiteName || 'Not found'}
- Theme Color: ${data.themeColor || 'Not found'}

HTML excerpt:
${truncatedHtml}

Extract the following information in JSON format:
{
  "companyName": "Official company name",
  "tagline": "Company tagline or slogan if found",
  "industry": "Industry category (e.g., 'E-commerce', 'Technology', 'Services')",
  "description": "Brief company description (1-2 sentences)",
  "brandColors": {
    "primary": "#hexcode",
    "secondary": "#hexcode"
  },
  "confidence": 0.0-1.0
}

Only respond with valid JSON, no explanation.`;
  }

  /**
   * Call AI provider
   */
  private async callAiProvider(request: AiAnalysisRequest): Promise<AiAnalysisResponse> {
    const startTime = Date.now();

    switch (request.provider) {
      case 'OLLAMA':
        return this.callOllama(request, startTime);
      case 'GROQ':
        return this.callGroq(request, startTime);
      case 'OPENAI':
        return this.callOpenAi(request, startTime);
      case 'ANTHROPIC':
        return this.callAnthropic(request, startTime);
      case 'MISTRAL':
        return this.callMistral(request, startTime);
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }
  }

  /**
   * Call Ollama (local)
   */
  private async callOllama(request: AiAnalysisRequest, startTime: number): Promise<AiAnalysisResponse> {
    const baseUrl = request.baseUrl || 'http://localhost:11434';

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model || 'llama2',
        prompt: request.prompt,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 2000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: data.response,
      tokensUsed: data.eval_count || 0,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Call Groq
   */
  private async callGroq(request: AiAnalysisRequest, startTime: number): Promise<AiAnalysisResponse> {
    if (!request.apiKey) {
      throw new Error('Groq API key required');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'llama-3.1-70b-versatile',
        messages: [
          { role: 'user', content: request.prompt }
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Call OpenAI
   */
  private async callOpenAi(request: AiAnalysisRequest, startTime: number): Promise<AiAnalysisResponse> {
    if (!request.apiKey) {
      throw new Error('OpenAI API key required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4o-mini',
        messages: [
          { role: 'user', content: request.prompt }
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Call Anthropic
   */
  private async callAnthropic(request: AiAnalysisRequest, startTime: number): Promise<AiAnalysisResponse> {
    if (!request.apiKey) {
      throw new Error('Anthropic API key required');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': request.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model || 'claude-3-haiku-20240307',
        max_tokens: request.maxTokens || 2000,
        messages: [
          { role: 'user', content: request.prompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || '',
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Call Mistral
   */
  private async callMistral(request: AiAnalysisRequest, startTime: number): Promise<AiAnalysisResponse> {
    if (!request.apiKey) {
      throw new Error('Mistral API key required');
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'mistral-small-latest',
        messages: [
          { role: 'user', content: request.prompt }
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mistral error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Parse AI response to brand data
   */
  private parseAiResponse(content: string): Partial<BrandExtractionResult> {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('No JSON found in AI response');
        return {};
      }

      const data = JSON.parse(jsonMatch[0]);

      return {
        companyName: data.companyName,
        tagline: data.tagline,
        industry: data.industry,
        description: data.description,
        brandColors: data.brandColors,
        confidence: data.confidence || 0.8,
        source: 'ai_analysis',
      };
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      return {};
    }
  }

  /**
   * Update usage statistics
   */
  private async updateUsageStats(configId: string, tokensUsed: number): Promise<void> {
    try {
      await this.prisma.aiModelConfig.update({
        where: { id: configId },
        data: {
          lastRequestAt: new Date(),
          totalRequests: { increment: 1 },
          totalTokensUsed: { increment: tokensUsed },
          requestsToday: { increment: 1 },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update usage stats: ${error.message}`);
    }
  }

  /**
   * Truncate HTML to essential parts
   */
  private truncateHtml(html: string, maxLength: number): string {
    // Remove scripts and styles
    let clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ');

    // Keep only head and first part of body
    const headMatch = clean.match(/<head[\s\S]*?<\/head>/i);
    const bodyMatch = clean.match(/<body[\s\S]*?>/i);

    let result = '';
    if (headMatch) result += headMatch[0];
    if (bodyMatch) {
      const bodyStart = clean.indexOf(bodyMatch[0]);
      result += clean.substring(bodyStart, bodyStart + maxLength);
    }

    return result.substring(0, maxLength);
  }

  /**
   * Test AI provider connection
   */
  async testConnection(provider: AiProvider, config: { apiKey?: string; baseUrl?: string; model?: string }): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const startTime = Date.now();

    try {
      const response = await this.callAiProvider({
        provider,
        model: config.model || 'test',
        prompt: 'Say "OK" if you receive this message.',
        maxTokens: 10,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });

      return {
        success: true,
        message: `Connection successful. Response: ${response.content.substring(0, 50)}`,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
