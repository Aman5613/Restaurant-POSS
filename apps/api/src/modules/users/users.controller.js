import mongoose from 'mongoose';
import { Outlet } from '../../models/index.js';
import { UsersService } from './users.service.js';
import { userCreateSchema, userUpdateSchema, roleUpdateSchema } from '@pos/shared';

export class UsersController {
  constructor() {
    this.usersService = new UsersService();
  }

  async _getOutletId(request) {
    const raw = request.user?.outletId || request.user?.outlet_id || request.headers['x-outlet-id'];
    if (raw && raw !== 'default-outlet' && mongoose.Types.ObjectId.isValid(raw)) {
      return raw;
    }
    if (mongoose.connection?.readyState === 1) {
      try {
        const defaultOutlet = await Outlet.findOne();
        if (defaultOutlet) return defaultOutlet._id.toString();
      } catch (_e) {
        // fallback
      }
    }
    return raw;
  }

  async listUsers(request, reply) {
    const outletId = await this._getOutletId(request);
    const { role, isActive, search } = request.query;
    const users = await this.usersService.listUsers(outletId, {
      role,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      search,
    });
    return reply.send({ code: 'OK', users });
  }

  async getUser(request, reply) {
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    const user = await this.usersService.getUser(outletId, id);
    return reply.send({ code: 'OK', user });
  }

  async createUser(request, reply) {
    const validated = userCreateSchema.parse(request.body);
    const outletId = await this._getOutletId(request);
    const user = await this.usersService.createUser(outletId, validated);
    return reply.status(201).send({ code: 'USER_CREATED', user });
  }

  async updateUser(request, reply) {
    const validated = userUpdateSchema.parse(request.body);
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    const user = await this.usersService.updateUser(outletId, id, validated);
    return reply.send({ code: 'USER_UPDATED', user });
  }

  async deleteUser(request, reply) {
    const outletId = await this._getOutletId(request);
    const { id } = request.params;
    await this.usersService.deleteUser(outletId, id);
    return reply.send({ code: 'USER_DELETED' });
  }

  // Roles
  async listRoles(_request, reply) {
    const roles = await this.usersService.listRoles();
    return reply.send({ code: 'OK', roles });
  }

  async updateRole(request, reply) {
    const { slug } = request.params;
    const validated = roleUpdateSchema.parse(request.body);
    const role = await this.usersService.updateRolePermissions(slug, validated);
    return reply.send({ code: 'ROLE_UPDATED', role });
  }

  // Sessions
  async listSessions(request, reply) {
    const outletId = await this._getOutletId(request);
    const { userId } = request.query;
    const sessions = await this.usersService.listSessions(outletId, userId);
    return reply.send({ code: 'OK', sessions });
  }

  async revokeSession(request, reply) {
    const { id } = request.params;
    await this.usersService.revokeSession(id);
    return reply.send({ code: 'SESSION_REVOKED' });
  }
}
