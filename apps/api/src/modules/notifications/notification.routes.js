import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export async function notificationRoutes(fastify, _opts) {
  const controller = new NotificationController();

  // Public endpoint to retrieve VAPID public key
  fastify.get('/vapid-public-key', controller.getVapidPublicKey.bind(controller));

  // Protected subscription endpoints
  fastify.post('/subscribe', { preHandler: [authenticate] }, controller.subscribe.bind(controller));
  fastify.post('/unsubscribe', { preHandler: [authenticate] }, controller.unsubscribe.bind(controller));
  fastify.post('/test', { preHandler: [authenticate] }, controller.testNotification.bind(controller));
}
