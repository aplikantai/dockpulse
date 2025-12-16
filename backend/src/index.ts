import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Infra
import { prisma } from './infra/db/prisma.js';
import { withTenantContext } from './infra/db/tenantPrisma.js';

// Core middleware
import { resolveTenant, optionalTenant } from './core/tenancy/resolveTenant.js';
import { authenticateToken } from './middleware/auth.js';
import { tenantRateLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import portalAuthRoutes from './modules/portal/auth/portal-auth.routes.js';
import portalOrdersRoutes from './modules/portal/orders/portal-orders.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ==================== GLOBAL MIDDLEWARE ====================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true, // WAZNE: dla cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Tenant-Slug'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Trust proxy (dla IP za load balancerem)
app.set('trust proxy', 1);

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ==================== CSRF TOKEN ENDPOINT ====================

// Prosty CSRF token endpoint (bez biblioteki csurf ktora jest deprecated)
app.get('/api/csrf-token', (req, res) => {
  // W produkcji uzyj wlasciwego CSRF - tutaj prosty token dla dev
  const csrfToken = Math.random().toString(36).substring(2);
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false, // FE musi moc przeczytac
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ csrfToken });
});

// ==================== AUTH ROUTES (no tenant required for /me) ====================

// Auth routes - niektore wymagaja tenant, niektore nie
app.use('/api/auth', optionalTenant, withTenantContext, authRoutes);

// ==================== PORTAL ROUTES ====================

// Portal auth (wymaga tenant resolution)
app.use('/api/portal/auth', resolveTenant, withTenantContext, portalAuthRoutes);

// Portal orders (wymaga tenant resolution + portal auth)
app.use('/api/portal/orders', resolveTenant, withTenantContext, portalOrdersRoutes);

// ==================== PANEL ROUTES (wymaga tenant + auth + membership) ====================

// Rate limiting dla tenant
app.use('/api', resolveTenant, tenantRateLimiter);

// Tenant context dla wszystkich /api routes
app.use('/api', withTenantContext);

// Orders - wymaga auth i membership (sprawdzane w router)
app.use('/api/orders', authenticateToken, ordersRoutes);

// Audit log - wymaga auth i membership + OWNER/ADMIN (sprawdzane w router)
app.use('/api/audit', authenticateToken, auditRoutes);

// ==================== 404 HANDLER ====================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// ==================== ERROR HANDLER ====================

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ==================== SERVER START ====================

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`
========================================
  DockPulse API Server
  Port: ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}

  Health: http://localhost:${PORT}/health
  API: http://localhost:${PORT}/api
========================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export { app };
