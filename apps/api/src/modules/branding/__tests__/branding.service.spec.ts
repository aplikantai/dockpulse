import { Test, TestingModule } from '@nestjs/testing';
import { BrandingService } from '../branding.service';
import { OpenRouterService } from '../services/openrouter.service';
import { S3Service } from '../../storage/s3.service';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

const mockResponses = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'fixtures/mock-responses.json'),
    'utf-8',
  ),
);

describe('BrandingService', () => {
  let service: BrandingService;
  let openRouterService: jest.Mocked<OpenRouterService>;
  let s3Service: jest.Mocked<S3Service>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandingService,
        {
          provide: OpenRouterService,
          useValue: {
            textCompletion: jest.fn().mockResolvedValue(
              JSON.stringify(mockResponses.companyDataResponse),
            ),
            visionCompletion: jest.fn().mockResolvedValue(
              JSON.stringify(mockResponses.colorsResponse),
            ),
          },
        },
        {
          provide: S3Service,
          useValue: {
            upload: jest.fn().mockResolvedValue({
              key: 'test-key',
              url: 'https://cdn.example.com/test-key',
              contentType: 'image/png',
              size: 1024,
            }),
            uploadFromUrl: jest.fn().mockResolvedValue({
              key: 'test-key',
              url: 'https://cdn.example.com/test-key',
              contentType: 'image/png',
              size: 1024,
            }),
            generateAssetKey: jest.fn().mockReturnValue('tenants/test/logo/123.png'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            tenant: {
              update: jest.fn().mockResolvedValue({}),
              findUnique: jest.fn().mockResolvedValue({ branding: {} }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BrandingService>(BrandingService);
    openRouterService = module.get(OpenRouterService);
    s3Service = module.get(S3Service);
    prismaService = module.get(PrismaService);
  });

  describe('generateColorShades', () => {
    it('should generate 10 shades from base color', () => {
      const shades = service.generateColorShades('#2B579A');

      expect(shades).toHaveProperty('50');
      expect(shades).toHaveProperty('100');
      expect(shades).toHaveProperty('500');
      expect(shades).toHaveProperty('900');
      expect(shades['500']).toBe('#2B579A');
    });

    it('should return empty object for invalid color', () => {
      const shades = service.generateColorShades('invalid');
      expect(shades).toEqual({});
    });

    it('should generate lighter shades correctly', () => {
      const shades = service.generateColorShades('#000000');

      // Shade 50 should be very light
      expect(shades['50']).toBeDefined();
      // Shade 900 should be very dark (but not darker than original for black)
      expect(shades['900']).toBeDefined();
    });
  });

  describe('getDefaultColors', () => {
    it('should return default DockPulse colors', () => {
      const colors = (service as any).getDefaultColors();

      expect(colors.primary).toBe('#2B579A');
      expect(colors.secondary).toBe('#4472C4');
      expect(colors.accent).toBe('#70AD47');
    });
  });

  describe('resolveUrl', () => {
    it('should return absolute URLs unchanged', () => {
      const url = (service as any).resolveUrl(
        'https://example.com/logo.png',
        'https://base.com',
      );
      expect(url).toBe('https://example.com/logo.png');
    });

    it('should resolve relative URLs', () => {
      const url = (service as any).resolveUrl(
        '/images/logo.png',
        'https://base.com',
      );
      expect(url).toBe('https://base.com/images/logo.png');
    });

    it('should return undefined for empty path', () => {
      const url = (service as any).resolveUrl(undefined, 'https://base.com');
      expect(url).toBeUndefined();
    });

    it('should handle invalid URLs gracefully', () => {
      const url = (service as any).resolveUrl(':::invalid', 'https://base.com');
      expect(url).toBeUndefined();
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex to rgb correctly', () => {
      const rgb = (service as any).hexToRgb('#2B579A');

      expect(rgb).toEqual({ r: 43, g: 87, b: 154 });
    });

    it('should return null for invalid hex', () => {
      const rgb = (service as any).hexToRgb('invalid');
      expect(rgb).toBeNull();
    });

    it('should handle hex without hash', () => {
      const rgb = (service as any).hexToRgb('2B579A');
      expect(rgb).toEqual({ r: 43, g: 87, b: 154 });
    });
  });

  describe('uploadBrandingAssets', () => {
    it('should upload logo to S3', async () => {
      const result = await service.uploadBrandingAssets(
        'test-tenant',
        'https://example.com/logo.png',
      );

      expect(s3Service.uploadFromUrl).toHaveBeenCalled();
      expect(result.logoUrl).toBe('https://cdn.example.com/test-key');
    });

    it('should not upload assets starting with /assets/', async () => {
      const result = await service.uploadBrandingAssets(
        'test-tenant',
        '/assets/default-logo.png',
      );

      expect(s3Service.uploadFromUrl).not.toHaveBeenCalled();
      expect(result.logoUrl).toBe('/assets/default-logo.png');
    });
  });

  describe('saveBrandingToTenant', () => {
    it('should update tenant with branding data', async () => {
      const branding = {
        companyData: { name: 'Test' },
        branding: {
          logoUrl: '/logo.png',
          faviconUrl: '/favicon.ico',
          colors: { primary: '#000', secondary: '#111', accent: '#222' },
        },
      };

      await service.saveBrandingToTenant('test-tenant', branding as any);

      expect(prismaService.tenant.update).toHaveBeenCalledWith({
        where: { slug: 'test-tenant' },
        data: expect.objectContaining({
          branding: expect.any(Object),
          updatedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('getTenantBranding', () => {
    it('should return branding if exists', async () => {
      prismaService.tenant.findUnique = jest.fn().mockResolvedValue({
        branding: {
          logoUrl: '/logo.png',
          companyName: 'Test',
          colors: { primary: '#000' },
        },
      });

      const result = await service.getTenantBranding('test-tenant');

      expect(result).toHaveProperty('logoUrl');
      expect(result).toHaveProperty('companyName');
    });

    it('should return null if branding is empty', async () => {
      prismaService.tenant.findUnique = jest.fn().mockResolvedValue({
        branding: {},
      });

      const result = await service.getTenantBranding('test-tenant');

      expect(result).toBeNull();
    });

    it('should return null if tenant not found', async () => {
      prismaService.tenant.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.getTenantBranding('non-existent');

      expect(result).toBeNull();
    });
  });
});
