import mongoose from 'mongoose';
import { BILL_STATUS } from '@pos/shared';

const billLineSchema = new mongoose.Schema(
  {
    line_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true }, // paise
    gross_amount: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    taxable_amount: { type: Number, required: true },
    tax_rate: { type: Number, default: 5 },
    cgst_amount: { type: Number, default: 0 },
    sgst_amount: { type: Number, default: 0 },
    igst_amount: { type: Number, default: 0 },
    total_amount: { type: Number, required: true },
  },
  { _id: true }
);

const billSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    order_no: { type: String, required: true },
    bill_no: { type: String, required: true, index: true }, // e.g. BIL-0001
    invoice_no: { type: String, sparse: true, index: true }, // e.g. INV-2026-0042
    state: {
      type: String,
      enum: Object.values(BILL_STATUS),
      default: BILL_STATUS.UNPAID,
      index: true,
    },
    lines: [billLineSchema],
    subtotal: { type: Number, required: true }, // paise
    discount_amount: { type: Number, default: 0 },
    discount_details: {
      type: { type: String, enum: ['PERCENT', 'FLAT'] },
      value: { type: Number },
      reason: { type: String },
    },
    cgst_total: { type: Number, default: 0 },
    sgst_total: { type: Number, default: 0 },
    igst_total: { type: Number, default: 0 },
    charges_total: { type: Number, default: 0 },
    round_off: { type: Number, default: 0 },
    grand_total: { type: Number, required: true }, // in paise
    paid_amount: { type: Number, default: 0 },
    balance_amount: { type: Number, default: 0 },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    settled_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    settled_at: { type: Date },
    voided_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voided_at: { type: Date },
    void_reason: { type: String },
  },
  { timestamps: true }
);

billSchema.index({ outlet_id: 1, createdAt: -1 });

export const Bill = mongoose.model('Bill', billSchema);
export default Bill;
