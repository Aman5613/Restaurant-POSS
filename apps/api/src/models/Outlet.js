import mongoose from 'mongoose';

const outletSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    legalName: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    fssaiNumber: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      stateCode: { type: String, required: true }, // Indian GST State Code (e.g. "27")
      pincode: { type: String, required: true },
    },
    logoUrl: { type: String },
    isSetupCompleted: { type: Boolean, default: false },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    operatingHours: {
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '23:00' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Outlet = mongoose.model('Outlet', outletSchema);
