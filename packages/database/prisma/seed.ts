import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================
  // PLATFORM ADMIN
  // ============================================
  console.log('📋 Checking for Platform Admin...');

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'PLATFORM_ADMIN' },
  });

  if (existingAdmin) {
    console.log(`✅ Platform Admin already exists: ${existingAdmin.email}`);
  } else {
    console.log('Creating first Platform Admin...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dockpulse.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Platform Admin',
        role: 'PLATFORM_ADMIN',
        tenantId: null, // Platform admins don't belong to any tenant
        active: true,
      },
    });

    console.log(`✅ Platform Admin created!`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!\n`);
  }

  // ============================================
  // MODULE PRICES (if table exists)
  // ============================================
  try {
    console.log('📋 Checking for Module Prices...');

    const pricesCount = await prisma.modulePrice.count();

    if (pricesCount === 0) {
      console.log('Creating default module prices...');

      const defaultPrices = [
        // CORE modules - free
        { moduleCode: 'CRM', priceNet: 0, description: 'Zarządzanie klientami - darmowy', isActive: true },
        { moduleCode: 'ORDERS', priceNet: 0, description: 'Zamówienia - darmowy', isActive: true },
        { moduleCode: 'PRODUCTS', priceNet: 0, description: 'Katalog produktów - darmowy', isActive: true },

        // ADDON modules - paid
        { moduleCode: 'INVENTORY', priceNet: 299, description: 'Magazyn WMS', isActive: true },
        { moduleCode: 'QUOTES', priceNet: 199, description: 'Wyceny i oferty', isActive: true },
        { moduleCode: 'INVOICES', priceNet: 249, description: 'Faktury', isActive: true },
        { moduleCode: 'REPORTS', priceNet: 199, description: 'Raporty i analityka', isActive: true },
        { moduleCode: 'CALENDAR', priceNet: 99, description: 'Kalendarz i planowanie', isActive: true },

        // FUTURE modules
        { moduleCode: 'PRODUCTION', priceNet: 499, description: 'Planowanie produkcji', isActive: false },
        { moduleCode: 'ANALYTICS', priceNet: 399, description: 'Zaawansowana analityka', isActive: false },
        { moduleCode: 'WEBHOOKS', priceNet: 299, description: 'Webhooki i integracje', isActive: false },
        { moduleCode: 'API_ACCESS', priceNet: 199, description: 'Dostęp do API', isActive: false },
      ];

      for (const price of defaultPrices) {
        await prisma.modulePrice.create({
          data: price,
        });
        console.log(`   ✓ ${price.moduleCode}: ${price.priceNet} PLN`);
      }

      console.log(`✅ Created ${defaultPrices.length} module prices\n`);
    } else {
      console.log(`✅ Module prices already exist (${pricesCount} prices)\n`);
    }
  } catch (error) {
    console.log('⚠️  ModulePrice table not found - skipping module prices seed');
    console.log('   (This is OK if you haven\'t run migrations yet)\n');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
