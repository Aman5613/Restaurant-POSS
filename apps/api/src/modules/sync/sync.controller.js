import {
  Category,
  Item,
  DiningTable,
  OutletSetting,
  Order,
  Payment,
  CashMovement,
} from '../../models/index.js';

export async function pullSyncDelta(request, reply) {
  const outletId = request.user?.outletId;
  const { cursor } = request.query;

  const since = cursor ? new Date(cursor) : new Date(0);
  const outletQuery = outletId ? { outlet_id: outletId } : {};

  const [categories, items, tables, settings] = await Promise.all([
    Category.find({ ...outletQuery, updatedAt: { $gt: since } }).lean(),
    Item.find({ ...outletQuery, updatedAt: { $gt: since } }).lean(),
    DiningTable.find({ ...outletQuery, updatedAt: { $gt: since } }).lean(),
    OutletSetting.findOne(outletId ? { outletId } : {}).lean(),
  ]);

  return reply.send({
    success: true,
    data: {
      categories,
      items,
      tables,
      settings,
      cursor: new Date().toISOString(),
    },
  });
}

export async function pushSyncBatch(request, reply) {
  const outletId = request.user?.outletId;
  const userId = request.user?.id;
  const { events = [] } = request.body;

  const results = [];

  for (const event of events) {
    try {
      const { type, payload } = event;

      if (type === 'ORDER_CREATE') {
        const existing = await Order.findOne({ client_uuid: payload.client_uuid });
        if (!existing) {
          const created = await Order.create({
            ...payload,
            outlet_id: outletId,
            captain_id: userId,
          });
          results.push({ id: event.id, status: 'SYNCED', serverId: created._id });
        } else {
          results.push({ id: event.id, status: 'IDEMPOTENT_IGNORED', serverId: existing._id });
        }
      } else if (type === 'PAYMENT_RECORD') {
        const payment = await Payment.create({
          ...payload,
          outlet_id: outletId,
          created_by: userId,
        });
        results.push({ id: event.id, status: 'SYNCED', serverId: payment._id });
      } else if (type === 'CASH_MOVEMENT') {
        const movement = await CashMovement.create({
          ...payload,
          outlet_id: outletId,
          performed_by: userId,
        });
        results.push({ id: event.id, status: 'SYNCED', serverId: movement._id });
      } else {
        results.push({ id: event.id, status: 'SKIPPED_UNKNOWN_TYPE' });
      }
    } catch (err) {
      results.push({ id: event.id, status: 'FAILED', error: err.message });
    }
  }

  return reply.send({
    success: true,
    data: {
      processed: results.length,
      results,
    },
  });
}
