import mongoose from 'mongoose';

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true },
    responseStatus: { type: Number, required: true },
    responseBody: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '24h' } },
  },
  { timestamps: true }
);

export const IdempotencyKey = mongoose.model('IdempotencyKey', idempotencyKeySchema);
