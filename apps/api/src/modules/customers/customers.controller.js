import { CustomersService } from './customers.service.js';
import { customerSchema, collectDueSchema } from '@pos/shared';
import { Outlet } from '../../models/index.js';
import mongoose from 'mongoose';

export class CustomersController {
  constructor() {
    this.service = new CustomersService();
  }

  async _resolveOutletId(req) {
    const raw = req.user?.outlet_id || req.user?.outletId || req.headers['x-outlet-id'];
    if (raw && raw !== 'default-outlet' && mongoose.Types.ObjectId.isValid(raw)) {
      return raw;
    }
    const defaultOutlet = await Outlet.findOne();
    return defaultOutlet ? defaultOutlet._id.toString() : raw;
  }

  async list(req, reply) {
    const outletId = await this._resolveOutletId(req);
    const customers = await this.service.listCustomers({
      outletId,
      search: req.query.q,
      limit: req.query.limit,
    });
    return reply.send({ success: true, data: customers });
  }

  async getById(req, reply) {
    const outletId = await this._resolveOutletId(req);
    const customer = await this.service.getCustomerById({
      outletId,
      customerId: req.params.id,
    });
    return reply.send({ success: true, data: customer });
  }

  async create(req, reply) {
    const validated = customerSchema.parse(req.body);
    const outletId = await this._resolveOutletId(req);
    const customer = await this.service.createOrUpdateCustomer({
      outletId,
      ...validated,
    });
    return reply.status(201).send({ success: true, data: customer });
  }

  async collectDue(req, reply) {
    const validated = collectDueSchema.parse(req.body);
    const outletId = await this._resolveOutletId(req);
    const result = await this.service.collectDue({
      outletId,
      customerId: req.params.id,
      collectedBy: req.user?.sub || req.user?.id || req.user?.userId,
      ...validated,
    });
    return reply.send({ success: true, data: result });
  }
}

