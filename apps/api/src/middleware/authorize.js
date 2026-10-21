import { ROLES } from '@pos/shared';

/**
 * Authorization middleware builder
 * @param {Object} options
 * @param {string[]} [options.roles] Allowed roles
 * @param {string} [options.permission] Required permission code
 */
export function authorize({ roles = [], permission = null } = {}) {
  return async function (request, reply) {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        requestId: request.id,
      });
    }

    // Super-admin always bypasses role/permission checks
    if (user.role === ROLES.SUPER_ADMIN) {
      return;
    }

    // Role check
    if (roles.length > 0 && !roles.includes(user.role)) {
      return reply.status(403).send({
        code: 'FORBIDDEN',
        message: `Forbidden: role '${user.role}' not permitted`,
        requestId: request.id,
      });
    }

    // Permission check
    if (permission) {
      const userPermissions = user.permissions || [];
      if (!userPermissions.includes(permission)) {
        return reply.status(403).send({
          code: 'FORBIDDEN',
          message: `Forbidden: missing required permission '${permission}'`,
          requestId: request.id,
        });
      }
    }
  };
}
