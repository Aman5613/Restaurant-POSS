import mongoose from 'mongoose';

const paymentModeSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'WALLET', 'DUE', 'COMPLIMENTARY'],
      required: true,
    },
    isEnabled: { type: Boolean, default: true },
    opensCashDrawer: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

paymentModeSchema.index({ outletId: 1, code: 1 }, { unique: true });

export const PaymentMode = mongoose.model('PaymentMode', paymentModeSchema);
