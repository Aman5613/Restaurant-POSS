import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    outletId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    tenantId: { type: mongoose.Schema.Types.Mixed },
    userId: { type: mongoose.Schema.Types.Mixed },
    role: { type: String, required: true, index: true },
    deviceName: { type: String, default: 'Web Browser' },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ outletId: 1, role: 1 });

export const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
