import {
  Bill,
  Payment,
  CreditNote,
  CustomerDue,
  Invoice,
  Order,
  DiningTable,
  TableSession,
  NumberingSeries,
  Outlet,
} from '../../models/index.js';
import { computeBill, BILL_STATUS, ORDER_STATUS, TABLE_STATUS } from '@pos/shared';

export class BillingService {
  async generateOrRefreshBill({ outletId, orderId, discount, charges = [], isInterState = false, createdBy }) {
    const order = await Order.findOne({ _id: orderId, outlet_id: outletId }).populate('table_id');
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    if (order.status === ORDER_STATUS.SETTLED || order.status === ORDER_STATUS.CANCELLED) {
      const error = new Error(`Cannot bill order with status ${order.status}`);
      error.statusCode = 400;
      throw error;
    }

    const activeLines = order.lines.filter((l) => l.status !== 'CANCELLED');
    if (activeLines.length === 0) {
      const error = new Error('Cannot bill an order with no active items');
      error.statusCode = 400;
      throw error;
    }

    // Format lines for shared billing engine
    const engineLines = activeLines.map((l) => ({
      itemId: l.item_id.toString(),
      name: l.name,
      quantity: l.quantity,
      unitPrice: l.unit_price,
      taxRate: l.tax_rate ?? 5,
      isTaxInclusive: l.is_tax_inclusive ?? true,
      addons: (l.addons || []).map((a) => ({ name: a.name, price: a.price })),
    }));

    const computed = computeBill({
      lines: engineLines,
      discount,
      charges,
      isInterState,
    });

    let bill = await Bill.findOne({
      order_id: order._id,
      outlet_id: outletId,
      state: { $in: [BILL_STATUS.UNPAID, BILL_STATUS.PARTIALLY_PAID] },
    });

    if (!bill) {
      const series = await NumberingSeries.findOneAndUpdate(
        { outlet_id: outletId, type: 'BILL', active: true },
        { $inc: { current_number: 1 } },
        { new: true }
      );
      const billNo = series
        ? `${series.prefix || 'BIL-'}${series.current_number.toString().padStart(4, '0')}`
        : `BIL-${Date.now().toString().slice(-4)}`;

      bill = new Bill({
        outlet_id: outletId,
        order_id: order._id,
        order_no: order.order_no,
        bill_no: billNo,
        created_by: createdBy,
      });
    }

    bill.lines = computed.lines.map((l, idx) => ({
      line_id: activeLines[idx]._id,
      item_id: activeLines[idx].item_id,
      name: l.name,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      gross_amount: l.grossAmount,
      discount_amount: l.lineDiscountAmount,
      taxable_amount: l.taxableAmount,
      tax_rate: l.taxRate,
      cgst_amount: l.cgstAmount,
      sgst_amount: l.sgstAmount,
      igst_amount: l.igstAmount,
      total_amount: l.totalAmount,
    }));

    bill.subtotal = computed.subtotal;
    bill.discount_amount = computed.discountTotal;
    bill.discount_details = discount || null;
    bill.cgst_total = computed.cgstTotal;
    bill.sgst_total = computed.sgstTotal;
    bill.igst_total = computed.igstTotal;
    bill.charges_total = computed.chargesTotal;
    bill.round_off = computed.roundOff;
    bill.grand_total = computed.grandTotal;
    bill.balance_amount = computed.grandTotal - (bill.paid_amount || 0);

    await bill.save();

    // Transition Order & Table to BILLED
    order.status = ORDER_STATUS.BILLED;
    await order.save();

    if (order.table_id) {
      await DiningTable.findByIdAndUpdate(order.table_id._id, { status: TABLE_STATUS.BILLED });
    }

    return bill;
  }

  async getBillById({ outletId, billId }) {
    const bill = await Bill.findOne({ _id: billId, outlet_id: outletId })
      .populate('order_id')
      .populate('created_by', 'name email');

    if (!bill) {
      const error = new Error('Bill not found');
      error.statusCode = 404;
      throw error;
    }
    return bill;
  }

  async applyDiscount({ outletId, billId, discount, appliedBy }) {
    const bill = await this.getBillById({ outletId, billId });
    return this.generateOrRefreshBill({
      outletId,
      orderId: bill.order_id._id,
      discount,
      createdBy: appliedBy,
    });
  }

  async addPaymentsAndSettle({ outletId, billId, payments, settledBy }) {
    const bill = await this.getBillById({ outletId, billId });

    if (bill.state === BILL_STATUS.PAID) {
      const error = new Error('Bill is already settled and paid');
      error.statusCode = 400;
      throw error;
    }

    if (bill.state === BILL_STATUS.VOIDED) {
      const error = new Error('Cannot settle a voided bill');
      error.statusCode = 400;
      throw error;
    }

    const totalPaidInRequest = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidOverall = (bill.paid_amount || 0) + totalPaidInRequest;

    if (totalPaidOverall < bill.grand_total) {
      const error = new Error(
        `Insufficient payment amount. Total required: ${bill.grand_total} paise, Provided: ${totalPaidOverall} paise`
      );
      error.statusCode = 400;
      throw error;
    }

    // Save each payment record
    const savedPayments = [];
    for (const p of payments) {
      const payRecord = await Payment.create({
        outlet_id: outletId,
        bill_id: bill._id,
        order_id: bill.order_id._id,
        mode: p.mode,
        amount: p.amount,
        reference_no: p.referenceNo,
        cash_tendered: p.cashTendered,
        change_returned: p.changeReturned || 0,
        customer_id: p.customerId,
        status: 'SUCCESS',
        created_by: settledBy,
      });
      savedPayments.push(payRecord);

      // Record customer due if payment mode is DUE
      if (p.mode === 'DUE' && bill.order_id?.customer?.phone) {
        await CustomerDue.create({
          outlet_id: outletId,
          customer_name: bill.order_id.customer.name || 'Guest',
          customer_phone: bill.order_id.customer.phone,
          bill_id: bill._id,
          amount: p.amount,
          status: 'PENDING',
        });
      }
    }

    // Generate Invoice Number
    const invSeries = await NumberingSeries.findOneAndUpdate(
      { outlet_id: outletId, type: 'INVOICE', active: true },
      { $inc: { current_number: 1 } },
      { new: true }
    );
    const invoiceNo = invSeries
      ? `${invSeries.prefix || 'INV-'}${invSeries.current_number.toString().padStart(4, '0')}`
      : `INV-${Date.now().toString().slice(-4)}`;

    const outlet = await Outlet.findById(outletId);

    // Create immutable audit invoice
    const invoice = await Invoice.create({
      outlet_id: outletId,
      bill_id: bill._id,
      order_id: bill.order_id._id,
      invoice_no: invoiceNo,
      financial_year: '2026-27',
      snapshot: {
        outlet: {
          name: outlet?.name || 'Restaurant',
          legal_name: outlet?.legalName || 'Restaurant Pvt Ltd',
          gstin: outlet?.gstin || '27AAPFU0939F1ZV',
          fssai: outlet?.fssaiNumber || '',
          address: outlet?.address || {},
          phone: outlet?.phone || '',
        },
        customer: bill.order_id?.customer || {},
        table_name: bill.order_id?.table_id?.name || 'Counter',
        lines: bill.lines,
        subtotal: bill.subtotal,
        discount_amount: bill.discount_amount,
        tax_breakup: {
          cgst: bill.cgst_total,
          sgst: bill.sgst_total,
          igst: bill.igst_total,
        },
        charges_total: bill.charges_total,
        round_off: bill.round_off,
        grand_total: bill.grand_total,
        payments: savedPayments.map((p) => ({ mode: p.mode, amount: p.amount })),
      },
    });

    // Update Bill
    bill.state = BILL_STATUS.PAID;
    bill.invoice_no = invoiceNo;
    bill.paid_amount = totalPaidOverall;
    bill.balance_amount = 0;
    bill.settled_by = settledBy;
    bill.settled_at = new Date();
    await bill.save();

    // Update Order & Table
    const order = await Order.findById(bill.order_id._id);
    if (order) {
      order.status = ORDER_STATUS.SETTLED;
      await order.save();

      if (order.table_id) {
        await DiningTable.findByIdAndUpdate(order.table_id, { status: TABLE_STATUS.VACANT });
        if (order.table_session_id) {
          await TableSession.findByIdAndUpdate(order.table_session_id, {
            state: 'closed',
            closed_at: new Date(),
          });
        }
      }
    }

    return { bill, invoice, payments: savedPayments };
  }

  async voidBill({ outletId, billId, reason, voidedBy }) {
    const bill = await this.getBillById({ outletId, billId });

    if (bill.state === BILL_STATUS.VOIDED) {
      return { bill };
    }

    let creditNote = null;
    if (bill.state === BILL_STATUS.PAID && bill.invoice_no) {
      const cnSeries = await NumberingSeries.findOneAndUpdate(
        { outlet_id: outletId, type: 'CREDIT_NOTE', active: true },
        { $inc: { current_number: 1 } },
        { new: true }
      );
      const cnNo = cnSeries
        ? `${cnSeries.prefix || 'CN-'}${cnSeries.current_number.toString().padStart(4, '0')}`
        : `CN-${Date.now().toString().slice(-4)}`;

      creditNote = await CreditNote.create({
        outlet_id: outletId,
        bill_id: bill._id,
        credit_note_no: cnNo,
        original_invoice_no: bill.invoice_no,
        amount: bill.grand_total,
        reason,
        approved_by: voidedBy,
      });
    }

    bill.state = BILL_STATUS.VOIDED;
    bill.void_reason = reason;
    bill.voided_by = voidedBy;
    bill.voided_at = new Date();
    await bill.save();

    return { bill, creditNote };
  }
}
