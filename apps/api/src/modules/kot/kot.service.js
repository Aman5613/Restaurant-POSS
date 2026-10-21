import { KOT, PrintJob, ReprintLog } from '../../models/index.js';
import { PRINT_JOB_STATUS } from '@pos/shared';

export class KotService {
  async listKots({ outletId, orderId, stationId, status, limit = 50 }) {
    const filter = { outlet_id: outletId };
    if (orderId) filter.order_id = orderId;
    if (stationId) filter.station_id = stationId;
    if (status) filter.status = status;

    return KOT.find(filter)
      .populate('station_id', 'name code')
      .populate('created_by', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }

  async getKotById({ outletId, kotId }) {
    const kot = await KOT.findOne({ _id: kotId, outlet_id: outletId })
      .populate('station_id', 'name code printer_id')
      .populate('order_id', 'order_no order_type table_id');

    if (!kot) {
      const error = new Error('KOT not found');
      error.statusCode = 404;
      throw error;
    }
    return kot;
  }

  async reprintKot({ outletId, kotId, reason, reprintedBy }) {
    const kot = await this.getKotById({ outletId, kotId });

    await ReprintLog.create({
      outlet_id: outletId,
      kot_id: kot._id,
      reason,
      reprinted_by: reprintedBy,
    });

    let printJob = null;
    if (kot.station_id?.printer_id) {
      printJob = await PrintJob.create({
        outlet_id: outletId,
        printer_id: kot.station_id.printer_id,
        kot_id: kot._id,
        job_type: 'KOT',
        status: PRINT_JOB_STATUS.QUEUED,
        payload: { is_duplicate: true, reason },
        created_by: reprintedBy,
      });
    }

    return { success: true, kot, printJob };
  }

  async listPrintJobs({ outletId, status, limit = 50 }) {
    const filter = { outlet_id: outletId };
    if (status) filter.status = status;

    return PrintJob.find(filter)
      .populate('printer_id', 'name ip_address port')
      .populate('kot_id', 'kot_no order_no table_name station_name')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }

  async retryPrintJob({ outletId, jobId, printerId }) {
    const job = await PrintJob.findOne({ _id: jobId, outlet_id: outletId });
    if (!job) {
      const error = new Error('Print job not found');
      error.statusCode = 404;
      throw error;
    }

    if (printerId) {
      job.printer_id = printerId;
    }
    job.status = PRINT_JOB_STATUS.QUEUED;
    job.retry_count += 1;
    job.error_message = null;
    await job.save();

    return job;
  }
}
