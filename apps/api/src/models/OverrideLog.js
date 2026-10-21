import mongoose from 'mongoose';

const overrideLogSchema = new mongoose.Schema(
  {
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true },
    action: { type: String, required: true },
    reason: { type: String, required: true },
    referenceId: { type: String },
    tokenHash: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const OverrideLog = mongoose.model('OverrideLog', overrideLogSchema);
