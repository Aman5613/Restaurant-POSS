import { UsersController } from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '@pos/shared';

export async function usersRoutes(fastify, _opts) {
  const controller = new UsersController();

  fastify.addHook('preHandler', authenticate);

  // Users CRUD
  fastify.get('/', { preHandler: [authorize({ permission: PERMISSIONS.USER_VIEW })] }, controller.listUsers.bind(controller));
  fastify.get('/:id', { preHandler: [authorize({ permission: PERMISSIONS.USER_VIEW })] }, controller.getUser.bind(controller));
  fastify.post('/', { preHandler: [authorize({ permission: PERMISSIONS.USER_CREATE })] }, controller.createUser.bind(controller));
  fastify.put('/:id', { preHandler: [authorize({ permission: PERMISSIONS.USER_UPDATE })] }, controller.updateUser.bind(controller));
  fastify.delete('/:id', { preHandler: [authorize({ permission: PERMISSIONS.USER_DELETE })] }, controller.deleteUser.bind(controller));

  // Roles
  fastify.get('/roles/list', { preHandler: [authorize({ permission: PERMISSIONS.ROLE_VIEW })] }, controller.listRoles.bind(controller));
  fastify.put('/roles/:slug', { preHandler: [authorize({ permission: PERMISSIONS.ROLE_MANAGE })] }, controller.updateRole.bind(controller));

  // Sessions
  fastify.get('/sessions/active', { preHandler: [authorize({ permission: PERMISSIONS.USER_VIEW })] }, controller.listSessions.bind(controller));
  fastify.delete('/sessions/:id', { preHandler: [authorize({ permission: PERMISSIONS.USER_VIEW })] }, controller.revokeSession.bind(controller));
}
