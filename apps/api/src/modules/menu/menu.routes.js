import { MenuController } from './menu.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function menuRoutes(fastify, _opts) {
  const controller = new MenuController();

  fastify.addHook('preHandler', authenticate);

  // Snapshot (accessible to all authenticated roles for offline cache)
  fastify.get('/snapshot', { preHandler: [authorize({ permission: PERMISSIONS.MENU_VIEW })] }, controller.getSnapshot.bind(controller));
  fastify.post('/seed-demo', { preHandler: [authorize({ permission: PERMISSIONS.MENU_CREATE })] }, controller.seedDemo.bind(controller));

  // Categories
  fastify.get('/categories', { preHandler: [authorize({ permission: PERMISSIONS.MENU_VIEW })] }, controller.listCategories.bind(controller));
  fastify.post('/categories', { preHandler: [authorize({ permission: PERMISSIONS.MENU_CREATE })] }, controller.createCategory.bind(controller));
  fastify.put('/categories/:id', { preHandler: [authorize({ permission: PERMISSIONS.MENU_UPDATE })] }, controller.updateCategory.bind(controller));
  fastify.delete('/categories/:id', { preHandler: [authorize({ permission: PERMISSIONS.MENU_DELETE })] }, controller.deleteCategory.bind(controller));

  // Kitchen Stations
  fastify.get('/stations', { preHandler: [authorize({ permission: PERMISSIONS.MENU_VIEW })] }, controller.listStations.bind(controller));
  fastify.post('/stations', { preHandler: [authorize({ permission: PERMISSIONS.MENU_CREATE })] }, controller.createStation.bind(controller));
  fastify.put('/stations/:id', { preHandler: [authorize({ permission: PERMISSIONS.MENU_UPDATE })] }, controller.updateStation.bind(controller));

  // Addon Groups
  fastify.get('/addon-groups', { preHandler: [authorize({ permission: PERMISSIONS.MENU_VIEW })] }, controller.listAddonGroups.bind(controller));
  fastify.post('/addon-groups', { preHandler: [authorize({ permission: PERMISSIONS.MENU_CREATE })] }, controller.createAddonGroup.bind(controller));
  fastify.put('/addon-groups/:id', { preHandler: [authorize({ permission: PERMISSIONS.MENU_UPDATE })] }, controller.updateAddonGroup.bind(controller));
  fastify.delete('/addon-groups/:id', { preHandler: [authorize({ permission: PERMISSIONS.MENU_DELETE })] }, controller.deleteAddonGroup.bind(controller));

  // Items
  fastify.get('/items', { preHandler: [authorize({ permission: PERMISSIONS.MENU_VIEW })] }, controller.listItems.bind(controller));
  fastify.get('/items/:id', { preHandler: [authorize({ permission: PERMISSIONS.MENU_VIEW })] }, controller.getItem.bind(controller));
  fastify.post('/items', { preHandler: [authorize({ permission: PERMISSIONS.MENU_CREATE })] }, controller.createItem.bind(controller));
  fastify.put('/items/:id', { preHandler: [authorize({ permission: PERMISSIONS.MENU_UPDATE })] }, controller.updateItem.bind(controller));
  fastify.patch('/items/:id/availability', { preHandler: [authorize({ permission: PERMISSIONS.MENU_TOGGLE_AVAILABILITY })] }, controller.setAvailability.bind(controller));
  fastify.delete('/items/:id', { preHandler: [authorize({ permission: PERMISSIONS.MENU_DELETE })] }, controller.deleteItem.bind(controller));
}
