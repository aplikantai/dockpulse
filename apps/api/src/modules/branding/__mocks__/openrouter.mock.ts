import { OpenRouterService } from '../services/openrouter.service';

export const mockOpenRouterService = {
  textCompletion: jest.fn(),
  visionCompletion: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'ok',
    models: { text_primary: true, vision_primary: true },
    lastChecked: new Date(),
  }),
  getModelsConfig: jest.fn().mockReturnValue({
    text: {
      primary: 'meta-llama/llama-3.2-3b-instruct:free',
      fallbacks: ['qwen/qwen-2-7b-instruct:free'],
    },
    vision: {
      primary: 'google/gemini-2.0-flash-exp:free',
      fallbacks: ['meta-llama/llama-3.2-11b-vision-instruct:free'],
    },
  }),
};

export const createMockOpenRouterService = (): jest.Mocked<OpenRouterService> => {
  return mockOpenRouterService as unknown as jest.Mocked<OpenRouterService>;
};
