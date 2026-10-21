import { BillingService } from './billing.service.js';
import {
  generateBillSchema,
  billDiscountSchema,
  settleBillSchema,
  voidBillSchema,
} from '@pos/shared';

export class BillingController {
  constructor() {
    this.service = new BillingService();
  }

  async generateBill(req, reply) {
    const validated = generateBillSchema.parse(req.body);
    const bill = await this.service.generateOrRefreshBill({
      outletId: req.user.outlet_id,
      createdBy: req.user.sub || req.user.id,
      ...validated,
    });
    return reply.status(201).send({ success: true, data: bill });
  }

  async getBill(req, reply) {
    const bill = await this.service.getBillById({
      outletId: req.user.outlet_id,
      billId: req.params.id,
    });
    return reply.send({ success: true, data: bill });
  }

  async applyDiscount(req, reply) {
    const validated = billDiscountSchema.parse(req.body);
    const bill = await this.service.applyDiscount({
      outletId: req.user.outlet_id,
      billId: req.params.id,
      discount: validated,
      appliedBy: req.user.sub || req.user.id,
    });
    return reply.send({ success: true, data: bill });
  }

  async settleBill(req, reply) {
    const validated = settleBillSchema.parse(req.body);
    const result = await this.service.addPaymentsAndSettle({
      outletId: req.user.outlet_id,
      billId: req.params.id,
      payments: validated.payments,
      settledBy: req.user.sub || req.user.id,
    });
    return reply.send({ success: true, data: result });
  }

  async voidBill(req, reply) {
    const validated = voidBillSchema.parse(req.body);
    const result = await this.service.voidBill({
      outletId: req.user.outlet_id,
      billId: req.params.id,
      reason: validated.reason,
      voidedBy: req.user.sub || req.user.id,
    });
    return reply.send({ success: true, data: result });
  }
}
