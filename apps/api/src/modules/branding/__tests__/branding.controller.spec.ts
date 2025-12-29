import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BrandingController } from '../branding.controller';
import { BrandingService } from '../branding.service';
import { OpenRouterService } from '../services/openrouter.service';
import * as fs from 'fs';
import * as path from 'path';

const mockResponses = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'fixtures/mock-responses.json'),
    'utf-8',
  ),
);

describe('BrandingController', () => {
  let controller: BrandingController;
  let brandingService: jest.Mocked<BrandingService>;
  let openRouterService: jest.Mocked<OpenRouterService>;

  const mockBrandingResult = {
    companyData: {
      name: mockResponses.companyDataResponse.companyName,
      nip: mockResponses.companyDataResponse.nip,
      address: mockResponses.companyDataResponse.address,
      phone: mockResponses.companyDataResponse.phone,
      email: mockResponses.companyDataResponse.email,
    },
    branding: {
      logoUrl: 'https://cdn.example.com/logo.png',
      faviconUrl: '/favicon.ico',
      colors: mockResponses.colorsResponse,
    },
  };

  const mockBrandingSettings = {
    logoUrl: 'https://cdn.example.com/logo.png',
    faviconUrl: '/favicon.ico',
    companyName: 'Test Company',
    colors: mockResponses.colorsResponse,
    companyData: {
      nip: '123-456-78-90',
      address: { street: 'Test', city: 'Warsaw', postalCode: '00-001' },
      phone: '+48 123 456 789',
      email: 'test@test.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandingController],
      providers: [
        {
          provide: BrandingService,
          useValue: {
            extractAndSaveBranding: jest.fn(),
            extractBrandingFromWebsite: jest.fn(),
            getTenantBranding: jest.fn(),
            generateColorShades: jest.fn(),
          },
        },
        {
          provide: OpenRouterService,
          useValue: {
            healthCheck: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BrandingController>(BrandingController);
    brandingService = module.get(BrandingService);
    openRouterService = module.get(OpenRouterService);
  });

  describe('extractBranding', () => {
    it('should extract and save branding for a tenant', async () => {
      brandingService.extractAndSaveBranding.mockResolvedValue(mockBrandingResult);

      const result = await controller.extractBranding({
        websiteUrl: 'https://example.com',
        tenantSlug: 'test-tenant',
      });

      expect(result).toEqual(mockBrandingResult);
      expect(brandingService.extractAndSaveBranding).toHaveBeenCalledWith(
        'https://example.com',
        'test-tenant',
      );
    });

    it('should propagate errors from service', async () => {
      brandingService.extractAndSaveBranding.mockRejectedValue(
        new Error('Extraction failed'),
      );

      await expect(
        controller.extractBranding({
          websiteUrl: 'https://example.com',
          tenantSlug: 'test-tenant',
        }),
      ).rejects.toThrow('Extraction failed');
    });
  });

  describe('previewBranding', () => {
    it('should preview branding without saving', async () => {
      brandingService.extractBrandingFromWebsite.mockResolvedValue(mockBrandingResult);

      const result = await controller.previewBranding({
        websiteUrl: 'https://example.com',
      });

      expect(result).toEqual(mockBrandingResult);
      expect(brandingService.extractBrandingFromWebsite).toHaveBeenCalledWith(
        'https://example.com',
        'preview',
      );
    });
  });

  describe('getTenantBranding', () => {
    it('should return branding for existing tenant', async () => {
      brandingService.getTenantBranding.mockResolvedValue(mockBrandingSettings);

      const result = await controller.getTenantBranding('test-tenant');

      expect(result).toEqual(mockBrandingSettings);
      expect(brandingService.getTenantBranding).toHaveBeenCalledWith('test-tenant');
    });

    it('should throw NotFoundException when branding not found', async () => {
      brandingService.getTenantBranding.mockResolvedValue(null);

      await expect(
        controller.getTenantBranding('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateColorShades', () => {
    it('should generate color shades', async () => {
      const mockShades = {
        '50': '#f0f4fa',
        '100': '#e1e8f4',
        '500': '#2B579A',
        '900': '#0f1e36',
      };
      brandingService.generateColorShades.mockReturnValue(mockShades);

      const result = await controller.generateColorShades({ color: '#2B579A' });

      expect(result).toEqual(mockShades);
      expect(brandingService.generateColorShades).toHaveBeenCalledWith('#2B579A');
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const healthResult = {
        status: 'ok' as const,
        models: { text_primary: true, vision_primary: true },
        lastChecked: new Date(),
      };
      openRouterService.healthCheck.mockResolvedValue(healthResult);

      const result = await controller.healthCheck();

      expect(result).toEqual(healthResult);
      expect(openRouterService.healthCheck).toHaveBeenCalled();
    });

    it('should return degraded status when some models fail', async () => {
      const healthResult = {
        status: 'degraded' as const,
        models: { text_primary: true, vision_primary: false },
        lastChecked: new Date(),
      };
      openRouterService.healthCheck.mockResolvedValue(healthResult);

      const result = await controller.healthCheck();

      expect(result.status).toBe('degraded');
    });
  });
});
