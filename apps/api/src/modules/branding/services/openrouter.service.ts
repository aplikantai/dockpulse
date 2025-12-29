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
}

export interface ModelHealthStatus {
  status: 'ok' | 'degraded' | 'down';
  models: Record<string, boolean>;
  lastChecked: Date;
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly client: OpenAI;

  private readonly models: Record<'text' | 'vision', ModelConfig> = {
    text: {
      primary: process.env.OPENROUTER_MODEL_TEXT || 'meta-llama/llama-3.2-3b-instruct:free',
      fallbacks: [
        'qwen/qwen-2-7b-instruct:free',
        'mistralai/mistral-7b-instruct:free',
        'google/gemma-2-9b-it:free',
      ],
    },
    vision: {
      primary: process.env.OPENROUTER_MODEL_VISION || 'google/gemini-2.0-flash-exp:free',
      fallbacks: [
        'meta-llama/llama-3.2-11b-vision-instruct:free',
        'qwen/qwen-2-vl-7b-instruct:free',
      ],
    },
  };

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://dockpulse.com',
        'X-Title': 'DockPulse',
      },
    });
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
   * Execute completion with fallback models on failure
   */
  private async executeWithFallback(
    type: 'text' | 'vision',
    options: CompletionOptions,
  ): Promise<string> {
    const modelConfig = this.models[type];
    const allModels = [modelConfig.primary, ...modelConfig.fallbacks];

    let lastError: Error | null = null;

    for (let i = 0; i < allModels.length; i++) {
      const model = allModels[i];
      const isPrimary = i === 0;

      try {
        this.logger.debug(`Trying ${type} model: ${model} (${isPrimary ? 'primary' : 'fallback'})`);
        const startTime = Date.now();

        const response = await this.client.chat.completions.create({
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
  async healthCheck(): Promise<ModelHealthStatus> {
    const results: Record<string, boolean> = {};

    for (const [type, config] of Object.entries(this.models)) {
      try {
        await this.client.chat.completions.create({
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
  getModelsConfig(): Record<'text' | 'vision', ModelConfig> {
    return this.models;
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
