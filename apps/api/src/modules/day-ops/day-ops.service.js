import {
  BusinessDay,
  Shift,
  CashMovement,
  Order,
  Bill,
  Payment,
  DiningTable,
} from '../../models/index.js';
import { DAY_STATUS, SHIFT_STATUS, TABLE_STATUS, BILL_STATUS } from '@pos/shared';

export class DayOpsService {
  async getCurrentDay({ outletId }) {
    return BusinessDay.findOne({ outlet_id: outletId, status: DAY_STATUS.OPEN })
      .populate('opened_by', 'name email');
  }

  async openDay({ outletId, openingFloat = 0, notes, openedBy }) {
    const existing = await BusinessDay.findOne({ outlet_id: outletId, status: DAY_STATUS.OPEN });
    if (existing) {
      const error = new Error('A business day is already open. Close it before opening a new day.');
      error.statusCode = 400;
      throw error;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const day = await BusinessDay.create({
      outlet_id: outletId,
      date: todayStr,
      status: DAY_STATUS.OPEN,
      opening_float: openingFloat,
      expected_cash: openingFloat,
      notes: notes || '',
      opened_by: openedBy,
    });

    return day;
  }

  async closeDay({ outletId, closingCashCounted, notes, forceClose = false, closedBy }) {
    const day = await this.getCurrentDay({ outletId });
    if (!day) {
      const error = new Error('No open business day found');
      error.statusCode = 404;
      throw error;
    }

    // Check for open tables
    if (!forceClose) {
      const activeTables = await DiningTable.find({
        outlet_id: outletId,
        status: { $in: [TABLE_STATUS.OCCUPIED, TABLE_STATUS.BILLED] },
      });

      if (activeTables.length > 0) {
        const error = new Error(
          `Cannot close business day: ${activeTables.length} table(s) are still active/occupied. Settle or cancel orders first, or use force-close.`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // Compute sales aggregations for this business day
    const payments = await Payment.find({
      outlet_id: outletId,
      createdAt: { $gte: day.opened_at },
      status: 'SUCCESS',
    });

    let cashSales = 0;
    let cardSales = 0;
    let upiSales = 0;
    let dueSales = 0;

    for (const p of payments) {
      if (p.mode === 'CASH') cashSales += p.amount;
      else if (p.mode === 'CARD') cardSales += p.amount;
      else if (p.mode === 'UPI') upiSales += p.amount;
      else if (p.mode === 'DUE') dueSales += p.amount;
    }

    // Movements
    const movements = await CashMovement.find({
      outlet_id: outletId,
      business_day_id: day._id,
    });

    let cashIn = 0;
    let cashOut = 0;
    let cashDrop = 0;

    for (const m of movements) {
      if (m.type === 'CASH_IN') cashIn += m.amount;
      else if (m.type === 'CASH_OUT') cashOut += m.amount;
      else if (m.type === 'CASH_DROP') cashDrop += m.amount;
    }

    const expectedCash = day.opening_float + cashSales + cashIn - cashOut - cashDrop;
    const variance = closingCashCounted - expectedCash;

    day.status = DAY_STATUS.CLOSED;
    day.closed_at = new Date();
    day.closed_by = closedBy;
    day.cash_sales = cashSales;
    day.card_sales = cardSales;
    day.upi_sales = upiSales;
    day.due_sales = dueSales;
    day.total_sales = cashSales + cardSales + upiSales + dueSales;
    day.cash_in = cashIn;
    day.cash_out = cashOut;
    day.cash_drop = cashDrop;
    day.expected_cash = expectedCash;
    day.closing_cash_counted = closingCashCounted;
    day.variance = variance;
    day.notes = notes || day.notes;

    await day.save();

    // Close any open shifts for this day
    await Shift.updateMany(
      { business_day_id: day._id, status: SHIFT_STATUS.OPEN },
      { status: SHIFT_STATUS.CLOSED, closed_at: new Date() }
    );

    return day;
  }

  async openShift({ outletId, openingCash = 0, deviceId, userId }) {
    const day = await this.getCurrentDay({ outletId });
    if (!day) {
      const error = new Error('Cannot open shift: No active business day. Open the day first.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await Shift.findOne({
      outlet_id: outletId,
      business_day_id: day._id,
      user_id: userId,
      status: SHIFT_STATUS.OPEN,
    });

    if (existing) {
      return existing;
    }

    return Shift.create({
      outlet_id: outletId,
      business_day_id: day._id,
      user_id: userId,
      device_id: deviceId,
      opening_cash: openingCash,
      expected_cash: openingCash,
      status: SHIFT_STATUS.OPEN,
    });
  }

  async closeShift({ outletId, shiftId, closingCash, notes, userId }) {
    const shift = await Shift.findOne({ _id: shiftId, outlet_id: outletId });
    if (!shift) {
      const error = new Error('Shift not found');
      error.statusCode = 404;
      throw error;
    }

    const payments = await Payment.find({
      outlet_id: outletId,
      created_by: shift.user_id,
      createdAt: { $gte: shift.opened_at },
      status: 'SUCCESS',
      mode: 'CASH',
    });

    const cashSales = payments.reduce((sum, p) => sum + p.amount, 0);
    const expectedCash = shift.opening_cash + cashSales;
    const variance = closingCash - expectedCash;

    shift.status = SHIFT_STATUS.CLOSED;
    shift.closed_at = new Date();
    shift.cash_sales = cashSales;
    shift.expected_cash = expectedCash;
    shift.closing_cash_counted = closingCash;
    shift.variance = variance;
    shift.notes = notes || '';

    await shift.save();
    return shift;
  }

  async recordCashMovement({ outletId, type, amount, reason, category, performedBy }) {
    const day = await this.getCurrentDay({ outletId });
    if (!day) {
      const error = new Error('No active business day found');
      error.statusCode = 400;
      throw error;
    }

    const movement = await CashMovement.create({
      outlet_id: outletId,
      business_day_id: day._id,
      type,
      amount,
      reason,
      category: category || 'General',
      performed_by: performedBy,
    });

    // Update day running expected cash
    if (type === 'CASH_IN') day.cash_in += amount;
    else if (type === 'CASH_OUT') day.cash_out += amount;
    else if (type === 'CASH_DROP') day.cash_drop += amount;

    await day.save();
    return movement;
  }
}
