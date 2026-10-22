import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import {
  Outlet,
  User,
  Category,
  Item,
  DiningTable,
  TableSession,
  Order,
  KOT,
  Bill,
  Payment,
  Invoice,
  BusinessDay,
  Shift,
  CashMovement,
} from '../models/index.js';
import { calculateBill } from '@pos/shared';

async function runSimulation() {
  /* eslint-disable no-console */
  console.log('🚀 Starting Full Day Cycle E2E Simulation...\n');

  if (env.MONGODB_URI?.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (_e) {
      // ignore
    }
  }

  await mongoose.connect(env.MONGODB_URI);

  // 1. Fetch Outlet and Users
  const outlet = await Outlet.findOne();
  if (!outlet) {
    throw new Error('Please run pnpm --filter @pos/api db:seed first to initialize outlet and users.');
  }

  const manager = await User.findOne({ email: 'admin@spicegarden.com' });
  const biller = await User.findOne({ email: 'biller@spicegarden.com' });
  console.log(`✅ Outlet: ${outlet.name} (ID: ${outlet._id})`);
  console.log(`✅ Operator: ${biller?.name || 'Cashier'} | Manager: ${manager?.name || 'Manager'}\n`);

  // 2. Open Business Day
  const todayStr = new Date().toISOString().slice(0, 10);
  let businessDay = await BusinessDay.findOne({ outlet_id: outlet._id, state: 'OPEN' });

  if (!businessDay) {
    businessDay = await BusinessDay.create({
      outlet_id: outlet._id,
      business_date: todayStr,
      opened_by: manager._id,
      opened_at: new Date(),
      opening_float: 500000, // ₹5,000 in paise
      state: 'OPEN',
    });
    console.log(`📅 Step 1: Opened Business Day for ${todayStr} with Float ₹5,000`);
  } else {
    console.log(`📅 Step 1: Active Business Day already open (${businessDay.business_date})`);
  }

  // 3. Open Shift
  let shift = await Shift.findOne({ business_day_id: businessDay._id, user_id: biller._id, state: 'OPEN' });
  if (!shift) {
    shift = await Shift.create({
      business_day_id: businessDay._id,
      outlet_id: outlet._id,
      user_id: biller._id,
      opening_cash: 500000,
      opened_at: new Date(),
      state: 'OPEN',
    });
    console.log(`⏰ Step 2: Opened Shift for ${biller.name} with Float ₹5,000`);
  } else {
    console.log(`⏰ Step 2: Active Shift found for ${biller.name}`);
  }

  // 4. Setup Sample Menu & Table
  let category = await Category.findOne({ outlet_id: outlet._id, name: 'Main Course' });
  if (!category) {
    category = await Category.create({
      outlet_id: outlet._id,
      name: 'Main Course',
      sort_order: 1,
    });
  }

  let itemBiryani = await Item.findOne({ outlet_id: outlet._id, name: 'Chicken Biryani Special' });
  if (!itemBiryani) {
    itemBiryani = await Item.create({
      outlet_id: outlet._id,
      category_id: category._id,
      name: 'Chicken Biryani Special',
      price: 35000, // ₹350
      tax_rate: 5,
      is_available: true,
    });
  }

  let table = await DiningTable.findOne({ outlet_id: outlet._id, table_number: 'T-10' });
  if (!table) {
    table = await DiningTable.create({
      outlet_id: outlet._id,
      table_number: 'T-10',
      capacity: 4,
      status: 'VACANT',
    });
  }
  console.log(`🍽️  Step 3: Verified Table ${table.table_number} & Menu Item '${itemBiryani.name}' (₹350)`);

  // 5. Open Table Session & Create Dine-in Order
  const session = await TableSession.create({
    outlet_id: outlet._id,
    table_id: table._id,
    opened_by: biller._id,
    guest_count: 2,
    status: 'ACTIVE',
  });

  table.status = 'OCCUPIED';
  table.current_session_id = session._id;
  await table.save();

  const order = await Order.create({
    outlet_id: outlet._id,
    business_day_id: businessDay._id,
    shift_id: shift._id,
    order_type: 'DINE_IN',
    table_id: table._id,
    table_session_id: session._id,
    order_no: `D1-${Date.now().toString().slice(-4)}`,
    status: 'RUNNING',
    lines: [
      {
        line_id: new mongoose.Types.ObjectId(),
        item_id: itemBiryani._id,
        name: itemBiryani.name,
        quantity: 2,
        unit_price: itemBiryani.price,
        gross_amount: itemBiryani.price * 2,
        tax_rate: itemBiryani.tax_rate,
        state: 'DRAFT',
      },
    ],
    captain_id: biller._id,
  });
  console.log(`📝 Step 4: Table ${table.table_number} occupied, Order ${order.order_no} created (2x ${itemBiryani.name})`);

  // 6. Send KOT to Kitchen
  const kot = await KOT.create({
    outlet_id: outlet._id,
    order_id: order._id,
    order_no: order.order_no,
    table_name: table.table_number,
    kot_no: `KOT-${Date.now().toString().slice(-4)}`,
    lines: order.lines.map((l) => ({
      item_name: l.name,
      quantity: l.quantity,
      notes: 'Less spicy',
    })),
    status: 'PRINTED',
  });

  order.lines.forEach((l) => {
    l.state = 'SENT';
  });
  await order.save();
  console.log(`👨‍🍳 Step 5: Kitchen Ticket ${kot.kot_no} printed for Main Kitchen`);

  // 7. Calculate Bill with Shared Engine
  const calculated = calculateBill({
    items: [
      {
        itemId: itemBiryani._id.toString(),
        name: itemBiryani.name,
        unitPrice: itemBiryani.price,
        quantity: 2,
        taxRate: 5,
        isTaxInclusive: false,
      },
    ],
    billDiscount: { type: 'FLAT', value: 50 }, // ₹50 flat discount
  });

  const bill = await Bill.create({
    outlet_id: outlet._id,
    order_id: order._id,
    order_no: order.order_no,
    bill_no: `BIL-${Date.now().toString().slice(-4)}`,
    state: 'PAID',
    lines: [
      {
        line_id: order.lines[0].line_id,
        item_id: itemBiryani._id,
        name: itemBiryani.name,
        quantity: 2,
        unit_price: itemBiryani.price,
        gross_amount: calculated.subtotal,
        discount_amount: calculated.totalDiscount,
        taxable_amount: calculated.lines[0].taxableAmount,
        tax_rate: 5,
        cgst_amount: calculated.taxes.cgst,
        sgst_amount: calculated.taxes.sgst,
        total_amount: calculated.payableAmount,
      },
    ],
    subtotal: calculated.subtotal,
    discount_amount: calculated.totalDiscount,
    cgst_total: calculated.taxes.cgst,
    sgst_total: calculated.taxes.sgst,
    grand_total: calculated.payableAmount,
    paid_amount: calculated.payableAmount,
    settled_by: biller._id,
    settled_at: new Date(),
  });
  console.log(`🧾 Step 6: Bill ${bill.bill_no} calculated: Subtotal ₹${calculated.subtotal / 100}, GST ₹${(calculated.taxes.cgst + calculated.taxes.sgst) / 100}, Discount ₹${calculated.totalDiscount / 100}, Net Payable: ₹${calculated.payableAmount / 100}`);

  // 8. Payment & Legal Tax Invoice
  await Payment.create({
    outlet_id: outlet._id,
    bill_id: bill._id,
    order_id: order._id,
    mode: 'UPI',
    amount: calculated.payableAmount,
    reference_no: `UPI${Date.now().toString().slice(-8)}`,
    status: 'SUCCESS',
    created_by: biller._id,
  });

  const invoice = await Invoice.create({
    outlet_id: outlet._id,
    bill_id: bill._id,
    order_id: order._id,
    invoice_no: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    total_amount: calculated.payableAmount,
    gstin: outlet.gstin,
    payment_mode: 'UPI',
  });
  console.log(`💳 Step 7: Payment collected via UPI. Final Tax Invoice ${invoice.invoice_no} issued`);

  // Release table
  table.status = 'VACANT';
  table.current_session_id = null;
  await table.save();
  session.status = 'CLOSED';
  session.closed_at = new Date();
  await session.save();

  // 9. Petty Cash Expense
  await CashMovement.create({
    outlet_id: outlet._id,
    business_day_id: businessDay._id,
    shift_id: shift._id,
    type: 'PETTY_OUT',
    amount: 15000, // ₹150 for dairy milk
    category: 'DAIRY_PURCHASE',
    reason: 'Fresh curd & milk from local vendor',
    performed_by: biller._id,
  });
  console.log('💵 Step 8: Petty Cash recorded (-₹150 for local dairy purchase)');

  // 10. Close Shift & Reconcile
  shift.state = 'CLOSED';
  shift.closing_cash_counted = 500000; // Float intact (UPI payment + petty cash from float)
  shift.closed_at = new Date();
  await shift.save();
  console.log(`🔒 Step 9: Shift closed for ${biller.name}`);

  console.log('\n=========================================');
  console.log('🎉 Full Day Operations Cycle Complete!');
  console.log(`- Orders Handled: 1 | Billed Total: ₹${calculated.payableAmount / 100}`);
  console.log(`- Tax Collected: CGST ₹${calculated.taxes.cgst / 100} + SGST ₹${calculated.taxes.sgst / 100}`);
  console.log(`- Invoices: ${invoice.invoice_no} | Status: Settled`);
  console.log('=========================================\n');

  await mongoose.disconnect();
}

runSimulation().catch((err) => {
  console.error('❌ Simulation Error:', err);
  process.exit(1);
});
