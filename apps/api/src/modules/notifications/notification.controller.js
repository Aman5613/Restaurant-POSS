import { NotificationService } from './notification.service.js';

export class NotificationController {
  constructor() {
    this.service = new NotificationService();
  }

  async getVapidPublicKey(_req, reply) {
    const key = this.service.getPublicKey();
    return reply.send({ success: true, publicKey: key });
  }

  async subscribe(req, reply) {
    const { subscription, deviceName } = req.body || {};
    const outletId = req.user?.outletId || req.body?.outletId;
    const tenantId = req.user?.tenantId || req.body?.tenantId;
    const userId = req.user?.userId || req.user?.id;
    const role = req.user?.role || req.body?.role || 'staff';

    if (!outletId) {
      return reply.status(400).send({ statusCode: 400, message: 'outletId is required' });
    }

    const result = await this.service.saveSubscription({
      subscription,
      outletId,
      tenantId,
      userId,
      role,
      deviceName,
    });

    return reply.status(201).send(result);
  }

  async unsubscribe(req, reply) {
    const { endpoint } = req.body || {};
    const result = await this.service.removeSubscription(endpoint);
    return reply.send(result);
  }

  async testNotification(req, reply) {
    const outletId = req.user?.outletId || req.body?.outletId;
    const { role = 'cook', title = 'Test Alert', body = 'Push notification test' } = req.body || {};

    const result = await this.service.sendToRoles({
      outletId,
      roles: [role],
      payload: {
        title,
        body,
        tag: `test-${Date.now()}`,
        data: { type: 'TEST', outletId },
      },
    });

    return reply.send({ success: true, ...result });
  }
}
