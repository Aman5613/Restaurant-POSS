import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Tenant = mongoose.model('Tenant', tenantSchema);
