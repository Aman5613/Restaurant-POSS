import { SuperAdminController } from './super-admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '@pos/shared';

export async function superAdminRoutes(fastify, _opts) {
  const controller = new SuperAdminController();

  fastify.addHook('preHandler', authenticate);
  // Restrict all super-admin endpoints strictly to SUPER_ADMIN role
  fastify.addHook('preHandler', authorize({ roles: [ROLES.SUPER_ADMIN] }));

  fastify.get('/stats', controller.getStats.bind(controller));
  fastify.get('/owners', controller.listOwners.bind(controller));
  fastify.post('/owners', controller.createOwner.bind(controller));
  fastify.patch('/owners/:id/status', controller.toggleStatus.bind(controller));
}
