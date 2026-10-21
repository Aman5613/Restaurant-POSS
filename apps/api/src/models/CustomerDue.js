import mongoose from 'mongoose';

const customerDueSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customer_name: { type: String, required: true },
    customer_phone: { type: String, required: true },
    bill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    invoice_no: { type: String },
    amount: { type: Number, required: true }, // paise
    paid_amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_SETTLED', 'SETTLED'],
      default: 'PENDING',
      index: true,
    },
    due_date: { type: Date },
  },
  { timestamps: true }
);

export const CustomerDue = mongoose.model('CustomerDue', customerDueSchema);
export default CustomerDue;
