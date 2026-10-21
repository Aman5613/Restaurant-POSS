import { getAuditLogs, createAuditLogEntry } from './audit.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export async function auditRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', getAuditLogs);
  fastify.post('/', createAuditLogEntry);
}
