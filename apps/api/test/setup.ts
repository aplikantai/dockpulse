// Global test setup
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.OPENROUTER_API_KEY = 'test-key';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_ACCESS_KEY = 'test';
process.env.S3_SECRET_KEY = 'test';
process.env.S3_BUCKET = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock PrismaClient since it's not generated
jest.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    $connect() { return Promise.resolve(); }
    $disconnect() { return Promise.resolve(); }
    $queryRaw() { return Promise.resolve([]); }
    $executeRawUnsafe() { return Promise.resolve(); }
    tenant = {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    };
  },
}));

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
