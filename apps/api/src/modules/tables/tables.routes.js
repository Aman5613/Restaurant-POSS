import { TablesController } from './tables.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function tablesRoutes(fastify, _opts) {
  const controller = new TablesController();

  fastify.addHook('preHandler', authenticate);

  // Seed demo floor
  fastify.post('/seed-demo', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_MANAGE })] }, controller.seedDemo.bind(controller));

  // Areas
  fastify.get('/areas', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_VIEW })] }, controller.listAreas.bind(controller));
  fastify.post('/areas', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_MANAGE })] }, controller.createArea.bind(controller));
  fastify.put('/areas/:id', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_MANAGE })] }, controller.updateArea.bind(controller));
  fastify.delete('/areas/:id', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_MANAGE })] }, controller.deleteArea.bind(controller));

  // Tables
  fastify.get('/', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_VIEW })] }, controller.listTables.bind(controller));
  fastify.get('/:id', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_VIEW })] }, controller.getTable.bind(controller));
  fastify.post('/', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_MANAGE })] }, controller.createTable.bind(controller));
  fastify.put('/:id', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_MANAGE })] }, controller.updateTable.bind(controller));
  fastify.delete('/:id', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_MANAGE })] }, controller.deleteTable.bind(controller));

  // Actions
  fastify.post('/:id/status', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_VIEW })] }, controller.updateStatus.bind(controller));
  fastify.post('/transfer', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_TRANSFER })] }, controller.transferTable.bind(controller));
  fastify.post('/merge', { preHandler: [authorize({ permission: PERMISSIONS.TABLE_MERGE })] }, controller.mergeTables.bind(controller));
}
