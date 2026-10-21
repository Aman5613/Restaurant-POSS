import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    deviceCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    deviceType: {
      type: String,
      enum: ['COUNTER_POS', 'CAPTAIN_HANDHELD', 'KITCHEN_DISPLAY'],
      default: 'COUNTER_POS',
    },
    lastSeenAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

deviceSchema.index({ outletId: 1, deviceCode: 1 }, { unique: true });

export const Device = mongoose.model('Device', deviceSchema);
