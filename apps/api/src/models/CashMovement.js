import mongoose from 'mongoose';

const cashMovementSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    business_day_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessDay', required: true, index: true },
    shift_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', index: true },
    type: {
      type: String,
      enum: ['CASH_IN', 'CASH_OUT', 'CASH_DROP'],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 }, // paise
    reason: { type: String, required: true },
    category: { type: String, default: 'General' },
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CashMovement = mongoose.model('CashMovement', cashMovementSchema);
export default CashMovement;
