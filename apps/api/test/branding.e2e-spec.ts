import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/database/prisma.service';
import { OpenRouterService } from '../src/modules/branding/services/openrouter.service';
import { S3Service } from '../src/modules/storage/s3.service';

describe('BrandingController (e2e)', () => {
  let app: INestApplication;
  let prismaService: jest.Mocked<PrismaService>;
  let openRouterService: jest.Mocked<OpenRouterService>;
  let s3Service: jest.Mocked<S3Service>;

  const mockBrandingSettings = {
    logoUrl: 'https://cdn.example.com/logo.png',
    faviconUrl: '/favicon.ico',
    companyName: 'Test Company',
    colors: {
      primary: '#2B579A',
      secondary: '#4472C4',
      accent: '#70AD47',
    },
    companyData: {
      nip: '123-456-78-90',
      address: { street: 'Test', city: 'Warsaw', postalCode: '00-001' },
      phone: '+48 123 456 789',
      email: 'test@test.com',
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        tenant: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(OpenRouterService)
      .useValue({
        textCompletion: jest.fn().mockResolvedValue(
          JSON.stringify({
            companyName: 'Test Company',
            nip: '123-456-78-90',
            address: { street: 'Test', city: 'Warsaw', postalCode: '00-001' },
            phone: '+48 123 456 789',
            email: 'test@test.com',
            logoUrl: '/logo.png',
            faviconUrl: '/favicon.ico',
          }),
        ),
        visionCompletion: jest.fn().mockResolvedValue(
          JSON.stringify({
            primary: '#2B579A',
            secondary: '#4472C4',
            accent: '#70AD47',
          }),
        ),
        healthCheck: jest.fn().mockResolvedValue({
          status: 'ok',
          models: { text_primary: true, vision_primary: true },
          lastChecked: new Date(),
        }),
      })
      .overrideProvider(S3Service)
      .useValue({
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
        onModuleInit: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    prismaService = app.get(PrismaService);
    openRouterService = app.get(OpenRouterService);
    s3Service = app.get(S3Service);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /branding/health', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/branding/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('models');
    });
  });

  describe('GET /branding/:tenantSlug', () => {
    it('should return branding for existing tenant', async () => {
      prismaService.tenant.findUnique = jest.fn().mockResolvedValue({
        branding: mockBrandingSettings,
      });

      const response = await request(app.getHttpServer())
        .get('/branding/test-tenant')
        .expect(200);

      expect(response.body).toHaveProperty('logoUrl');
      expect(response.body).toHaveProperty('companyName');
      expect(response.body).toHaveProperty('colors');
    });

    it('should return 404 for non-existent tenant', async () => {
      prismaService.tenant.findUnique = jest.fn().mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/branding/non-existent')
        .expect(404);
    });

    it('should return 404 for tenant without branding', async () => {
      prismaService.tenant.findUnique = jest.fn().mockResolvedValue({
        branding: {},
      });

      await request(app.getHttpServer())
        .get('/branding/empty-branding')
        .expect(404);
    });
  });

  describe('POST /branding/colors/shades', () => {
    it('should generate color shades from valid hex', async () => {
      const response = await request(app.getHttpServer())
        .post('/branding/colors/shades')
        .send({ color: '#2B579A' })
        .expect(200);

      expect(response.body).toHaveProperty('50');
      expect(response.body).toHaveProperty('500');
      expect(response.body).toHaveProperty('900');
      expect(response.body['500']).toBe('#2B579A');
    });

    it('should return empty object for invalid color', async () => {
      const response = await request(app.getHttpServer())
        .post('/branding/colors/shades')
        .send({ color: 'invalid' })
        .expect(200);

      expect(response.body).toEqual({});
    });
  });

  describe('POST /branding/preview', () => {
    it('should validate websiteUrl is required', async () => {
      await request(app.getHttpServer())
        .post('/branding/preview')
        .send({})
        .expect(400);
    });

    it('should validate websiteUrl is a valid URL', async () => {
      await request(app.getHttpServer())
        .post('/branding/preview')
        .send({ websiteUrl: 'not-a-url' })
        .expect(400);
    });
  });

  describe('POST /branding/extract', () => {
    it('should validate tenantSlug is required', async () => {
      await request(app.getHttpServer())
        .post('/branding/extract')
        .send({ websiteUrl: 'https://example.com' })
        .expect(400);
    });

    it('should validate websiteUrl is required', async () => {
      await request(app.getHttpServer())
        .post('/branding/extract')
        .send({ tenantSlug: 'test-tenant' })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Health endpoint should work within limit
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/branding/health')
          .expect(200);
      }
    });
  });

  describe('SSRF Protection', () => {
    it('should reject localhost URLs', async () => {
      const response = await request(app.getHttpServer())
        .post('/branding/preview')
        .send({ websiteUrl: 'http://localhost:8080' });

      // Should return 400 Bad Request for localhost
      expect(response.status).toBe(400);
    });

    it('should reject private IP addresses', async () => {
      const response = await request(app.getHttpServer())
        .post('/branding/preview')
        .send({ websiteUrl: 'http://192.168.1.1' });

      expect(response.status).toBe(400);
    });

    it('should reject 127.0.0.1', async () => {
      const response = await request(app.getHttpServer())
        .post('/branding/preview')
        .send({ websiteUrl: 'http://127.0.0.1' });

      expect(response.status).toBe(400);
    });
  });
});
