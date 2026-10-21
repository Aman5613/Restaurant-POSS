import mongoose from 'mongoose';
import { KOT_STATUS } from '@pos/shared';

const kotLineSchema = new mongoose.Schema(
  {
    line_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    variant_name: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    addons: [
      {
        name: { type: String, required: true },
        price: { type: Number, default: 0 },
      },
    ],
    notes: { type: String, default: '' },
    course: { type: String, default: 'general' },
  },
  { _id: true }
);

const kotSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    order_no: { type: String, required: true },
    kot_no: { type: String, required: true }, // e.g. KOT-001
    table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DiningTable' },
    table_name: { type: String },
    station_id: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenStation', required: true, index: true },
    station_name: { type: String },
    type: {
      type: String,
      enum: ['REGULAR', 'CANCEL', 'MODIFY'],
      default: 'REGULAR',
    },
    status: {
      type: String,
      enum: Object.values(KOT_STATUS),
      default: KOT_STATUS.PENDING,
      index: true,
    },
    lines: [kotLineSchema],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    printed_at: { type: Date },
  },
  { timestamps: true }
);

kotSchema.index({ outlet_id: 1, createdAt: -1 });

export const KOT = mongoose.model('KOT', kotSchema);
export default KOT;
