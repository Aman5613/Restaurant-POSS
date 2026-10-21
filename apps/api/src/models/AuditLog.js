import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    resource: { type: String },
    resourceId: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
