import argon2 from 'argon2';
import { User, Role, Session } from '../../models/index.js';
import { ROLES, ROLE_DEFINITIONS } from '@pos/shared';

export class UsersService {
  async listUsers(outletId, { role, isActive, search } = {}) {
    const query = {};
    if (outletId) {
      query.outletId = outletId;
    }

    // Strict Data Isolation: Never expose SUPER_ADMIN in outlet staff listings
    if (role && role !== ROLES.SUPER_ADMIN) {
      query.role = role;
    } else {
      query.role = { $ne: ROLES.SUPER_ADMIN };
    }

    if (typeof isActive === 'boolean') query.isActive = isActive;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });
    return users.map((u) => {
      const obj = u.toObject();
      obj.hasPin = Boolean(obj.pinHash);
      delete obj.pinHash;
      return obj;
    });
  }

  async getUser(outletId, userId) {
    const user = await User.findOne({
      _id: userId,
      role: { $ne: ROLES.SUPER_ADMIN },
      ...(outletId ? { outletId } : {}),
    }).select('-passwordHash -pinHash');
    if (!user) throw { statusCode: 404, message: 'User not found' };
    return user;
  }

  async createUser(outletId, data) {
    if (data.role === ROLES.SUPER_ADMIN) {
      throw { statusCode: 403, message: 'Super Admin accounts cannot be created as outlet employees' };
    }
    // 1. Phone uniqueness check
    const existingPhone = await User.findOne({
      phone: data.phone,
      ...(outletId ? { outletId } : {}),
    });
    if (existingPhone) {
      throw { statusCode: 409, message: 'A user with this phone number already exists' };
    }

    // 2. PIN uniqueness in outlet check
    if (data.pin) {
      const candidates = await User.find({ ...(outletId ? { outletId } : {}), isActive: true });
      for (const cand of candidates) {
        if (await cand.verifyPin(data.pin)) {
          throw { statusCode: 409, message: 'This PIN is already in use by another user' };
        }
      }
    }

    const userPayload = { ...data, outletId };

    if (data.password) {
      userPayload.passwordHash = await argon2.hash(data.password);
      delete userPayload.password;
    }
    if (data.pin) {
      userPayload.pinHash = await argon2.hash(data.pin);
      delete userPayload.pin;
    }

    const created = await User.create(userPayload);
    const sanitized = created.toObject();
    delete sanitized.passwordHash;
    delete sanitized.pinHash;
    return sanitized;
  }

  async updateUser(outletId, userId, data) {
    const user = await User.findOne({ _id: userId, ...(outletId ? { outletId } : {}) });
    if (!user) throw { statusCode: 404, message: 'User not found' };

    // Business rule: Last active admin cannot be deactivated or downgraded
    if (
      user.role === ROLES.ADMIN &&
      ((data.role && data.role !== ROLES.ADMIN) || data.isActive === false)
    ) {
      const adminCount = await User.countDocuments({
        outletId: user.outletId,
        role: ROLES.ADMIN,
        isActive: true,
      });
      if (adminCount <= 1) {
        throw { statusCode: 400, message: 'Cannot deactivate or change role of the last active Admin' };
      }
    }

    // PIN uniqueness check if updating PIN
    if (data.pin) {
      const candidates = await User.find({
        _id: { $ne: user._id },
        ...(outletId ? { outletId } : {}),
        isActive: true,
      });
      for (const cand of candidates) {
        if (await cand.verifyPin(data.pin)) {
          throw { statusCode: 409, message: 'This PIN is already in use by another user' };
        }
      }
      user.pinHash = await argon2.hash(data.pin);
      delete data.pin;
    }

    if (data.password) {
      user.passwordHash = await argon2.hash(data.password);
      delete data.password;
    }

    Object.assign(user, data);
    await user.save();

    // If deactivated, revoke active sessions
    if (data.isActive === false) {
      await Session.updateMany({ userId: user._id }, { isRevoked: true });
    }

    const sanitized = user.toObject();
    delete sanitized.passwordHash;
    delete sanitized.pinHash;
    return sanitized;
  }

  async deleteUser(outletId, userId) {
    const user = await User.findOne({ _id: userId, ...(outletId ? { outletId } : {}) });
    if (user.role === ROLES.SUPER_ADMIN) {
      throw { statusCode: 403, message: 'Cannot delete Super Admin account' };
    }

    if (user.role === ROLES.ADMIN) {
      const adminCount = await User.countDocuments({
        outletId: user.outletId,
        role: ROLES.ADMIN,
        isActive: true,
      });
      if (adminCount <= 1) {
        throw { statusCode: 400, message: 'Cannot delete the only Admin user' };
      }
    }

    await User.findByIdAndDelete(userId);
    await Session.updateMany({ userId }, { isRevoked: true });
    return { success: true };
  }

  // Roles & Permissions
  async listRoles() {
    const roles = await Role.find().sort({ level: -1 });
    if (roles.length === 0) {
      // Return predefined roles if DB has none yet
      return Object.entries(ROLE_DEFINITIONS).map(([slug, def]) => ({
        slug,
        name: def.name,
        description: def.description,
        permissions: def.permissions,
        level: def.level,
      }));
    }
    return roles;
  }

  async updateRolePermissions(slug, { permissions, name, description }) {
    const update = { permissions };
    if (name) update.name = name;
    if (description) update.description = description;

    const role = await Role.findOneAndUpdate({ slug }, update, { new: true, upsert: true });
    return role;
  }

  // Sessions
  async listSessions(outletId, userId) {
    const query = { isRevoked: false, expiresAt: { $gt: new Date() } };
    if (outletId) query.outletId = outletId;
    if (userId) query.userId = userId;

    return Session.find(query)
      .populate('userId', 'name role phone')
      .sort({ createdAt: -1 });
  }

  async revokeSession(sessionId) {
    const session = await Session.findByIdAndUpdate(sessionId, { isRevoked: true });
    if (!session) throw { statusCode: 404, message: 'Session not found' };
    return { success: true };
  }
}
