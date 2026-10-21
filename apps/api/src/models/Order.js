import mongoose from 'mongoose';
import { ORDER_STATUS } from '@pos/shared';
import { ORDER_TYPES } from '@pos/shared';

const orderLineAddonSchema = new mongoose.Schema(
  {
    addon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AddonOption' },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // in paise
  },
  { _id: true }
);

const orderLineSchema = new mongoose.Schema(
  {
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemVariant' },
    variant_name: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 }, // in paise
    tax_rate: { type: Number, default: 5 },
    is_tax_inclusive: { type: Boolean, default: true },
    station_id: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenStation' },
    addons: [orderLineAddonSchema],
    notes: { type: String, default: '' },
    course: { type: String, enum: ['starter', 'main', 'dessert', 'beverage', 'general'], default: 'general' },
    status: { type: String, enum: ['DRAFT', 'SENT', 'CANCELLED'], default: 'DRAFT' },
    kot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'KOT' },
    cancel_reason: { type: String },
    cancelled_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelled_at: { type: Date },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    order_no: { type: String, required: true, index: true }, // e.g. D1-0042
    order_type: {
      type: String,
      enum: Object.values(ORDER_TYPES),
      default: ORDER_TYPES.DINE_IN,
    },
    table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DiningTable', index: true },
    table_session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', index: true },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.DRAFT,
      index: true,
    },
    guest_count: { type: Number, default: 1, min: 1 },
    waiter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
      name: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    lines: [orderLineSchema],
    subtotal: { type: Number, default: 0 }, // paise
    discount_amount: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    charge_amount: { type: Number, default: 0 },
    round_off: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    is_held: { type: Boolean, default: false },
    business_day_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DayEnd' },
  },
  { timestamps: true }
);

orderSchema.index({ outlet_id: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
export default Order;
