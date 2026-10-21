import mongoose from 'mongoose';

const numberingSeriesSchema = new mongoose.Schema(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    docType: {
      type: String,
      enum: ['ORDER', 'BILL', 'KOT'],
      required: true,
    },
    prefix: { type: String, required: true, trim: true },
    suffix: { type: String, trim: true, default: '' },
    currentNumber: { type: Number, default: 0 },
    padding: { type: Number, default: 4, min: 2, max: 8 },
    resetFrequency: {
      type: String,
      enum: ['NEVER', 'DAILY', 'MONTHLY', 'FINANCIAL_YEAR'],
      default: 'DAILY',
    },
    lastResetDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

numberingSeriesSchema.index({ outletId: 1, docType: 1 }, { unique: true });

numberingSeriesSchema.methods.getNextFormattedNumber = async function () {
  this.currentNumber += 1;
  await this.save();

  const numStr = String(this.currentNumber).padStart(this.padding, '0');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${this.prefix}-${dateStr}-${numStr}${this.suffix ? '-' + this.suffix : ''}`;
};

export const NumberingSeries = mongoose.model('NumberingSeries', numberingSeriesSchema);
