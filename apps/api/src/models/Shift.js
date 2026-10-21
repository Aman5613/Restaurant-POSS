import mongoose from 'mongoose';
import { SHIFT_STATUS } from '@pos/shared';

const shiftSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    business_day_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessDay', required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    device_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    status: {
      type: String,
      enum: Object.values(SHIFT_STATUS),
      default: SHIFT_STATUS.OPEN,
      index: true,
    },
    opened_at: { type: Date, default: Date.now },
    closed_at: { type: Date },
    opening_cash: { type: Number, default: 0 }, // paise
    cash_sales: { type: Number, default: 0 },
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

export const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;
