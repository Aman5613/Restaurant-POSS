import mongoose from 'mongoose';

const outletSettingSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    key: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

outletSettingSchema.index({ outletId: 1, key: 1 }, { unique: true });

export const OutletSetting = mongoose.model('OutletSetting', outletSettingSchema);
