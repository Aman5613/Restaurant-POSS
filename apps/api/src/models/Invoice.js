import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    bill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true, index: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    invoice_no: { type: String, required: true, unique: true, index: true }, // e.g. INV-2026-0042
    financial_year: { type: String, required: true }, // e.g. 2026-27
    snapshot: {
      outlet: {
        name: String,
        legal_name: String,
        gstin: String,
        fssai: String,
        address: Object,
        phone: String,
      },
      customer: {
        name: String,
        phone: String,
        gstin: String,
      },
      table_name: String,
      lines: Array,
      subtotal: Number,
      discount_amount: Number,
      tax_breakup: Object,
      charges_total: Number,
      round_off: Number,
      grand_total: Number,
      payments: Array,
      cashier_name: String,
    },
    issued_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

invoiceSchema.index({ outlet_id: 1, issued_at: -1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
