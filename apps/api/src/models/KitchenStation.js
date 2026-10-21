import mongoose from 'mongoose';

const kitchenStationSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    name: { type: String, required: true, trim: true },
    printerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Printer' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const KitchenStation = mongoose.model('KitchenStation', kitchenStationSchema);
