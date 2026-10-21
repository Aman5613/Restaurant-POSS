import { AuditLog } from '../../models/index.js';

export async function getAuditLogs(request, reply) {
  const outletId = request.user?.outletId;
  const { event, userId, limit = 50, page = 1 } = request.query;

  const query = {};
  if (outletId) query.outletId = outletId;
  if (event) query.event = event;
  if (userId) query.userId = userId;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('userId', 'name role')
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return reply.send({
    success: true,
    data: logs,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
}

export async function createAuditLogEntry(request, reply) {
  const outletId = request.user?.outletId;
  const tenantId = request.user?.tenantId;
  const userId = request.user?.id;
  const { event, resource, resourceId, metadata } = request.body;

  const log = await AuditLog.create({
    event,
    userId,
    outletId,
    tenantId,
    resource,
    resourceId,
    metadata,
    ipAddress: request.ip,
  });

  return reply.status(201).send({
    success: true,
    data: log,
  });
}
