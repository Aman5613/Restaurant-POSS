import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export async function authRoutes(fastify, _opts) {
  const controller = new AuthController(fastify);

  // Public auth routes
  fastify.post('/login', controller.login.bind(controller));
  fastify.post('/pin-login', controller.pinLogin.bind(controller));
  fastify.post('/refresh', controller.refresh.bind(controller));
  fastify.post('/logout', controller.logout.bind(controller));

  // Protected auth routes (requires authentication)
  fastify.post(
    '/override',
    { preHandler: [authenticate] },
    controller.managerOverride.bind(controller)
  );

  // Current authenticated user profile
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    return reply.send({ code: 'OK', user: request.user });
  });
}
