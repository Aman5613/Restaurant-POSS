import { CustomersController } from './customers.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function customersRoutes(fastify, _opts) {
  const controller = new CustomersController();

  fastify.addHook('preHandler', authenticate);

  fastify.get('/', { preHandler: [authorize({ permission: PERMISSIONS.CUSTOMER_VIEW })] }, controller.list.bind(controller));
  fastify.get('/:id', { preHandler: [authorize({ permission: PERMISSIONS.CUSTOMER_VIEW })] }, controller.getById.bind(controller));
  fastify.post('/', { preHandler: [authorize({ permission: PERMISSIONS.CUSTOMER_MANAGE })] }, controller.create.bind(controller));
  fastify.post('/:id/dues/collect', { preHandler: [authorize({ permission: PERMISSIONS.CUSTOMER_DUES_COLLECT })] }, controller.collectDue.bind(controller));
}
