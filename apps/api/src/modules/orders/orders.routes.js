import { OrdersController } from './orders.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function ordersRoutes(fastify, _opts) {
  const controller = new OrdersController();

  fastify.addHook('preHandler', authenticate);

  fastify.post('/', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_CREATE })] }, controller.create.bind(controller));
  fastify.get('/', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_VIEW })] }, controller.list.bind(controller));
  fastify.get('/:id', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_VIEW })] }, controller.getById.bind(controller));
  fastify.post('/:id/lines', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_UPDATE })] }, controller.addLines.bind(controller));
  fastify.patch('/:id/lines/:lineId', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_UPDATE })] }, controller.updateLine.bind(controller));
  fastify.post('/:id/lines/:lineId/cancel', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_CANCEL_AFTER_KOT })] }, controller.cancelLine.bind(controller));
  fastify.post('/:id/send', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_CREATE })] }, controller.sendToKitchen.bind(controller));
  fastify.post('/:id/hold', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_UPDATE })] }, controller.hold.bind(controller));
  fastify.post('/:id/resume', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_UPDATE })] }, controller.resume.bind(controller));
  fastify.post('/:id/cancel', { preHandler: [authorize({ permission: PERMISSIONS.ORDER_CANCEL_BEFORE_KOT })] }, controller.cancel.bind(controller));
}
