import mongoose from 'mongoose';
import { Bill, Payment, BusinessDay, CashMovement } from '../../models/index.js';
import { BILL_STATUS } from '@pos/shared';

export async function getSalesSummary(request, reply) {
  const outletId = request.user?.outletId;
  const { startDate, endDate } = request.query;

  const matchQuery = {
    state: { $in: [BILL_STATUS.PAID, BILL_STATUS.SETTLED, 'PAID', 'SETTLED'] },
  };

  if (outletId) {
    matchQuery.outlet_id = new mongoose.Types.ObjectId(outletId);
  }

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  // Summary aggregation
  const summaryAgg = await Bill.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$grand_total' },
        totalSubtotal: { $sum: '$subtotal' },
        totalDiscount: { $sum: '$discount_amount' },
        totalCgst: { $sum: '$cgst_total' },
        totalSgst: { $sum: '$sgst_total' },
        totalIgst: { $sum: '$igst_total' },
        totalCharges: { $sum: '$charges_total' },
        billCount: { $sum: 1 },
      },
    },
  ]);

  const stats = summaryAgg[0] || {
    totalRevenue: 0,
    totalSubtotal: 0,
    totalDiscount: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalCharges: 0,
    billCount: 0,
  };

  const avgBillValue = stats.billCount > 0 ? Math.round(stats.totalRevenue / stats.billCount) : 0;

  // Payments by mode
  const paymentMatch = {};
  if (outletId) paymentMatch.outlet_id = new mongoose.Types.ObjectId(outletId);
  if (startDate || endDate) {
    paymentMatch.createdAt = {};
    if (startDate) paymentMatch.createdAt.$gte = new Date(startDate);
    if (endDate) paymentMatch.createdAt.$lte = new Date(endDate);
  }

  const paymentModes = await Payment.aggregate([
    { $match: paymentMatch },
    {
      $group: {
        _id: '$mode',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Hourly distribution
  const hourlyAgg = await Bill.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        sales: { $sum: '$grand_total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id': 1 } },
  ]);

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const found = hourlyAgg.find((h) => h._id === hour);
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      sales: found ? found.sales : 0,
      orders: found ? found.orders : 0,
    };
  });

  return reply.send({
    success: true,
    data: {
      ...stats,
      totalTax: stats.totalCgst + stats.totalSgst + stats.totalIgst,
      avgBillValue,
      paymentModes: paymentModes.map((p) => ({ mode: p._id, total: p.total, count: p.count })),
      hourlyData,
    },
  });
}

export async function getItemWiseReport(request, reply) {
  const outletId = request.user?.outletId;
  const { startDate, endDate } = request.query;

  const matchQuery = {
    state: { $in: [BILL_STATUS.PAID, BILL_STATUS.SETTLED, 'PAID', 'SETTLED'] },
  };

  if (outletId) {
    matchQuery.outlet_id = new mongoose.Types.ObjectId(outletId);
  }

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const items = await Bill.aggregate([
    { $match: matchQuery },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.item_id',
        name: { $first: '$lines.name' },
        quantity: { $sum: '$lines.quantity' },
        revenue: { $sum: '$lines.total_amount' },
        taxable: { $sum: '$lines.taxable_amount' },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 100 },
  ]);

  return reply.send({
    success: true,
    data: items.map((item) => ({
      itemId: item._id,
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue,
      taxable: item.taxable,
    })),
  });
}

export async function getDayEndReport(request, reply) {
  const outletId = request.user?.outletId;
  const { date } = request.query;

  const query = {};
  if (outletId) query.outlet_id = outletId;
  if (date) query.business_date = date;

  const businessDay = await BusinessDay.findOne(query).sort({ createdAt: -1 });

  const billMatch = { outlet_id: new mongoose.Types.ObjectId(outletId || undefined) };
  if (businessDay) {
    billMatch.createdAt = { $gte: businessDay.opened_at, ...(businessDay.closed_at ? { $lte: businessDay.closed_at } : {}) };
  }

  const [salesSummary, voidBills, cashMovements] = await Promise.all([
    Bill.aggregate([
      { $match: { ...billMatch, state: { $in: ['PAID', 'SETTLED'] } } },
      {
        $group: {
          _id: null,
          grandTotal: { $sum: '$grand_total' },
          subtotal: { $sum: '$subtotal' },
          discount: { $sum: '$discount_amount' },
          tax: { $sum: { $add: ['$cgst_total', '$sgst_total'] } },
          count: { $sum: 1 },
        },
      },
    ]),
    Bill.countDocuments({ ...billMatch, state: 'VOID' }),
    CashMovement.find(businessDay ? { business_day_id: businessDay._id } : {}),
  ]);

  const pettyCashOut = cashMovements
    .filter((m) => m.type === 'PETTY_OUT')
    .reduce((acc, m) => acc + m.amount, 0);

  const cashIn = cashMovements
    .filter((m) => m.type === 'CASH_IN')
    .reduce((acc, m) => acc + m.amount, 0);

  const summary = salesSummary[0] || { grandTotal: 0, subtotal: 0, discount: 0, tax: 0, count: 0 };

  return reply.send({
    success: true,
    data: {
      businessDay,
      sales: summary,
      voidCount: voidBills,
      pettyCashOut,
      cashIn,
      netCashChange: (businessDay?.opening_float || 0) + cashIn - pettyCashOut,
    },
  });
}
