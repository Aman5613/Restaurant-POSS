import dns from 'node:dns';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { env } from '../config/env.js';
import {
  Role,
  User,
  Tenant,
  Outlet,
  KitchenStation,
  Category,
  Item,
  Customer,
  BusinessDay,
  Shift,
  Bill,
  Payment,
  Invoice,
} from '../models/index.js';
import { ROLE_DEFINITIONS, ROLES, BILL_STATUS } from '@pos/shared';

async function seed() {
  /* eslint-disable no-console */
  console.info('🌱 Seeding full restaurant database...');
  if (env.MONGODB_URI?.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (_e) {
      // ignore
    }
  }
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

  // 2. Seed Tenant and Outlet
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

  // 3. Seed ALL Roles with Logins & PINs
  const defaultPassword = await argon2.hash('Pos@12345');

  const usersList = [
    {
      name: 'Platform Super Admin',
      email: 'superadmin@pos.internal',
      phone: '9999999999',
      role: ROLES.SUPER_ADMIN,
      pin: '9999',
    },
    {
      name: 'Aman (Outlet Owner / Admin)',
      email: 'admin@spicegarden.com',
      phone: '9888888888',
      role: ROLES.ADMIN,
      pin: '1111',
    },
    {
      name: 'Rajesh Verma (General Manager)',
      email: 'manager@spicegarden.com',
      phone: '9777777777',
      role: ROLES.MANAGER,
      pin: '2222',
    },
    {
      name: 'Deepak Sharma (Cashier / Biller)',
      email: 'biller@spicegarden.com',
      phone: '9666666666',
      role: ROLES.BILLER,
      pin: '3333',
    },
    {
      name: 'Sunil Kumar (Head Captain)',
      email: 'captain@spicegarden.com',
      phone: '9555555555',
      role: ROLES.CAPTAIN,
      pin: '4444',
    },
    {
      name: 'Chef Vikas (Kitchen Chef / Cook)',
      email: 'cook@spicegarden.com',
      phone: '9444444444',
      role: ROLES.COOK,
      pin: '5555',
    },
  ];

  for (const u of usersList) {
    const pinHash = await argon2.hash(u.pin);
    await User.findOneAndUpdate(
      { phone: u.phone },
      {
        tenantId: tenant._id,
        outletId: outlet._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        passwordHash: defaultPassword,
        pinHash,
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }
  console.info('✅ Users seeded for EVERY role:');
  usersList.forEach((u) => {
    console.info(`   - ${u.role.toUpperCase()}: ${u.email} / ${u.phone} (Password: Pos@12345, PIN: ${u.pin})`);
  });

  // 4. Seed Standard Slabs, Payment Modes, Series
  const outletService = new (await import('../modules/outlet/outlet.service.js')).OutletService();
  await outletService.seedStandardSlabs(outlet._id);

  // 5. Kitchen Stations
  const stationMain = await KitchenStation.findOneAndUpdate(
    { outletId: outlet._id, name: 'Main Kitchen' },
    { outletId: outlet._id, name: 'Main Kitchen', isActive: true },
    { upsert: true, new: true }
  );
  const stationGrill = await KitchenStation.findOneAndUpdate(
    { outletId: outlet._id, name: 'Tandoor & Grill' },
    { outletId: outlet._id, name: 'Tandoor & Grill', isActive: true },
    { upsert: true, new: true }
  );
  const stationBar = await KitchenStation.findOneAndUpdate(
    { outletId: outlet._id, name: 'Bar & Beverages' },
    { outletId: outlet._id, name: 'Bar & Beverages', isActive: true },
    { upsert: true, new: true }
  );
  console.info('✅ Kitchen stations seeded');

  // 6. Menu Categories & Items
  const catStarters = await Category.findOneAndUpdate(
    { outletId: outlet._id, name: 'Starters & Appetizers' },
    { outletId: outlet._id, name: 'Starters & Appetizers', sortOrder: 1, isActive: true },
    { upsert: true, new: true }
  );
  const catMains = await Category.findOneAndUpdate(
    { outletId: outlet._id, name: 'Curries & Main Course' },
    { outletId: outlet._id, name: 'Curries & Main Course', sortOrder: 2, isActive: true },
    { upsert: true, new: true }
  );
  const catBreads = await Category.findOneAndUpdate(
    { outletId: outlet._id, name: 'Breads & Biryani' },
    { outletId: outlet._id, name: 'Breads & Biryani', sortOrder: 3, isActive: true },
    { upsert: true, new: true }
  );
  const catDesserts = await Category.findOneAndUpdate(
    { outletId: outlet._id, name: 'Desserts & Beverages' },
    { outletId: outlet._id, name: 'Desserts & Beverages', sortOrder: 4, isActive: true },
    { upsert: true, new: true }
  );

  const menuItems = [
    // Starters
    { name: 'Paneer Tikka Angara', price: 28000, category: catStarters._id, station: stationGrill._id, isVeg: true },
    { name: 'Crispy Corn Salt & Pepper', price: 21000, category: catStarters._id, station: stationMain._id, isVeg: true },
    { name: 'Chicken Malai Tikka', price: 34000, category: catStarters._id, station: stationGrill._id, isVeg: false },
    { name: 'Veg Spring Rolls', price: 19000, category: catStarters._id, station: stationMain._id, isVeg: true },
    // Mains
    { name: 'Paneer Butter Masala', price: 32000, category: catMains._id, station: stationMain._id, isVeg: true },
    { name: 'Dal Makhani Gold', price: 26000, category: catMains._id, station: stationMain._id, isVeg: true },
    { name: 'Butter Chicken Classic', price: 38000, category: catMains._id, station: stationMain._id, isVeg: false },
    { name: 'Mutton Rogan Josh', price: 46000, category: catMains._id, station: stationMain._id, isVeg: false },
    { name: 'Kadhai Paneer', price: 29000, category: catMains._id, station: stationMain._id, isVeg: true },
    // Breads & Rice
    { name: 'Butter Naan', price: 4500, category: catBreads._id, station: stationGrill._id, isVeg: true },
    { name: 'Garlic Cheese Naan', price: 8000, category: catBreads._id, station: stationGrill._id, isVeg: true },
    { name: 'Tandoori Roti', price: 2500, category: catBreads._id, station: stationGrill._id, isVeg: true },
    { name: 'Dum Chicken Biryani', price: 36000, category: catBreads._id, station: stationMain._id, isVeg: false },
    { name: 'Hyderabadi Veg Biryani', price: 28000, category: catBreads._id, station: stationMain._id, isVeg: true },
    { name: 'Jeera Rice', price: 16000, category: catBreads._id, station: stationMain._id, isVeg: true },
    // Desserts & Drinks
    { name: 'Gulab Jamun (2 pcs)', price: 9000, category: catDesserts._id, station: stationMain._id, isVeg: true },
    { name: 'Mango Lassi Royal', price: 12000, category: catDesserts._id, station: stationBar._id, isVeg: true },
    { name: 'Fresh Lime Soda', price: 7000, category: catDesserts._id, station: stationBar._id, isVeg: true },
    { name: 'Masala Cutting Chai', price: 4000, category: catDesserts._id, station: stationBar._id, isVeg: true },
  ];

  const seededItemDocs = [];
  for (const m of menuItems) {
    const it = await Item.findOneAndUpdate(
      { outletId: outlet._id, name: m.name },
      {
        outletId: outlet._id,
        categoryId: m.category,
        stationId: m.station,
        name: m.name,
        basePrice: m.price,
        isVeg: m.isVeg,
        isAvailable: true,
      },
      { upsert: true, new: true }
    );
    seededItemDocs.push(it);
  }
  console.info(`✅ Seeded ${menuItems.length} restaurant menu items with GST 5% & station routing`);

  // 7. Demo Floor Tables
  const { Area, DiningTable } = await import('../models/index.js');
  const mainDining = await Area.findOneAndUpdate(
    { outletId: outlet._id, name: 'Main Dining Hall' },
    { outletId: outlet._id, name: 'Main Dining Hall', sortOrder: 1 },
    { upsert: true, new: true }
  );
  const rooftop = await Area.findOneAndUpdate(
    { outletId: outlet._id, name: 'Rooftop Terrace' },
    { outletId: outlet._id, name: 'Rooftop Terrace', sortOrder: 2 },
    { upsert: true, new: true }
  );

  const demoTables = [
    { num: 'T-01', cap: 4, area: mainDining._id, status: 'VACANT' },
    { num: 'T-02', cap: 2, area: mainDining._id, status: 'OCCUPIED' },
    { num: 'T-03', cap: 6, area: mainDining._id, status: 'VACANT' },
    { num: 'T-04', cap: 4, area: mainDining._id, status: 'BILLED' },
    { num: 'T-05', cap: 8, area: mainDining._id, status: 'VACANT' },
    { num: 'R-01', cap: 2, area: rooftop._id, status: 'VACANT' },
    { num: 'R-02', cap: 4, area: rooftop._id, status: 'OCCUPIED' },
    { num: 'R-03', cap: 4, area: rooftop._id, status: 'VACANT' },
  ];

  for (const dt of demoTables) {
    await DiningTable.findOneAndUpdate(
      { outletId: outlet._id, tableNumber: dt.num },
      {
        outletId: outlet._id,
        areaId: dt.area,
        tableNumber: dt.num,
        capacity: dt.cap,
        status: dt.status,
      },
      { upsert: true }
    );
  }
  console.info('✅ Demo floor layout and dining tables seeded');

  // 8. Customers with Loyalty and Outstanding Dues
  const customersList = [
    { name: 'Vikram Mehta', phone: '9820011223', email: 'vikram.m@gmail.com', spent: 1450000, due: 0, address: 'Flat 402, Pali Hill, Bandra' },
    { name: 'Ananya Deshmukh', phone: '9820044556', email: 'ananya.d@gmail.com', spent: 890000, due: 0, address: 'Bungalow 7, Carter Road' },
    { name: 'Corporate Account: TechCorp Solutions', phone: '9820077889', email: 'admin@techcorp.in', gstin: '27AABCT1234D1Z6', spent: 4850000, due: 1250000, address: 'Level 5, BKC Diamond District' },
    { name: 'Rohan Joshi', phone: '9820099001', email: 'rohan.j@gmail.com', spent: 320000, due: 45000, address: '14 Chapel Road, Bandra' },
    { name: 'Priya Sundaram', phone: '9820022334', email: 'priya.sundaram@gmail.com', spent: 2200000, due: 0, address: 'Perry Cross Road' },
  ];

  const cashierUser = await User.findOne({ phone: '9666666666' });

  for (const c of customersList) {
    await Customer.findOneAndUpdate(
      { outlet_id: outlet._id, phone: c.phone },
      {
        outlet_id: outlet._id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        gstin: c.gstin || '',
        address: c.address,
        stats: {
          total_spend: c.spent,
          current_due: c.due,
          total_orders: Math.max(1, Math.floor(c.spent / 60000)),
          last_visit_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 5)),
        },
      },
      { upsert: true }
    );
  }
  console.info('✅ Customers and Credit Ledger accounts seeded');

  // 9. Open Business Day & Shift
  const todayDate = new Date().toISOString().slice(0, 10);
  const businessDay = await BusinessDay.findOneAndUpdate(
    { outlet_id: outlet._id, date: todayDate },
    {
      outlet_id: outlet._id,
      date: todayDate,
      status: 'OPEN',
      opening_float: 500000, // ₹5,000
      opened_at: new Date(),
      opened_by: cashierUser._id,
    },
    { upsert: true, new: true }
  );

  await Shift.findOneAndUpdate(
    { business_day_id: businessDay._id, user_id: cashierUser._id },
    {
      business_day_id: businessDay._id,
      outlet_id: outlet._id,
      user_id: cashierUser._id,
      opening_cash: 500000,
      opened_at: new Date(),
      status: 'OPEN',
    },
    { upsert: true }
  );
  console.info('✅ Active Business Day and Cashier Shift opened with ₹5,000 float');

  // 10. Seed Historical Sales Bills for Analytics & Charts
  const modes = ['UPI', 'CASH', 'CARD', 'UPI', 'CARD'];
  const sampleBillsCount = 12;

  for (let i = 1; i <= sampleBillsCount; i++) {
    const item1 = seededItemDocs[(i * 2) % seededItemDocs.length];
    const item2 = seededItemDocs[(i * 3 + 1) % seededItemDocs.length];
    const subtotal = item1.basePrice * 2 + item2.basePrice;
    const cgst = Math.round(subtotal * 0.025);
    const sgst = cgst;
    const grandTotal = subtotal + cgst + sgst;
    const mode = modes[i % modes.length];
    const billTime = new Date(Date.now() - (sampleBillsCount - i) * 3600000); // spread across hours

    const bill = await Bill.create({
      outlet_id: outlet._id,
      order_id: new mongoose.Types.ObjectId(),
      order_no: `ORD-${(1000 + i)}`,
      bill_no: `BIL-${(1000 + i)}`,
      invoice_no: `INV-2026-${(1000 + i)}`,
      state: BILL_STATUS.PAID,
      lines: [
        {
          line_id: new mongoose.Types.ObjectId(),
          item_id: item1._id,
          name: item1.name,
          quantity: 2,
          unit_price: item1.basePrice,
          gross_amount: item1.basePrice * 2,
          taxable_amount: item1.basePrice * 2,
          tax_rate: 5,
          cgst_amount: Math.round(item1.basePrice * 2 * 0.025),
          sgst_amount: Math.round(item1.basePrice * 2 * 0.025),
          total_amount: item1.basePrice * 2 + Math.round(item1.basePrice * 2 * 0.05),
        },
        {
          line_id: new mongoose.Types.ObjectId(),
          item_id: item2._id,
          name: item2.name,
          quantity: 1,
          unit_price: item2.basePrice,
          gross_amount: item2.basePrice,
          taxable_amount: item2.basePrice,
          tax_rate: 5,
          cgst_amount: Math.round(item2.basePrice * 0.025),
          sgst_amount: Math.round(item2.basePrice * 0.025),
          total_amount: item2.basePrice + Math.round(item2.basePrice * 0.05),
        },
      ],
      subtotal,
      cgst_total: cgst,
      sgst_total: sgst,
      grand_total: grandTotal,
      paid_amount: grandTotal,
      settled_by: cashierUser._id,
      settled_at: billTime,
      createdAt: billTime,
      updatedAt: billTime,
    });

    await Payment.create({
      outlet_id: outlet._id,
      bill_id: bill._id,
      mode,
      amount: grandTotal,
      status: 'SUCCESS',
      created_by: cashierUser._id,
      createdAt: billTime,
    });

    await Invoice.create({
      outlet_id: outlet._id,
      bill_id: bill._id,
      order_id: bill.order_id,
      invoice_no: `INV-2026-${(1000 + i)}`,
      financial_year: '2026-27',
      total_amount: grandTotal,
      payment_mode: mode,
      snapshot: {
        outlet: {
          name: outlet.name,
          gstin: outlet.gstin,
        },
      },
      createdAt: billTime,
    });
  }
  console.info(`✅ Seeded ${sampleBillsCount} historical settled bills & invoices for analytics charts`);

  await mongoose.connection.close();
  console.info('✨ Full restaurant database seeded successfully!\n');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
