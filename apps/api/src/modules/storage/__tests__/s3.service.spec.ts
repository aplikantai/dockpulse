import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../s3.service';

// Mock AWS SDK
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'PutObject' })),
  GetObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'GetObject' })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'DeleteObject' })),
  HeadBucketCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'HeadBucket' })),
  CreateBucketCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'CreateBucket' })),
}));

// Mock axios
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
  },
}));

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set environment variables
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    process.env.S3_ACCESS_KEY = 'test-access-key';
    process.env.S3_SECRET_KEY = 'test-secret-key';
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_REGION = 'us-east-1';

    // Mock HeadBucket to succeed (bucket exists)
    mockSend.mockResolvedValueOnce({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);

    // Trigger onModuleInit
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize with environment config', async () => {
      expect(service).toBeDefined();
    });

    it('should create bucket if not exists', async () => {
      jest.clearAllMocks();

      // Mock HeadBucket to fail (bucket doesn't exist)
      const notFoundError = { name: 'NotFound', $metadata: { httpStatusCode: 404 } };
      mockSend.mockRejectedValueOnce(notFoundError);
      mockSend.mockResolvedValueOnce({}); // CreateBucket success

      const module: TestingModule = await Test.createTestingModule({
        providers: [S3Service],
      }).compile();

      const newService = module.get<S3Service>(S3Service);
      await newService.onModuleInit();

      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('upload', () => {
    it('should upload buffer to S3', async () => {
      mockSend.mockResolvedValueOnce({});

      const buffer = Buffer.from('test content');
      const result = await service.upload('test-key.txt', buffer, 'text/plain');

      expect(result).toEqual({
        key: 'test-key.txt',
        url: 'http://localhost:9000/test-bucket/test-key.txt',
        contentType: 'text/plain',
        size: buffer.length,
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error on upload failure', async () => {
      mockSend.mockRejectedValueOnce(new Error('Upload failed'));

      const buffer = Buffer.from('test content');

      await expect(
        service.upload('test-key.txt', buffer),
      ).rejects.toThrow('S3 upload failed');
    });
  });

  describe('uploadFromUrl', () => {
    it('should download and upload file from URL', async () => {
      const axios = require('axios').default;
      axios.get.mockResolvedValueOnce({
        data: Buffer.from('image data'),
        headers: { 'content-type': 'image/png' },
      });
      mockSend.mockResolvedValueOnce({});

      const result = await service.uploadFromUrl(
        'test-key.png',
        'https://example.com/image.png',
      );

      expect(result.key).toBe('test-key.png');
      expect(result.contentType).toBe('image/png');
      expect(axios.get).toHaveBeenCalledWith(
        'https://example.com/image.png',
        expect.objectContaining({
          responseType: 'arraybuffer',
          timeout: 30000,
        }),
      );
    });

    it('should throw error when URL fetch fails', async () => {
      const axios = require('axios').default;
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.uploadFromUrl('test-key.png', 'https://example.com/image.png'),
      ).rejects.toThrow('S3 upload from URL failed');
    });
  });

  describe('download', () => {
    it('should download file from S3', async () => {
      const mockData = Buffer.from('downloaded content');
      mockSend.mockResolvedValueOnce({
        Body: (async function* () {
          yield mockData;
        })(),
      });

      const result = await service.download('test-key.txt');

      expect(result).toEqual(mockData);
    });

    it('should throw error on download failure', async () => {
      mockSend.mockRejectedValueOnce(new Error('Download failed'));

      await expect(service.download('test-key.txt')).rejects.toThrow(
        'S3 download failed',
      );
    });
  });

  describe('delete', () => {
    it('should delete file from S3', async () => {
      mockSend.mockResolvedValueOnce({});

      await expect(service.delete('test-key.txt')).resolves.not.toThrow();
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error on delete failure', async () => {
      mockSend.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(service.delete('test-key.txt')).rejects.toThrow(
        'S3 delete failed',
      );
    });
  });

  describe('getPublicUrl', () => {
    it('should return URL with publicUrl if configured', async () => {
      process.env.S3_PUBLIC_URL = 'https://cdn.example.com';

      jest.clearAllMocks();
      mockSend.mockResolvedValueOnce({});

      const module: TestingModule = await Test.createTestingModule({
        providers: [S3Service],
      }).compile();

      const newService = module.get<S3Service>(S3Service);
      await newService.onModuleInit();

      const url = newService.getPublicUrl('test-key.png');
      expect(url).toBe('https://cdn.example.com/test-key.png');

      delete process.env.S3_PUBLIC_URL;
    });

    it('should return default S3 URL format', () => {
      const url = service.getPublicUrl('test-key.png');
      expect(url).toBe('http://localhost:9000/test-bucket/test-key.png');
    });
  });

  describe('generateAssetKey', () => {
    it('should generate unique asset key', () => {
      const key = service.generateAssetKey('test-tenant', 'logo', 'company-logo.png');

      expect(key).toMatch(/^tenants\/test-tenant\/logo\/\d+\.png$/);
    });

    it('should handle files without extension', () => {
      const key = service.generateAssetKey('test-tenant', 'document', 'readme');

      // Files without extension use the filename itself as extension
      expect(key).toMatch(/^tenants\/test-tenant\/document\/\d+\.readme$/);
    });

    it('should use correct asset type in path', () => {
      const logoKey = service.generateAssetKey('tenant', 'logo', 'file.png');
      const faviconKey = service.generateAssetKey('tenant', 'favicon', 'file.ico');

      expect(logoKey).toContain('/logo/');
      expect(faviconKey).toContain('/favicon/');
    });
  });
});
