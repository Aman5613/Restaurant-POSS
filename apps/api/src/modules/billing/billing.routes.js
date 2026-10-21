import { BillingController } from './billing.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function billingRoutes(fastify, _opts) {
  const controller = new BillingController();

  fastify.addHook('preHandler', authenticate);

  fastify.post('/', { preHandler: [authorize({ permission: PERMISSIONS.BILL_GENERATE })] }, controller.generateBill.bind(controller));
  fastify.get('/:id', { preHandler: [authorize({ permission: PERMISSIONS.BILL_VIEW })] }, controller.getBill.bind(controller));
  fastify.post('/:id/discounts', { preHandler: [authorize({ permission: PERMISSIONS.BILL_DISCOUNT_APPLY })] }, controller.applyDiscount.bind(controller));
  fastify.post('/:id/settle', { preHandler: [authorize({ permission: PERMISSIONS.PAYMENT_COLLECT })] }, controller.settleBill.bind(controller));
  fastify.post('/:id/void', { preHandler: [authorize({ permission: PERMISSIONS.BILL_VOID })] }, controller.voidBill.bind(controller));
}
