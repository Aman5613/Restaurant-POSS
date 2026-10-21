import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { jwtPlugin } from './plugins/jwt.js';
import { mongoosePlugin } from './plugins/mongoose.js';
import { authRoutes } from './modules/auth/auth.routes.js';

export async function buildApp(opts = {}) {
  const fastify = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss Z' },
            },
          }
        : true,
    ...opts,
  });

  // Base plugins
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(errorHandlerPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(jwtPlugin);

  // DB plugin only if not skipping (for standalone unit tests)
  if (!opts.skipDb) {
    await fastify.register(mongoosePlugin);
  }

  // Health check route
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API v1 routes
  await fastify.register(authRoutes, { prefix: '/v1/auth' });

  return fastify;
}
