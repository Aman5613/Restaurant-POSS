import mongoose from 'mongoose';

const chargeConfigSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['SERVICE', 'PACKAGING', 'DELIVERY', 'CUSTOM'],
      default: 'CUSTOM',
    },
    rate: { type: Number, required: true, min: 0 },
    isPercentage: { type: Boolean, default: true },
    taxGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxGroup' },
    isInclusive: { type: Boolean, default: false },
    applicableOrderTypes: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ChargeConfig = mongoose.model('ChargeConfig', chargeConfigSchema);
