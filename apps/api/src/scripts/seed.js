import mongoose from 'mongoose';
import argon2 from 'argon2';
import { env } from '../config/env.js';
import { Role, User, Tenant, Outlet } from '../models/index.js';
import { ROLE_DEFINITIONS, ROLES } from '@pos/shared';

async function seed() {
  console.info('🌱 Seeding database...');
  await mongoose.connect(env.MONGODB_URI);

  // 1. Seed Roles
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
  console.info('✅ Roles seeded');

  // 2. Seed Default Tenant & Outlet
  const tenant = await Tenant.findOneAndUpdate(
    { code: 'DEFAULT' },
    {
      name: 'Spice Garden Group',
      code: 'DEFAULT',
      contactEmail: 'contact@spicegarden.com',
      contactPhone: '9876543210',
    },
    { upsert: true, new: true }
  );

  const outlet = await Outlet.findOneAndUpdate(
    { tenantId: tenant._id, name: 'Main Outlet - Bandra' },
    {
      tenantId: tenant._id,
      name: 'Main Outlet - Bandra',
      legalName: 'Spice Garden Pvt Ltd',
      gstin: '27AAPFU0939F1ZV',
      fssaiNumber: '11521034000123',
      phone: '9876543210',
      email: 'bandra@spicegarden.com',
      address: {
        line1: '12 Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        pincode: '400050',
      },
    },
    { upsert: true, new: true }
  );
  console.info('✅ Default Tenant and Outlet seeded');

  // 3. Seed Super Admin
  const adminPasswordHash = await argon2.hash('Admin@12345');
  const adminPinHash = await argon2.hash('1234');

  await User.findOneAndUpdate(
    { phone: '9999999999' },
    {
      tenantId: tenant._id,
      outletId: outlet._id,
      name: 'Super Admin',
      email: 'admin@pos.internal',
      phone: '9999999999',
      role: ROLES.SUPER_ADMIN,
      passwordHash: adminPasswordHash,
      pinHash: adminPinHash,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  // 4. Seed Biller & Captain with PINs
  const billerPinHash = await argon2.hash('2222');
  await User.findOneAndUpdate(
    { phone: '8888888888' },
    {
      tenantId: tenant._id,
      outletId: outlet._id,
      name: 'Counter Cashier',
      phone: '8888888888',
      role: ROLES.BILLER,
      pinHash: billerPinHash,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const captainPinHash = await argon2.hash('3333');
  await User.findOneAndUpdate(
    { phone: '7777777777' },
    {
      tenantId: tenant._id,
      outletId: outlet._id,
      name: 'Floor Captain',
      phone: '7777777777',
      role: ROLES.CAPTAIN,
      pinHash: captainPinHash,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  console.info('✅ Default users seeded');
  console.info('   Super Admin: 9999999999 / Admin@12345 (PIN: 1234)');
  console.info('   Biller PIN:  2222');
  console.info('   Captain PIN: 3333');

  await mongoose.connection.close();
  console.info('✨ Seed finished successfully');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
