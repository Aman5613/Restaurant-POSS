import mongoose from 'mongoose';

const creditNoteSchema = new mongoose.Schema(
  {
    outlet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
    bill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    credit_note_no: { type: String, required: true, index: true }, // e.g. CN-001
    original_invoice_no: { type: String, required: true },
    amount: { type: Number, required: true }, // paise
    reason: { type: String, required: true },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CreditNote = mongoose.model('CreditNote', creditNoteSchema);
export default CreditNote;
