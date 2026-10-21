import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    bill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true, index: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    mode: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'DUE', 'COMPLIMENTARY', 'WALLET'],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 }, // paise
    reference_no: { type: String },
    cash_tendered: { type: Number },
    change_returned: { type: Number, default: 0 },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    status: {
      type: String,
      enum: ['SUCCESS', 'REFUNDED'],
      default: 'SUCCESS',
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
