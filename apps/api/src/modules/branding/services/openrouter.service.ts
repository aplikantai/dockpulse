import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

interface ModelConfig {
  primary: string;
  fallbacks: string[];
}

interface CompletionOptions {
  messages: OpenAI.ChatCompletionMessageParam[];
  responseFormat?: { type: 'json_object' | 'text' };
  temperature?: number;
  maxTokens?: number;
  apiKey?: string; // Optional tenant-specific API key
}

export interface ModelHealthStatus {
  status: 'ok' | 'degraded' | 'down';
  models: Record<string, boolean>;
  lastChecked: Date;
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly defaultClient: OpenAI;
  private readonly clientCache: Map<string, OpenAI> = new Map();

  // All available models (FREE + PAID)
  public static readonly AVAILABLE_MODELS = {
    // FREE MODELS (no credits required)
    free: {
      text: [
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash', provider: 'Google', tier: 'free' },
        { id: 'xiaomi/mimo-v2-flash:free', name: 'Xiaomi Mimo v2 Flash', provider: 'Xiaomi', tier: 'free' },
        { id: 'mistralai/devstral-2512:free', name: 'Mistral Devstral', provider: 'Mistral AI', tier: 'free' },
        { id: 'qwen/qwen3-coder:free', name: 'Qwen 3 Coder', provider: 'Alibaba', tier: 'free' },
        { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nvidia Nemotron Nano', provider: 'Nvidia', tier: 'free' },
      ],
      vision: [
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash', provider: 'Google', tier: 'free' },
        { id: 'xiaomi/mimo-v2-flash:free', name: 'Xiaomi Mimo v2 Flash', provider: 'Xiaomi', tier: 'free' },
      ],
      code: [
        { id: 'mistralai/devstral-2512:free', name: 'Mistral Devstral', provider: 'Mistral AI', tier: 'free' },
        { id: 'qwen/qwen3-coder:free', name: 'Qwen 3 Coder', provider: 'Alibaba', tier: 'free' },
      ],
    },
    // PAID MODELS (require credits)
    paid: {
      text: [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tier: 'paid', cost: '$3.00 / 1M tokens' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', tier: 'paid', cost: '$15.00 / 1M tokens' },
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tier: 'paid', cost: '$5.00 / 1M tokens' },
        { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', tier: 'paid', cost: '$10.00 / 1M tokens' },
        { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', tier: 'paid', cost: '$0.80 / 1M tokens' },
        { id: 'cohere/command-r-plus', name: 'Command R+', provider: 'Cohere', tier: 'paid', cost: '$3.00 / 1M tokens' },
        { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral AI', tier: 'paid', cost: '$4.00 / 1M tokens' },
        { id: 'google/gemini-2.0-flash-thinking', name: 'Gemini 2.0 Flash Thinking', provider: 'Google', tier: 'paid', cost: '$0.50 / 1M tokens' },
      ],
      vision: [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tier: 'paid', cost: '$3.00 / 1M tokens' },
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tier: 'paid', cost: '$5.00 / 1M tokens' },
        { id: 'google/gemini-2.0-flash-thinking', name: 'Gemini 2.0 Flash Thinking', provider: 'Google', tier: 'paid', cost: '$0.50 / 1M tokens' },
      ],
      code: [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tier: 'paid', cost: '$3.00 / 1M tokens' },
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tier: 'paid', cost: '$5.00 / 1M tokens' },
        { id: 'mistralai/devstral-2512', name: 'Mistral Devstral (Paid)', provider: 'Mistral AI', tier: 'paid', cost: '$0.20 / 1M tokens' },
      ],
    },
  };

  private readonly models: Record<'text' | 'vision' | 'code', ModelConfig> = {
    text: {
      primary: process.env.OPENROUTER_MODEL_TEXT || 'google/gemini-2.0-flash-exp:free',
      fallbacks: [
        'xiaomi/mimo-v2-flash:free',
        'mistralai/devstral-2512:free',
        'qwen/qwen3-coder:free',
        'nvidia/nemotron-3-nano-30b-a3b:free',
      ],
    },
    vision: {
      primary: process.env.OPENROUTER_MODEL_VISION || 'google/gemini-2.0-flash-exp:free',
      fallbacks: [
        // No working free vision fallbacks currently available
        // 'xiaomi/mimo-v2-flash:free' - doesn't support image input
      ],
    },
    code: {
      primary: process.env.OPENROUTER_MODEL_CODE || 'mistralai/devstral-2512:free',
      fallbacks: [
        'qwen/qwen3-coder:free',
        'google/gemini-2.0-flash-exp:free',
        'nvidia/nemotron-3-nano-30b-a3b:free',
      ],
    },
  };

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY || 'sk-or-v1-placeholder';
    this.logger.log(`OpenRouter API Key configured: ${apiKey.substring(0, 20)}...`);

    this.defaultClient = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://dockpulse.com',
        'X-Title': 'DockPulse',
      },
    });
  }

  /**
   * Get OpenAI client for specific API key (cached)
   */
  private getClient(apiKey?: string): OpenAI {
    if (!apiKey) {
      return this.defaultClient;
    }

    // Check cache
    if (this.clientCache.has(apiKey)) {
      return this.clientCache.get(apiKey)!;
    }

    // Create new client for this API key
    const client = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://dockpulse.com',
        'X-Title': 'DockPulse',
      },
    });

    // Cache with max size limit
    if (this.clientCache.size > 100) {
      const firstKey = this.clientCache.keys().next().value;
      if (firstKey) this.clientCache.delete(firstKey);
    }
    this.clientCache.set(apiKey, client);

    return client;
  }

  /**
   * Execute text completion with automatic fallback
   */
  async textCompletion(options: CompletionOptions): Promise<string> {
    return this.executeWithFallback('text', options);
  }

  /**
   * Execute vision completion with automatic fallback
   */
  async visionCompletion(options: CompletionOptions): Promise<string> {
    return this.executeWithFallback('vision', options);
  }

  /**
   * Execute code completion with automatic fallback (optimized for coding tasks)
   */
  async codeCompletion(options: CompletionOptions): Promise<string> {
    return this.executeWithFallback('code', options);
  }

  /**
   * Execute completion with fallback models on failure
   */
  private async executeWithFallback(
    type: 'text' | 'vision' | 'code',
    options: CompletionOptions,
  ): Promise<string> {
    const modelConfig = this.models[type];
    const allModels = [modelConfig.primary, ...modelConfig.fallbacks];
    const client = this.getClient(options.apiKey);

    let lastError: Error | null = null;

    for (let i = 0; i < allModels.length; i++) {
      const model = allModels[i];
      const isPrimary = i === 0;

      try {
        this.logger.debug(`Trying ${type} model: ${model} (${isPrimary ? 'primary' : 'fallback'})`);
        const startTime = Date.now();

        const response = await client.chat.completions.create({
          model,
          messages: options.messages,
          response_format: options.responseFormat,
          temperature: options.temperature ?? 0.1,
          max_tokens: options.maxTokens ?? 1000,
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
          throw new Error('Empty response from model');
        }

        const duration = Date.now() - startTime;
        this.logger.log(
          `Model ${model} succeeded in ${duration}ms ${!isPrimary ? '(fallback)' : ''}`,
        );

        return content;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || 'Unknown error';

        this.logger.warn(
          `Model ${model} failed: ${errorMsg}. ${i < allModels.length - 1 ? 'Trying next...' : 'No more fallbacks.'}`,
        );

        // Delay before next attempt (exponential backoff)
        if (i < allModels.length - 1) {
          await this.delay(Math.min(500 * (i + 1), 2000));
        }
      }
    }

    this.logger.error(`All ${type} models failed after ${allModels.length} attempts`);
    throw lastError || new Error(`All ${type} models failed`);
  }

  /**
   * Check health of OpenRouter models
   */
  async healthCheck(apiKey?: string): Promise<ModelHealthStatus> {
    const client = this.getClient(apiKey);
    const results: Record<string, boolean> = {};

    for (const [type, config] of Object.entries(this.models)) {
      try {
        await client.chat.completions.create({
          model: config.primary,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        });
        results[`${type}_primary`] = true;
      } catch {
        results[`${type}_primary`] = false;
      }
    }

    const anyWorking = Object.values(results).some((v) => v);
    const allWorking = Object.values(results).every((v) => v);

    return {
      status: allWorking ? 'ok' : anyWorking ? 'degraded' : 'down',
      models: results,
      lastChecked: new Date(),
    };
  }

  /**
   * Get available models configuration
   */
  getModelsConfig(): Record<'text' | 'vision' | 'code', ModelConfig> {
    return this.models;
  }

  /**
   * Get all available models (for UI selection)
   */
  static getAvailableModels() {
    return OpenRouterService.AVAILABLE_MODELS;
  }

  /**
   * Update tenant models configuration
   */
  setTenantModels(
    type: 'text' | 'vision' | 'code',
    primary: string,
    fallbacks?: string[],
  ): void {
    this.models[type] = {
      primary,
      fallbacks: fallbacks || this.models[type].fallbacks,
    };
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
