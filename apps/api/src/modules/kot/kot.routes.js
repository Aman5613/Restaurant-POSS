import { KotController } from './kot.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function kotRoutes(fastify, _opts) {
  const controller = new KotController();

  fastify.addHook('preHandler', authenticate);

  fastify.get('/', { preHandler: [authorize({ permission: PERMISSIONS.KOT_VIEW })] }, controller.list.bind(controller));
  fastify.get('/:id', { preHandler: [authorize({ permission: PERMISSIONS.KOT_VIEW })] }, controller.getById.bind(controller));
  fastify.post('/:id/reprint', { preHandler: [authorize({ permission: PERMISSIONS.KOT_REPRINT })] }, controller.reprint.bind(controller));
  fastify.get('/print-jobs', { preHandler: [authorize({ permission: PERMISSIONS.KOT_VIEW })] }, controller.listPrintJobs.bind(controller));
  fastify.post('/print-jobs/:id/retry', { preHandler: [authorize({ permission: PERMISSIONS.KOT_PRINT })] }, controller.retryPrintJob.bind(controller));
  fastify.post('/:id/acknowledge', { preHandler: [authorize({ permission: PERMISSIONS.KOT_ACKNOWLEDGE })] }, controller.acknowledge.bind(controller));
  fastify.post('/:id/ready', { preHandler: [authorize({ permission: PERMISSIONS.KOT_READY })] }, controller.markReady.bind(controller));
}
