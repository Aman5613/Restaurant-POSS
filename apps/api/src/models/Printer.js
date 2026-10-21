import mongoose from 'mongoose';

const printerSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    name: { type: String, required: true, trim: true },
    connectionType: {
      type: String,
      enum: ['NETWORK', 'USB', 'BLUETOOTH', 'SYSTEM_DIALOG'],
      default: 'NETWORK',
    },
    ipAddress: { type: String, trim: true },
    port: { type: Number, default: 9100 },
    paperWidth: {
      type: String,
      enum: ['58mm', '80mm'],
      default: '80mm',
    },
    isReceiptPrinter: { type: Boolean, default: false },
    isKotPrinter: { type: Boolean, default: false },
    stationIds: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Printer = mongoose.model('Printer', printerSchema);
