import mongoose from 'mongoose';

const itemVariantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 }, // in paise
  isAvailable: { type: Boolean, default: true },
});

const itemSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true },
    basePrice: { type: Number, required: true, default: 0, min: 0 }, // in paise
    taxGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxGroup' },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenStation' },
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    variants: [itemVariantSchema],
    addonGroupIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddonGroup' }],
  },
  { timestamps: true }
);

itemSchema.index({ name: 'text', description: 'text' });
itemSchema.index({ outletId: 1, categoryId: 1 });

export const Item = mongoose.model('Item', itemSchema);
