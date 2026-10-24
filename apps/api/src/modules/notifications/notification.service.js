import webpush from 'web-push';
import { env } from '../../config/env.js';
import { PushSubscription } from '../../models/index.js';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
  } catch (_e) {
    // ignore
  }
}

export class NotificationService {
  getPublicKey() {
    return env.VAPID_PUBLIC_KEY;
  }

  async saveSubscription({ subscription, outletId, tenantId, userId, role, deviceName }) {
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      throw { statusCode: 400, message: 'Invalid push subscription payload' };
    }

    const doc = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        outletId,
        tenantId,
        userId,
        role: (role || 'staff').toLowerCase(),
        deviceName: deviceName || 'Web Browser',
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return { success: true, id: doc._id };
  }

  async removeSubscription(endpoint) {
    if (!endpoint) return { success: false };
    await PushSubscription.findOneAndDelete({ endpoint });
    return { success: true };
  }

  async sendToRoles({ outletId, roles = [], payload = {} }) {
    if (!outletId) return { sentCount: 0 };
    const normalizedRoles = roles.map((r) => r.toLowerCase());

    const subscriptions = await PushSubscription.find({
      outletId,
      role: { $in: normalizedRoles },
    });

    if (!subscriptions || subscriptions.length === 0) {
      return { sentCount: 0 };
    }

    const payloadString = JSON.stringify(payload);
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payloadString
          );
          return sub._id;
        } catch (err) {
          // Clean up expired or unregistered push subscriptions (HTTP 404 or 410)
          if (err.statusCode === 404 || err.statusCode === 410) {
            await PushSubscription.findByIdAndDelete(sub._id);
          }
          throw err;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    return { sentCount: successful, totalCount: subscriptions.length };
  }

  async notifyNewKot(outletId, kotData = {}) {
    const tableLabel = kotData.tableNumber ? `Table ${kotData.tableNumber}` : 'Takeaway';
    const itemsList = Array.isArray(kotData.items)
      ? kotData.items.map((i) => `${i.quantity || 1}x ${i.name || i.itemName || 'Dish'}`).join(', ')
      : 'New items received';

    const payload = {
      title: `🔥 New KOT: ${tableLabel}`,
      body: itemsList.length > 100 ? `${itemsList.slice(0, 97)}...` : itemsList,
      tag: `kot-${kotData.kotNumber || Date.now()}`,
      data: {
        type: 'KOT_NEW',
        outletId,
        kotId: kotData._id || kotData.id,
        tableNumber: kotData.tableNumber,
        url: '/kitchen',
      },
      requireInteraction: true,
      vibrate: [500, 250, 500, 250, 500],
    };

    return this.sendToRoles({
      outletId,
      roles: ['cook', 'manager'],
      payload,
    });
  }

  async notifyFoodReady(outletId, readyData = {}) {
    const tableLabel = readyData.tableNumber ? `Table ${readyData.tableNumber}` : 'Order';
    const dishLabel = readyData.itemName || readyData.dishName || 'Food';

    const payload = {
      title: `🍽️ Food Ready: ${tableLabel}`,
      body: `${dishLabel} is prepared & waiting for pickup!`,
      tag: `ready-${readyData.tableNumber || Date.now()}`,
      data: {
        type: 'FOOD_READY',
        outletId,
        tableNumber: readyData.tableNumber,
        url: '/tables',
      },
      requireInteraction: true,
      vibrate: [400, 200, 400, 200, 400],
    };

    return this.sendToRoles({
      outletId,
      roles: ['captain', 'biller', 'manager'],
      payload,
    });
  }
}
