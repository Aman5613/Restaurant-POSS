import { DayOpsController } from './day-ops.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function dayOpsRoutes(fastify, _opts) {
  const controller = new DayOpsController();

  fastify.addHook('preHandler', authenticate);

  fastify.get('/current', controller.getCurrentDay.bind(controller));
  fastify.post('/open', { preHandler: [authorize({ permission: PERMISSIONS.DAY_OPEN })] }, controller.openDay.bind(controller));
  fastify.post('/close', { preHandler: [authorize({ permission: PERMISSIONS.DAY_CLOSE })] }, controller.closeDay.bind(controller));

  fastify.post('/shifts/open', { preHandler: [authorize({ permission: PERMISSIONS.SHIFT_OPEN })] }, controller.openShift.bind(controller));
  fastify.post('/shifts/:id/close', { preHandler: [authorize({ permission: PERMISSIONS.SHIFT_CLOSE })] }, controller.closeShift.bind(controller));

  fastify.post('/cash-movements', { preHandler: [authorize({ permission: PERMISSIONS.CASH_DRAWER_MANAGE })] }, controller.recordCashMovement.bind(controller));
}
