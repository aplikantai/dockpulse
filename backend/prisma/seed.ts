import { PrismaClient, TenantRole, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ==================== TENANTS ====================
  console.log('Creating tenants...');

  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Demo Company',
      primaryColor: '#3B82F6',
      locale: 'pl-PL',
      timezone: 'Europe/Warsaw',
      plan: 'PRO',
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'test' },
    update: {},
    create: {
      slug: 'test',
      name: 'Test Company',
      primaryColor: '#10B981',
      locale: 'en-US',
      timezone: 'Europe/London',
      plan: 'STARTER',
    },
  });

  console.log(`Created tenants: ${tenant1.slug}, ${tenant2.slug}`);

  // ==================== USERS ====================
  console.log('Creating users...');

  const passwordHash = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { phone: '+48000000001' },
    update: {},
    create: {
      phone: '+48000000001',
      passwordHash,
      name: 'Admin User',
      email: 'admin@example.com',
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { phone: '+48000000002' },
    update: {},
    create: {
      phone: '+48000000002',
      passwordHash,
      name: 'Manager User',
      email: 'manager@example.com',
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { phone: '+48000000003' },
    update: {},
    create: {
      phone: '+48000000003',
      passwordHash,
      name: 'Member User',
      email: 'member@example.com',
    },
  });

  console.log(`Created users: ${adminUser.name}, ${managerUser.name}, ${memberUser.name}`);

  // ==================== MEMBERSHIPS ====================
  console.log('Creating memberships...');

  // Admin is OWNER in tenant1 and ADMIN in tenant2
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant1.id } },
    update: {},
    create: {
      userId: adminUser.id,
      tenantId: tenant1.id,
      role: TenantRole.OWNER,
      permissions: [],
      acceptedAt: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant2.id } },
    update: {},
    create: {
      userId: adminUser.id,
      tenantId: tenant2.id,
      role: TenantRole.ADMIN,
      permissions: [],
      acceptedAt: new Date(),
    },
  });

  // Manager is MANAGER in tenant1 only
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: managerUser.id, tenantId: tenant1.id } },
    update: {},
    create: {
      userId: managerUser.id,
      tenantId: tenant1.id,
      role: TenantRole.MANAGER,
      permissions: ['ORDER_CHANGE_STATUS'],
      acceptedAt: new Date(),
    },
  });

  // Member is MEMBER in tenant1 and tenant2
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: memberUser.id, tenantId: tenant1.id } },
    update: {},
    create: {
      userId: memberUser.id,
      tenantId: tenant1.id,
      role: TenantRole.MEMBER,
      permissions: [],
      acceptedAt: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: memberUser.id, tenantId: tenant2.id } },
    update: {},
    create: {
      userId: memberUser.id,
      tenantId: tenant2.id,
      role: TenantRole.MEMBER,
      permissions: [],
      acceptedAt: new Date(),
    },
  });

  console.log('Created memberships');

  // ==================== CLIENT USERS (Portal) ====================
  console.log('Creating client users...');

  const clientPassword = await bcrypt.hash('client123', 12);

  const client1 = await prisma.clientUser.upsert({
    where: { tenantId_email: { tenantId: tenant1.id, email: 'client1@example.com' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      email: 'client1@example.com',
      passwordHash: clientPassword,
      name: 'Client One',
      company: 'Client Company 1',
      phone: '+48111222333',
      emailVerified: true,
    },
  });

  const client2 = await prisma.clientUser.upsert({
    where: { tenantId_email: { tenantId: tenant1.id, email: 'client2@example.com' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      email: 'client2@example.com',
      passwordHash: clientPassword,
      name: 'Client Two',
      company: 'Client Company 2',
      emailVerified: true,
    },
  });

  console.log(`Created clients: ${client1.name}, ${client2.name}`);

  // ==================== PRODUCTS ====================
  console.log('Creating products...');

  const products = await Promise.all([
    prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant1.id, sku: 'PROD-001' } },
      update: {},
      create: {
        tenantId: tenant1.id,
        sku: 'PROD-001',
        name: 'Standard Service',
        description: 'Standard service package',
        price: 100,
        unit: 'szt',
      },
    }),
    prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant1.id, sku: 'PROD-002' } },
      update: {},
      create: {
        tenantId: tenant1.id,
        sku: 'PROD-002',
        name: 'Premium Service',
        description: 'Premium service package with priority support',
        price: 250,
        unit: 'szt',
      },
    }),
    prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant1.id, sku: 'PROD-003' } },
      update: {},
      create: {
        tenantId: tenant1.id,
        sku: 'PROD-003',
        name: 'Consultation Hour',
        description: 'One hour of expert consultation',
        price: 150,
        unit: 'h',
      },
    }),
  ]);

  console.log(`Created ${products.length} products`);

  // ==================== ORDERS ====================
  console.log('Creating sample orders...');

  const order1 = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId: tenant1.id, orderNumber: 'ORD-2025-00001' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      orderNumber: 'ORD-2025-00001',
      status: OrderStatus.NEW,
      clientUserId: client1.id,
      clientName: client1.name,
      clientEmail: client1.email,
      clientCompany: client1.company,
      notes: 'First test order from portal',
      createdById: adminUser.id,
      items: {
        create: [
          {
            productId: products[0].id,
            name: products[0].name,
            quantity: 2,
            unitPrice: products[0].price,
            totalPrice: products[0].price.mul(2),
          },
        ],
      },
      statusHistory: {
        create: {
          toStatus: OrderStatus.NEW,
          changedById: adminUser.id,
        },
      },
    },
  });

  const order2 = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId: tenant1.id, orderNumber: 'ORD-2025-00002' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      orderNumber: 'ORD-2025-00002',
      status: OrderStatus.IN_PROGRESS,
      clientUserId: client2.id,
      clientName: client2.name,
      clientEmail: client2.email,
      notes: 'Second test order - in progress',
      assignedToId: managerUser.id,
      createdById: adminUser.id,
      items: {
        create: [
          {
            productId: products[1].id,
            name: products[1].name,
            quantity: 1,
            unitPrice: products[1].price,
            totalPrice: products[1].price,
          },
          {
            productId: products[2].id,
            name: products[2].name,
            quantity: 3,
            unitPrice: products[2].price,
            totalPrice: products[2].price.mul(3),
          },
        ],
      },
      statusHistory: {
        create: [
          { toStatus: OrderStatus.NEW, changedById: adminUser.id },
          { fromStatus: OrderStatus.NEW, toStatus: OrderStatus.CONFIRMED, changedById: adminUser.id },
          { fromStatus: OrderStatus.CONFIRMED, toStatus: OrderStatus.IN_PROGRESS, changedById: managerUser.id },
        ],
      },
    },
  });

  // Order in tenant2 (isolation test)
  const order3 = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId: tenant2.id, orderNumber: 'ORD-2025-00001' } },
    update: {},
    create: {
      tenantId: tenant2.id,
      orderNumber: 'ORD-2025-00001',
      status: OrderStatus.NEW,
      clientName: 'External Client',
      clientEmail: 'external@example.com',
      notes: 'Order in different tenant - should not be visible in tenant1',
      createdById: adminUser.id,
      statusHistory: {
        create: {
          toStatus: OrderStatus.NEW,
          changedById: adminUser.id,
        },
      },
    },
  });

  console.log(`Created orders: ${order1.orderNumber}, ${order2.orderNumber}, ${order3.orderNumber}`);

  // ==================== CUSTOMERS ====================
  console.log('Creating customers...');

  await prisma.customer.upsert({
    where: { id: 'customer-1-seed' },
    update: {},
    create: {
      id: 'customer-1-seed',
      tenantId: tenant1.id,
      name: 'ABC Corporation',
      email: 'contact@abc-corp.com',
      phone: '+48123456789',
      company: 'ABC Corporation',
      address: 'ul. Testowa 1',
      city: 'Warszawa',
      postalCode: '00-001',
      country: 'PL',
    },
  });

  console.log('Created customers');

  console.log(`
========================================
  Seed completed successfully!

  Test accounts:

  PANEL (Staff):
  - Phone: +48000000001, Password: admin123 (OWNER)
  - Phone: +48000000002, Password: admin123 (MANAGER)
  - Phone: +48000000003, Password: admin123 (MEMBER)

  PORTAL (Clients):
  - Email: client1@example.com, Password: client123
  - Email: client2@example.com, Password: client123

  Tenants:
  - demo.dockpulse.com (or X-Tenant-Slug: demo)
  - test.dockpulse.com (or X-Tenant-Slug: test)
========================================
  `);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
