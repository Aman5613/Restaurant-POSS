import { Customer, CustomerDue, Payment } from '../../models/index.js';

export class CustomersService {
  async listCustomers({ outletId, search, limit = 50 }) {
    const filter = { outlet_id: outletId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    return Customer.find(filter).sort({ 'stats.last_visit_at': -1 }).limit(Number(limit));
  }

  async getCustomerById({ outletId, customerId }) {
    const customer = await Customer.findOne({ _id: customerId, outlet_id: outletId });
    if (!customer) {
      const error = new Error('Customer not found');
      error.statusCode = 404;
      throw error;
    }
    return customer;
  }

  async createOrUpdateCustomer({ outletId, name, phone, email, gstin, address, notes }) {
    return Customer.findOneAndUpdate(
      { outlet_id: outletId, phone },
      {
        outlet_id: outletId,
        name,
        phone,
        email: email || undefined,
        gstin: gstin || undefined,
        address: address || undefined,
        notes: notes || undefined,
      },
      { upsert: true, new: true }
    );
  }

  async collectDue({ outletId, customerId, amount, paymentMode, referenceNo, notes, collectedBy }) {
    const customer = await this.getCustomerById({ outletId, customerId });

    // Find pending dues for this customer
    const dues = await CustomerDue.find({
      outlet_id: outletId,
      customer_phone: customer.phone,
      status: { $in: ['PENDING', 'PARTIALLY_SETTLED'] },
    }).sort({ createdAt: 1 });

    let remainingToSettle = amount;
    for (const due of dues) {
      if (remainingToSettle <= 0) break;

      const outstanding = due.amount - due.paid_amount;
      const settlePortion = Math.min(outstanding, remainingToSettle);

      due.paid_amount += settlePortion;
      if (due.paid_amount >= due.amount) {
        due.status = 'SETTLED';
      } else {
        due.status = 'PARTIALLY_SETTLED';
      }
      await due.save();

      remainingToSettle -= settlePortion;
    }

    customer.stats.current_due = Math.max(0, (customer.stats.current_due || 0) - amount);
    await customer.save();

    return { success: true, customer, settledAmount: amount };
  }
}
