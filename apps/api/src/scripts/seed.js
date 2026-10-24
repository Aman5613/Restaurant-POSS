import dns from 'node:dns';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { env } from '../config/env.js';
import {
  Role,
  User,
  Tenant,
  Outlet,
  Customer,
  BusinessDay,
  Shift,
  Bill,
  Payment,
  Invoice,
  Order,
  KOT,
  PrintJob,
  Session,
} from '../models/index.js';
import { ROLE_DEFINITIONS, ROLES } from '@pos/shared';
import { OutletService } from '../modules/outlet/outlet.service.js';

async function seed() {
  /* eslint-disable no-console */
  console.info('🧹 Cleaning up and preparing production database...');
  if (env.MONGODB_URI?.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (_e) {
      // ignore
    }
  }
  await mongoose.connect(env.MONGODB_URI);

  // 1. Seed Roles Definitions
  for (const [slug, def] of Object.entries(ROLE_DEFINITIONS)) {
    await Role.findOneAndUpdate(
      { slug },
      {
        name: def.name,
        slug,
        description: def.description,
        permissions: def.permissions,
        level: def.level,
        isSystem: true,
      },
      { upsert: true, new: true }
    );
  }
  console.info('✅ Roles definitions verified');

  // 2. Delete ALL demo orders, KOTs, print jobs, bills, payments, invoices, shifts, and customers
  console.info('🗑️ Purging all demo orders, KOTs, bills, and transactions...');
  await Promise.all([
    Order.deleteMany({}),
    KOT.deleteMany({}),
    PrintJob.deleteMany({}),
    Bill.deleteMany({}),
    Payment.deleteMany({}),
    Invoice.deleteMany({}),
    Shift.deleteMany({}),
    BusinessDay.deleteMany({}),
    Customer.deleteMany({}),
    Session.deleteMany({}),
  ]);
  console.info('✅ Purged all demo transactions');

  // 3. Delete ALL demo staff (admin, manager, biller, captain, cook)
  console.info('🗑️ Purging demo staff accounts (admin, biller, captain, cook, manager)...');
  const deletedUsers = await User.deleteMany({ role: { $ne: ROLES.SUPER_ADMIN } });
  console.info(`✅ Removed ${deletedUsers.deletedCount} demo staff accounts`);

  // 4. Seed ONLY Platform Super Admin
  const defaultPassword = await argon2.hash('Pos@12345');
  const defaultPin = await argon2.hash('9999');

  const superAdmin = await User.findOneAndUpdate(
    { role: ROLES.SUPER_ADMIN },
    {
      name: 'Platform Super Admin',
      email: 'superadmin@pos.internal',
      phone: '9999999999',
      role: ROLES.SUPER_ADMIN,
      passwordHash: defaultPassword,
      pinHash: defaultPin,
      isActive: true,
    },
    { upsert: true, new: true }
  );
  console.info('👑 ONLY Platform Super Admin preserved:');
  console.info(`   - Email: ${superAdmin.email}`);
  console.info(`   - Phone: ${superAdmin.phone}`);
  console.info('   - Password: Pos@12345');
  console.info('   - PIN: 9999');

  // 5. Seed default Tenant and Outlet Template with default tables & menu catalog
  const tenant = await Tenant.findOneAndUpdate(
    { code: 'DEFAULT' },
    {
      name: 'Default Restaurant Group',
      code: 'DEFAULT',
      contactEmail: 'contact@pos.internal',
      contactPhone: '9999999999',
    },
    { upsert: true, new: true }
  );

  const outlet = await Outlet.findOneAndUpdate(
    { tenantId: tenant._id, name: 'Main Restaurant Outlet' },
    {
      tenantId: tenant._id,
      name: 'Main Restaurant Outlet',
      legalName: 'Restaurant Pvt Ltd',
      phone: '9999999999',
      email: 'outlet@pos.internal',
      address: {
        line1: 'Main Market Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        pincode: '400001',
      },
      isSetupCompleted: true,
    },
    { upsert: true, new: true }
  );

  // 6. Seed default Slabs, Kitchen Stations, Menu Items, and Dining Tables for the store
  const outletService = new OutletService();
  await outletService.seedStandardSlabs(outlet._id);
  await outletService.seedStandardCatalogAndTables(outlet._id);
  console.info('✅ Default tables and menu catalog initialized (Admin can edit/delete freely)');

  await mongoose.connection.close();
  console.info('🚀 Database cleanup & production setup completed successfully!\n');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
