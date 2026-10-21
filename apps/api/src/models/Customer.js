import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    name: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    email: { type: String },
    gstin: { type: String },
    address: { type: String },
    notes: { type: String },
    stats: {
      total_orders: { type: Number, default: 0 },
      total_spend: { type: Number, default: 0 }, // paise
      current_due: { type: Number, default: 0 }, // paise
      last_visit_at: { type: Date },
    },
  },
  { timestamps: true }
);

customerSchema.index({ outlet_id: 1, phone: 1 }, { unique: true });

export const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
