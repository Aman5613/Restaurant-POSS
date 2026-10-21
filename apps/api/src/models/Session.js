import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
    deviceId: { type: String, trim: true },
    refreshTokenHash: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: '7d' } },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
