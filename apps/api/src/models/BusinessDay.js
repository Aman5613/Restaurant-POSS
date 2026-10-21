import mongoose from 'mongoose';
import { DAY_STATUS } from '@pos/shared';

const businessDaySchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    status: {
      type: String,
      enum: Object.values(DAY_STATUS),
      default: DAY_STATUS.OPEN,
      index: true,
    },
    opened_at: { type: Date, default: Date.now },
    closed_at: { type: Date },
    opened_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    closed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    opening_float: { type: Number, default: 0 }, // paise
    cash_sales: { type: Number, default: 0 },
    card_sales: { type: Number, default: 0 },
    upi_sales: { type: Number, default: 0 },
    due_sales: { type: Number, default: 0 },
    total_sales: { type: Number, default: 0 },
    cash_in: { type: Number, default: 0 },
    cash_out: { type: Number, default: 0 },
    cash_drop: { type: Number, default: 0 },
    expected_cash: { type: Number, default: 0 },
    closing_cash_counted: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

businessDaySchema.index({ outlet_id: 1, date: -1 });

export const BusinessDay = mongoose.model('BusinessDay', businessDaySchema);
export default BusinessDay;
