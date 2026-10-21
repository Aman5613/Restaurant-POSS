import { pullSyncDelta, pushSyncBatch } from './sync.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export async function syncRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/pull', pullSyncDelta);
  fastify.post('/push', pushSyncBatch);
}
