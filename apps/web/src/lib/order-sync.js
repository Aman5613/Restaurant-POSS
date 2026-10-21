import { db } from '../db/dexie';

export async function saveOrderOffline(orderPayload) {
  const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const localOrder = {
    id: localId,
    outletId: orderPayload.outletId || 'default_outlet',
    tableId: orderPayload.tableId || null,
    status: 'DRAFT',
    orderType: orderPayload.orderType || 'DINE_IN',
    createdAt: new Date().toISOString(),
    isSynced: false,
    payload: orderPayload,
  };

  await db.orders.put(localOrder);

  // Queue in syncQueue
  await db.syncQueue.add({
    action: 'CREATE_ORDER',
    entity: 'orders',
    payload: { localId, ...orderPayload },
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    retryCount: 0,
  });

  return localOrder;
}

export async function processOfflineQueue() {
  if (!navigator.onLine) return;

  const pendingJobs = await db.syncQueue.where('status').equals('PENDING').toArray();

  for (const job of pendingJobs) {
    try {
      if (job.action === 'CREATE_ORDER') {
        const response = await fetch('/v1/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job.payload),
        });

        if (response.ok) {
          await db.syncQueue.update(job.id, { status: 'COMPLETED' });
          if (job.payload.localId) {
            await db.orders.update(job.payload.localId, { isSynced: true });
          }
        } else {
          await db.syncQueue.update(job.id, {
            status: 'FAILED',
            retryCount: job.retryCount + 1,
          });
        }
      }
    } catch {
      // Still offline or network blip; keep job pending for next retry
    }
  }
}
