import mongoose from 'mongoose';
import { Outlet } from '../../models/index.js';
import { OutletService } from './outlet.service.js';
import {
  updateOutletSchema,
  taxGroupSchema,
  chargeConfigSchema,
  numberingSeriesSchema,
  printerSchema,
  deviceSchema,
  paymentModeSchema,
} from '@pos/shared';

export class OutletController {
  constructor() {
    this.outletService = new OutletService();
  }

  async _getOutletId(request) {
    const raw = request.user?.outletId || request.user?.outlet_id || request.headers['x-outlet-id'];
    if (raw && raw !== 'default-outlet' && mongoose.Types.ObjectId.isValid(raw)) {
      return raw;
    }
    if (mongoose.connection?.readyState === 1) {
      try {
        const defaultOutlet = await Outlet.findOne();
        if (defaultOutlet) return defaultOutlet._id.toString();
      } catch (_e) {
        // fallback
      }
    }
    return raw;
  }

  async getOutlet(request, reply) {
    const outletId = await this._getOutletId(request);
    const outlet = await this.outletService.getOutlet(outletId);
    return reply.send({ code: 'OK', outlet });
  }

  async updateOutlet(request, reply) {
    if (request.body?.address && !request.body.address.stateCode) {
      request.body.address.stateCode = '27';
    }
    const validated = updateOutletSchema.parse(request.body);
    const outletId = await this._getOutletId(request);
    const outlet = await this.outletService.updateOutlet(outletId, validated);
    return reply.send({ code: 'OUTLET_UPDATED', outlet });
  }

  // Tax Groups
  async listTaxGroups(request, reply) {
    const outletId = await this._getOutletId(request);
    const taxes = await this.outletService.listTaxGroups(outletId);
    return reply.send({ code: 'OK', taxes });
  }

  async createTaxGroup(request, reply) {
    const validated = taxGroupSchema.parse(request.body);
    const outletId = await this._getOutletId(request);
    const tax = await this.outletService.createTaxGroup(outletId, validated);
    return reply.status(201).send({ code: 'TAX_GROUP_CREATED', tax });
  }

  async updateTaxGroup(request, reply) {
    const validated = taxGroupSchema.partial().parse(request.body);
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    const tax = await this.outletService.updateTaxGroup(outletId, id, validated);
    return reply.send({ code: 'TAX_GROUP_UPDATED', tax });
  }

  async deleteTaxGroup(request, reply) {
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    await this.outletService.deleteTaxGroup(outletId, id);
    return reply.send({ code: 'TAX_GROUP_DELETED' });
  }

  // Charges
  async listCharges(request, reply) {
    const outletId = await this._getOutletId(request);
    const charges = await this.outletService.listCharges(outletId);
    return reply.send({ code: 'OK', charges });
  }

  async createCharge(request, reply) {
    const validated = chargeConfigSchema.parse(request.body);
    const outletId = await this._getOutletId(request);
    const charge = await this.outletService.createCharge(outletId, validated);
    return reply.status(201).send({ code: 'CHARGE_CREATED', charge });
  }

  async updateCharge(request, reply) {
    const validated = chargeConfigSchema.partial().parse(request.body);
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    const charge = await this.outletService.updateCharge(outletId, id, validated);
    return reply.send({ code: 'CHARGE_UPDATED', charge });
  }

  async deleteCharge(request, reply) {
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    await this.outletService.deleteCharge(outletId, id);
    return reply.send({ code: 'CHARGE_DELETED' });
  }

  // Numbering
  async listNumberingSeries(request, reply) {
    const outletId = await this._getOutletId(request);
    const series = await this.outletService.listNumberingSeries(outletId);
    return reply.send({ code: 'OK', series });
  }

  async updateNumberingSeries(request, reply) {
    const validated = numberingSeriesSchema.partial().parse(request.body);
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    const series = await this.outletService.updateNumberingSeries(outletId, id, validated);
    return reply.send({ code: 'SERIES_UPDATED', series });
  }

  // Printers
  async listPrinters(request, reply) {
    const outletId = await this._getOutletId(request);
    const printers = await this.outletService.listPrinters(outletId);
    return reply.send({ code: 'OK', printers });
  }

  async createPrinter(request, reply) {
    const validated = printerSchema.parse(request.body);
    const outletId = await this._getOutletId(request);
    const printer = await this.outletService.createPrinter(outletId, validated);
    return reply.status(201).send({ code: 'PRINTER_CREATED', printer });
  }

  async updatePrinter(request, reply) {
    const validated = printerSchema.partial().parse(request.body);
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    const printer = await this.outletService.updatePrinter(outletId, id, validated);
    return reply.send({ code: 'PRINTER_UPDATED', printer });
  }

  async testPrinter(request, reply) {
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    const result = await this.outletService.testPrinter(outletId, id);
    return reply.send({ code: 'TEST_PRINT_SENT', ...result });
  }

  // Devices
  async listDevices(request, reply) {
    const outletId = await this._getOutletId(request);
    const devices = await this.outletService.listDevices(outletId);
    return reply.send({ code: 'OK', devices });
  }

  async registerDevice(request, reply) {
    const validated = deviceSchema.parse(request.body);
    const outletId = await this._getOutletId(request);
    const device = await this.outletService.registerDevice(outletId, validated);
    return reply.status(200).send({ code: 'DEVICE_REGISTERED', device });
  }

  // Payment Modes
  async listPaymentModes(request, reply) {
    const outletId = await this._getOutletId(request);
    const modes = await this.outletService.listPaymentModes(outletId);
    return reply.send({ code: 'OK', paymentModes: modes });
  }

  async updatePaymentMode(request, reply) {
    const validated = paymentModeSchema.partial().parse(request.body);
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    const mode = await this.outletService.updatePaymentMode(outletId, id, validated);
    return reply.send({ code: 'PAYMENT_MODE_UPDATED', paymentMode: mode });
  }

  // Settings
  async getSettings(request, reply) {
    const outletId = await this._getOutletId(request);
    const settings = await this.outletService.getSettings(outletId);
    return reply.send({ code: 'OK', settings });
  }

  async updateSetting(request, reply) {
    const { key, value } = request.body || {};
    if (!key) return reply.status(400).send({ message: 'Key required' });
    const outletId = await this._getOutletId(request);
    const setting = await this.outletService.updateSetting(outletId, key, value);
    return reply.send({ code: 'SETTING_UPDATED', setting });
  }

  // Seed default setup
  async seedDefaults(request, reply) {
    const outletId = await this._getOutletId(request);
    await this.outletService.seedStandardSlabs(outletId);
    return reply.send({ code: 'SETUP_DEFAULTS_SEEDED', message: 'Standard slabs seeded' });
  }
}

