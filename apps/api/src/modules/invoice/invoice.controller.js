import { InvoiceService } from './invoice.service.js';

export class InvoiceController {
  constructor() {
    this.service = new InvoiceService();
  }

  async list(req, reply) {
    const invoices = await this.service.listInvoices({
      outletId: req.user.outlet_id,
      limit: req.query.limit,
    });
    return reply.send({ success: true, data: invoices });
  }

  async getById(req, reply) {
    const invoice = await this.service.getInvoiceById({
      outletId: req.user.outlet_id,
      invoiceId: req.params.id,
    });
    return reply.send({ success: true, data: invoice });
  }
}
