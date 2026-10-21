import mongoose from 'mongoose';

const tableSessionSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiningTable', required: true, index: true },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    guestCount: { type: Number, default: 1 },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export const TableSession = mongoose.model('TableSession', tableSessionSchema);
