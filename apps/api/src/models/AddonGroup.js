import mongoose from 'mongoose';

const addonOptionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 }, // in paise
  isAvailable: { type: Boolean, default: true },
});

const addonGroupSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    name: { type: String, required: true, trim: true },
    minSelect: { type: Number, default: 0 },
    maxSelect: { type: Number, default: 5 },
    options: [addonOptionSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AddonGroup = mongoose.model('AddonGroup', addonGroupSchema);
