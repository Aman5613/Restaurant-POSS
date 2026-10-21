import mongoose from 'mongoose';

const reprintLogSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    kot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'KOT', required: true },
    reason: { type: String, required: true },
    reprinted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ReprintLog = mongoose.model('ReprintLog', reprintLogSchema);
export default ReprintLog;
