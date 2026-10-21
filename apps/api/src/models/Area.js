import mongoose from 'mongoose';

const areaSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

areaSchema.index({ outletId: 1, name: 1 }, { unique: true });

export const Area = mongoose.model('Area', areaSchema);
