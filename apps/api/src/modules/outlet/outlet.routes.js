import { OutletController } from './outlet.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function outletRoutes(fastify, _opts) {
  const controller = new OutletController();

  fastify.addHook('preHandler', authenticate);

  // Outlet profile
  fastify.get('/profile', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_VIEW })] }, controller.getOutlet.bind(controller));
  fastify.put('/profile', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_UPDATE })] }, controller.updateOutlet.bind(controller));

  // Seed standard slabs (wizard step)
  fastify.post('/seed-defaults', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_UPDATE })] }, controller.seedDefaults.bind(controller));

  // Tax Groups
  fastify.get('/tax-groups', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_VIEW })] }, controller.listTaxGroups.bind(controller));
  fastify.post('/tax-groups', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.createTaxGroup.bind(controller));
  fastify.put('/tax-groups/:id', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.updateTaxGroup.bind(controller));
  fastify.delete('/tax-groups/:id', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.deleteTaxGroup.bind(controller));

  // Charges
  fastify.get('/charges', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_VIEW })] }, controller.listCharges.bind(controller));
  fastify.post('/charges', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.createCharge.bind(controller));
  fastify.put('/charges/:id', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.updateCharge.bind(controller));
  fastify.delete('/charges/:id', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.deleteCharge.bind(controller));

  // Numbering series
  fastify.get('/numbering-series', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_VIEW })] }, controller.listNumberingSeries.bind(controller));
  fastify.put('/numbering-series/:id', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.updateNumberingSeries.bind(controller));

  // Printers
  fastify.get('/printers', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_VIEW })] }, controller.listPrinters.bind(controller));
  fastify.post('/printers', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.createPrinter.bind(controller));
  fastify.put('/printers/:id', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.updatePrinter.bind(controller));
  fastify.post('/printers/:id/test', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.testPrinter.bind(controller));

  // Devices
  fastify.get('/devices', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_VIEW })] }, controller.listDevices.bind(controller));
  fastify.post('/devices', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.registerDevice.bind(controller));

  // Payment Modes
  fastify.get('/payment-modes', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_VIEW })] }, controller.listPaymentModes.bind(controller));
  fastify.put('/payment-modes/:id', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.updatePaymentMode.bind(controller));

  // Settings
  fastify.get('/settings', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_VIEW })] }, controller.getSettings.bind(controller));
  fastify.put('/settings', { preHandler: [authorize({ permission: PERMISSIONS.OUTLET_SETTINGS_MANAGE })] }, controller.updateSetting.bind(controller));
}
