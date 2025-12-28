import { Test, TestingModule } from '@nestjs/testing';
import { OpenRouterService } from '../services/openrouter.service';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

describe('OpenRouterService', () => {
  let service: OpenRouterService;
  let mockCreate: jest.Mock;

  beforeEach(async () => {
    // Set env vars
    process.env.OPENROUTER_API_KEY = 'test-key';

    const OpenAI = require('openai').default;
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenRouterService],
    }).compile();

    service = module.get<OpenRouterService>(OpenRouterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('textCompletion', () => {
    it('should return content on success', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"test": true}' } }],
      });

      const result = await service.textCompletion({
        messages: [{ role: 'user', content: 'test' }],
      });

      expect(result).toBe('{"test": true}');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should try fallback on primary failure', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'fallback response' } }],
        });

      const result = await service.textCompletion({
        messages: [{ role: 'user', content: 'test' }],
      });

      expect(result).toBe('fallback response');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should throw after all models fail', async () => {
      mockCreate.mockRejectedValue(new Error('All failed'));

      await expect(
        service.textCompletion({
          messages: [{ role: 'user', content: 'test' }],
        }),
      ).rejects.toThrow();
    });

    it('should throw on empty response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(
        service.textCompletion({
          messages: [{ role: 'user', content: 'test' }],
        }),
      ).rejects.toThrow();
    });
  });

  describe('visionCompletion', () => {
    it('should return content on success', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"colors": ["#fff"]}' } }],
      });

      const result = await service.visionCompletion({
        messages: [{ role: 'user', content: 'analyze image' }],
      });

      expect(result).toBe('{"colors": ["#fff"]}');
    });

    it('should use vision model config', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'ok' } }],
      });

      await service.visionCompletion({
        messages: [{ role: 'user', content: 'test' }],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.stringContaining('gemini'),
        }),
      );
    });
  });

  describe('healthCheck', () => {
    it('should return status ok when models work', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'ok' } }],
      });

      const result = await service.healthCheck();

      expect(result.status).toBe('ok');
      expect(result.models).toBeDefined();
      expect(result.lastChecked).toBeInstanceOf(Date);
    });

    it('should return degraded when some models fail', async () => {
      mockCreate
        .mockResolvedValueOnce({ choices: [{ message: { content: 'ok' } }] })
        .mockRejectedValueOnce(new Error('Vision failed'));

      const result = await service.healthCheck();

      expect(result.status).toBe('degraded');
    });

    it('should return down when all models fail', async () => {
      mockCreate.mockRejectedValue(new Error('All failed'));

      const result = await service.healthCheck();

      expect(result.status).toBe('down');
    });
  });

  describe('getModelsConfig', () => {
    it('should return models configuration', () => {
      const config = service.getModelsConfig();

      expect(config).toHaveProperty('text');
      expect(config).toHaveProperty('vision');
      expect(config.text.primary).toBeDefined();
      expect(config.text.fallbacks).toBeInstanceOf(Array);
    });
  });
});
