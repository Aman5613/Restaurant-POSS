import mongoose from 'mongoose';

const taxGroupSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0, max: 100 },
    isInclusive: { type: Boolean, default: true },
    cgstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

taxGroupSchema.index({ outletId: 1, name: 1 }, { unique: true });

export const TaxGroup = mongoose.model('TaxGroup', taxGroupSchema);
