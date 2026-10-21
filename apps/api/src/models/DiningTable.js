import mongoose from 'mongoose';
import { TABLE_STATUS } from '@pos/shared';

const diningTableSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true, index: true },
    tableNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 4, min: 1 },
    status: {
      type: String,
      enum: Object.values(TABLE_STATUS),
      default: TABLE_STATUS.VACANT,
      index: true,
    },
    currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    currentGuestCount: { type: Number, default: 0 },
    openedAt: { type: Date },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

diningTableSchema.index({ outletId: 1, tableNumber: 1 }, { unique: true });

export const DiningTable = mongoose.model('DiningTable', diningTableSchema);
