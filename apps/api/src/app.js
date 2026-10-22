import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { jwtPlugin } from './plugins/jwt.js';
import { mongoosePlugin } from './plugins/mongoose.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { outletRoutes } from './modules/outlet/outlet.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { menuRoutes } from './modules/menu/menu.routes.js';
import { tablesRoutes } from './modules/tables/tables.routes.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import { kotRoutes } from './modules/kot/kot.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';
import { invoiceRoutes } from './modules/invoice/invoice.routes.js';
import { dayOpsRoutes } from './modules/day-ops/day-ops.routes.js';
import { customersRoutes } from './modules/customers/customers.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { syncRoutes } from './modules/sync/sync.routes.js';
import { superAdminRoutes } from './modules/super-admin/super-admin.routes.js';
import path from 'node:path';
import fs from 'node:fs';
import fastifyStatic from '@fastify/static';
import { socketIoPlugin } from './plugins/socket.js';

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
  const corsOrigins =
    env.NODE_ENV === 'development'
      ? true
      : env.CORS_ORIGIN.includes(',')
      ? env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : env.CORS_ORIGIN === '*'
      ? true
      : env.CORS_ORIGIN;

  await fastify.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(errorHandlerPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(jwtPlugin);
  // DB and Realtime plugins only if not skipping (for standalone unit tests)
  if (!opts.skipDb) {
    await fastify.register(mongoosePlugin);
    await fastify.register(socketIoPlugin);
  } else {
    fastify.decorate('io', {
      to: () => ({ emit: () => {} }),
      emit: () => {},
    });
  }

  // Health check routes
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  fastify.get('/v1/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API v1 routes
  await fastify.register(authRoutes, { prefix: '/v1/auth' });
  await fastify.register(outletRoutes, { prefix: '/v1/outlet' });
  await fastify.register(usersRoutes, { prefix: '/v1/users' });
  await fastify.register(menuRoutes, { prefix: '/v1/menu' });
  await fastify.register(tablesRoutes, { prefix: '/v1/tables' });
  await fastify.register(ordersRoutes, { prefix: '/v1/orders' });
  await fastify.register(kotRoutes, { prefix: '/v1/kot' });
  await fastify.register(billingRoutes, { prefix: '/v1/billing' });
  await fastify.register(invoiceRoutes, { prefix: '/v1/invoices' });
  await fastify.register(dayOpsRoutes, { prefix: '/v1/day-ops' });
  await fastify.register(customersRoutes, { prefix: '/v1/customers' });
  await fastify.register(reportsRoutes, { prefix: '/v1/reports' });
  await fastify.register(auditRoutes, { prefix: '/v1/audit-logs' });
  await fastify.register(syncRoutes, { prefix: '/v1/sync' });
  await fastify.register(superAdminRoutes, { prefix: '/v1/super-admin' });

  // Serve static frontend SPA if built (e.g. in single-container deployment)
  const webDistPath = path.resolve(process.cwd(), 'apps/web/dist');
  if (fs.existsSync(webDistPath)) {
    await fastify.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
      wildcard: false,
    });

    fastify.setNotFoundHandler((request, reply) => {
      const url = request.raw.url || '';
      if (
        url.startsWith('/v1') ||
        url.startsWith('/socket.io') ||
        url.startsWith('/docs') ||
        url.startsWith('/health')
      ) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Route ${request.method}:${request.url} not found`,
        });
      }
      return reply.sendFile('index.html');
    });
  }

  return fastify;
}
