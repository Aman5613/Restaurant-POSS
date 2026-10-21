import mongoose from 'mongoose';
import { PRINT_JOB_STATUS } from '@pos/shared';

const printJobSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    printer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Printer', index: true },
    kot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'KOT', index: true },
    job_type: {
      type: String,
      enum: ['KOT', 'BILL', 'RECEIPT', 'REPORT'],
      default: 'KOT',
    },
    status: {
      type: String,
      enum: Object.values(PRINT_JOB_STATUS),
      default: PRINT_JOB_STATUS.QUEUED,
      index: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed },
    retry_count: { type: Number, default: 0 },
    error_message: { type: String },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completed_at: { type: Date },
  },
  { timestamps: true }
);

export const PrintJob = mongoose.model('PrintJob', printJobSchema);
export default PrintJob;
