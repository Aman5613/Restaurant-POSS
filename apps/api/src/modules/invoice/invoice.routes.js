import { InvoiceController } from './invoice.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function invoiceRoutes(fastify, _opts) {
  const controller = new InvoiceController();

  fastify.addHook('preHandler', authenticate);

  fastify.get('/', { preHandler: [authorize({ permission: PERMISSIONS.BILL_VIEW })] }, controller.list.bind(controller));
  fastify.get('/:id', { preHandler: [authorize({ permission: PERMISSIONS.BILL_VIEW })] }, controller.getById.bind(controller));
}
