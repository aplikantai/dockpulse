/**
 * Test izolacji tenantów - KRYTYCZNE
 * Ten test MUSI przejść przed każdym merge!
 */

import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/infra/db/prisma';

describe('Tenant Isolation', () => {
  let tenantA: { id: string; slug: string };
  let tenantB: { id: string; slug: string };
  let userA: { id: string; phone: string };
  let userB: { id: string; phone: string };
  let orderInA: string;
  let orderInB: string;

  beforeAll(async () => {
    // Seed test data
    tenantA = await prisma.tenant.create({
      data: { slug: 'tenant-a-test', name: 'Tenant A Test' },
    });

    tenantB = await prisma.tenant.create({
      data: { slug: 'tenant-b-test', name: 'Tenant B Test' },
    });

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('test123', 12);

    userA = await prisma.user.create({
      data: {
        phone: '+48999000001',
        passwordHash,
        name: 'User A',
        memberships: {
          create: {
            tenantId: tenantA.id,
            role: 'ADMIN',
            acceptedAt: new Date(),
          },
        },
      },
    });

    userB = await prisma.user.create({
      data: {
        phone: '+48999000002',
        passwordHash,
        name: 'User B',
        memberships: {
          create: {
            tenantId: tenantB.id,
            role: 'ADMIN',
            acceptedAt: new Date(),
          },
        },
      },
    });

    // Create order in tenant A (bypass RLS for test setup)
    const orderA = await prisma.order.create({
      data: {
        tenantId: tenantA.id,
        orderNumber: 'TEST-A-001',
        status: 'NEW',
        clientName: 'Client in A',
        createdById: userA.id,
      },
    });
    orderInA = orderA.id;

    // Create order in tenant B
    const orderB = await prisma.order.create({
      data: {
        tenantId: tenantB.id,
        orderNumber: 'TEST-B-001',
        status: 'NEW',
        clientName: 'Client in B',
        createdById: userB.id,
      },
    });
    orderInB = orderB.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.order.deleteMany({
      where: {
        tenantId: { in: [tenantA.id, tenantB.id] },
      },
    });
    await prisma.membership.deleteMany({
      where: {
        tenantId: { in: [tenantA.id, tenantB.id] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [userA.id, userB.id] },
      },
    });
    await prisma.tenant.deleteMany({
      where: {
        id: { in: [tenantA.id, tenantB.id] },
      },
    });
    await prisma.$disconnect();
  });

  describe('Order Isolation', () => {
    test('Tenant A user can see own orders', async () => {
      // Login as user A in tenant A
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-Slug', 'tenant-a-test')
        .send({ phone: '+48999000001', password: 'test123' });

      expect(loginRes.status).toBe(200);
      const cookies = loginRes.headers['set-cookie'];

      // Fetch orders
      const ordersRes = await request(app)
        .get('/api/orders')
        .set('X-Tenant-Slug', 'tenant-a-test')
        .set('Cookie', cookies);

      expect(ordersRes.status).toBe(200);
      expect(ordersRes.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify only tenant A orders
      ordersRes.body.data.forEach((order: any) => {
        expect(order.tenantId).toBe(tenantA.id);
      });
    });

    test('Tenant B user CANNOT see Tenant A orders', async () => {
      // Login as user B in tenant B
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-Slug', 'tenant-b-test')
        .send({ phone: '+48999000002', password: 'test123' });

      expect(loginRes.status).toBe(200);
      const cookies = loginRes.headers['set-cookie'];

      // Fetch orders in tenant B context
      const ordersRes = await request(app)
        .get('/api/orders')
        .set('X-Tenant-Slug', 'tenant-b-test')
        .set('Cookie', cookies);

      expect(ordersRes.status).toBe(200);

      // Should NOT contain any tenant A orders
      const tenantAOrders = ordersRes.body.data.filter(
        (order: any) => order.tenantId === tenantA.id
      );
      expect(tenantAOrders.length).toBe(0);
    });

    test('Tenant B user CANNOT access Tenant A order by ID', async () => {
      // Login as user B
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-Slug', 'tenant-b-test')
        .send({ phone: '+48999000002', password: 'test123' });

      const cookies = loginRes.headers['set-cookie'];

      // Try to access order from tenant A
      const orderRes = await request(app)
        .get(`/api/orders/${orderInA}`)
        .set('X-Tenant-Slug', 'tenant-b-test')
        .set('Cookie', cookies);

      // Should be 404 (RLS blocks it) or 403
      expect([404, 403]).toContain(orderRes.status);
    });

    test('User B with membership in Tenant B CANNOT use Tenant A context', async () => {
      // Login as user B
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-Slug', 'tenant-b-test')
        .send({ phone: '+48999000002', password: 'test123' });

      const cookies = loginRes.headers['set-cookie'];

      // Try to access tenant A with user B's session
      const ordersRes = await request(app)
        .get('/api/orders')
        .set('X-Tenant-Slug', 'tenant-a-test') // Trying different tenant!
        .set('Cookie', cookies);

      // Should fail - no membership in tenant A
      expect(ordersRes.status).toBe(403);
    });
  });

  describe('Cross-tenant data leakage prevention', () => {
    test('Order count matches per tenant', async () => {
      // Count orders in tenant A
      const countA = await prisma.order.count({
        where: { tenantId: tenantA.id },
      });

      // Count orders in tenant B
      const countB = await prisma.order.count({
        where: { tenantId: tenantB.id },
      });

      // These should be separate counts
      expect(countA).toBeGreaterThanOrEqual(1);
      expect(countB).toBeGreaterThanOrEqual(1);

      // Total should be sum of both
      const totalOrders = await prisma.order.count({
        where: {
          tenantId: { in: [tenantA.id, tenantB.id] },
        },
      });
      expect(totalOrders).toBe(countA + countB);
    });
  });
});
