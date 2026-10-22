import mongoose from 'mongoose';
import { AuditLog } from '../../models/index.js';

export async function getAuditLogs(request, reply) {
  const isSuperAdmin = request.user?.role === 'super-admin';
  const { event, userId, limit = 50, page = 1, scope } = request.query;

  const isPlatformScope = isSuperAdmin || scope === 'platform';

  const query = {};
  if (!isSuperAdmin && request.user?.outletId) {
    if (mongoose.Types.ObjectId.isValid(request.user.outletId)) {
      query.outletId = request.user.outletId;
    }
  } else if (request.query.outletId && mongoose.Types.ObjectId.isValid(request.query.outletId)) {
    query.outletId = request.query.outletId;
  }

  if (event) query.event = event;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) query.userId = userId;

  let logs = [];
  let total = 0;

  if (mongoose.connection.readyState === 1) {
    try {
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10))
          .populate('userId', 'name role phone')
          .lean(),
        AuditLog.countDocuments(query),
      ]);
    } catch (_dbErr) {
      logs = [];
      total = 0;
    }
  }

  return reply.send({
    success: true,
    data: logs || [],
    scope: isPlatformScope ? 'platform' : 'outlet',
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10)) || 1,
    },
  });
}

export async function createAuditLogEntry(request, reply) {
  const outletId = request.user?.outletId;
  const tenantId = request.user?.tenantId;
  const userId = request.user?.id;
  const { event, resource, resourceId, metadata } = request.body;

  let log = null;
  if (mongoose.connection.readyState === 1) {
    try {
      log = await AuditLog.create({
        event,
        userId: mongoose.Types.ObjectId.isValid(userId) ? userId : undefined,
        outletId: mongoose.Types.ObjectId.isValid(outletId) ? outletId : undefined,
        tenantId: mongoose.Types.ObjectId.isValid(tenantId) ? tenantId : undefined,
        resource,
        resourceId,
        metadata,
        ipAddress: request.ip,
      });
    } catch (_err) {
      // ignore
    }
  }

  if (!log) {
    log = {
      _id: `aud_${Date.now()}`,
      event,
      resource,
      resourceId,
      metadata,
      createdAt: new Date().toISOString(),
    };
  }

  return reply.status(201).send({
    success: true,
    data: log,
  });
}
