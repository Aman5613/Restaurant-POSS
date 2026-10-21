import { KotService } from './kot.service.js';
import { reprintKotSchema } from '@pos/shared';

export class KotController {
  constructor() {
    this.service = new KotService();
  }

  async list(req, reply) {
    const outletId = req.user.outlet_id;
    const { orderId, stationId, status, limit } = req.query;
    const kots = await this.service.listKots({ outletId, orderId, stationId, status, limit });
    return reply.send({ success: true, data: kots });
  }

  async getById(req, reply) {
    const outletId = req.user.outlet_id;
    const kot = await this.service.getKotById({ outletId, kotId: req.params.id });
    return reply.send({ success: true, data: kot });
  }

  async reprint(req, reply) {
    const outletId = req.user.outlet_id;
    const validated = reprintKotSchema.parse(req.body);
    const result = await this.service.reprintKot({
      outletId,
      kotId: req.params.id,
      reason: validated.reason,
      reprintedBy: req.user.sub || req.user.id,
    });
    return reply.send({ success: true, data: result });
  }

  async listPrintJobs(req, reply) {
    const outletId = req.user.outlet_id;
    const { status, limit } = req.query;
    const jobs = await this.service.listPrintJobs({ outletId, status, limit });
    return reply.send({ success: true, data: jobs });
  }

  async retryPrintJob(req, reply) {
    const outletId = req.user.outlet_id;
    const { printerId } = req.body || {};
    const job = await this.service.retryPrintJob({
      outletId,
      jobId: req.params.id,
      printerId,
    });
    return reply.send({ success: true, data: job });
  }
}
