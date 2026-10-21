import { CustomersService } from './customers.service.js';
import { customerSchema, collectDueSchema } from '@pos/shared';

export class CustomersController {
  constructor() {
    this.service = new CustomersService();
  }

  async list(req, reply) {
    const customers = await this.service.listCustomers({
      outletId: req.user.outlet_id,
      search: req.query.q,
      limit: req.query.limit,
    });
    return reply.send({ success: true, data: customers });
  }

  async getById(req, reply) {
    const customer = await this.service.getCustomerById({
      outletId: req.user.outlet_id,
      customerId: req.params.id,
    });
    return reply.send({ success: true, data: customer });
  }

  async create(req, reply) {
    const validated = customerSchema.parse(req.body);
    const customer = await this.service.createOrUpdateCustomer({
      outletId: req.user.outlet_id,
      ...validated,
    });
    return reply.status(201).send({ success: true, data: customer });
  }

  async collectDue(req, reply) {
    const validated = collectDueSchema.parse(req.body);
    const result = await this.service.collectDue({
      outletId: req.user.outlet_id,
      customerId: req.params.id,
      collectedBy: req.user.sub || req.user.id,
      ...validated,
    });
    return reply.send({ success: true, data: result });
  }
}
