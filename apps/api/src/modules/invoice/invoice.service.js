import { Invoice } from '../../models/index.js';

export class InvoiceService {
  async getInvoiceById({ outletId, invoiceId }) {
    const invoice = await Invoice.findOne({ _id: invoiceId, outlet_id: outletId });
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }
    return invoice;
  }

  async getInvoiceByNumber({ outletId, invoiceNo }) {
    const invoice = await Invoice.findOne({ invoice_no: invoiceNo, outlet_id: outletId });
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }
    return invoice;
  }

  async listInvoices({ outletId, limit = 50 }) {
    return Invoice.find({ outlet_id: outletId })
      .sort({ issued_at: -1 })
      .limit(Number(limit));
  }
}
