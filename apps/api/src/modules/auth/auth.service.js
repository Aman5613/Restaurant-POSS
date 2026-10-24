import crypto from 'crypto';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { User, Session, OverrideLog, AuditLog, Outlet } from '../../models/index.js';
import { ROLE_DEFINITIONS, AUDIT_EVENTS } from '@pos/shared';

export class AuthService {
  constructor(fastify) {
    this.fastify = fastify;
  }

  async loginWithCredentials({ identifier, password, ipAddress, userAgent }) {
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
      isActive: true,
    });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    if (user.isLocked()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw {
        statusCode: 423,
        message: `Account is locked due to too many failed attempts. Try again in ${waitMinutes} minute(s).`,
      };
    }

    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      await user.recordFailedAttempt();
      await AuditLog.create({
        event: AUDIT_EVENTS.AUTH_LOGIN_FAILURE,
        userId: user._id,
        metadata: { identifier, reason: 'Invalid password' },
        ipAddress,
      });
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    await user.resetFailedAttempts();

    const tokens = await this._generateTokens(user, { ipAddress, userAgent });

    await AuditLog.create({
      event: AUDIT_EVENTS.AUTH_LOGIN_SUCCESS,
      userId: user._id,
      tenantId: user.tenantId,
      outletId: user.outletId,
      ipAddress,
    });

    const outlet = user.outletId ? await Outlet.findById(user.outletId).select('name isSetupCompleted currency').lean() : null;

    return {
      user: this._sanitizeUser(user, outlet),
      ...tokens,
    };
  }

  async loginWithPin({ deviceId, pin, outletId, ipAddress, userAgent }) {
    // Find active user in that outlet or any outlet matching PIN
    const query = { isActive: true };
    if (outletId && mongoose.Types.ObjectId.isValid(outletId)) {
      query.outletId = outletId;
    }

    const candidates = await User.find(query);
    let matchedUser = null;

    for (const candidate of candidates) {
      if (candidate.isLocked()) continue;
      if (await candidate.verifyPin(pin)) {
        matchedUser = candidate;
        break;
      }
    }

    if (!matchedUser) {
      throw { statusCode: 401, message: 'Invalid device PIN' };
    }

    await matchedUser.resetFailedAttempts();

    const tokens = await this._generateTokens(matchedUser, { deviceId, ipAddress, userAgent });

    await AuditLog.create({
      event: AUDIT_EVENTS.AUTH_PIN_SUCCESS,
      userId: matchedUser._id,
      tenantId: matchedUser.tenantId,
      outletId: matchedUser.outletId,
      metadata: { deviceId },
      ipAddress,
    });

    const outlet = matchedUser.outletId ? await Outlet.findById(matchedUser.outletId).select('name isSetupCompleted currency').lean() : null;

    return {
      user: this._sanitizeUser(matchedUser, outlet),
      ...tokens,
    };
  }

  async refreshTokens({ refreshToken }) {
    if (!refreshToken) {
      throw { statusCode: 401, message: 'Refresh token missing' };
    }

    const decoded = this.fastify.jwt.decode(refreshToken);
    if (!decoded || !decoded.sessionId) {
      throw { statusCode: 401, message: 'Invalid refresh token' };
    }

    const session = await Session.findById(decoded.sessionId);
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw { statusCode: 401, message: 'Session expired or revoked' };
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      throw { statusCode: 401, message: 'User inactive or not found' };
    }

    // Rotate refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newRefreshTokenHash = await argon2.hash(newRefreshToken);

    session.refreshTokenHash = newRefreshTokenHash;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    const permissions = this._resolvePermissions(user);
    const accessToken = this.fastify.jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        tenantId: user.tenantId?.toString(),
        outletId: user.outletId?.toString(),
        permissions,
      },
      { expiresIn: '15m' }
    );

    return {
      accessToken,
      refreshToken: this.fastify.jwt.sign(
        { sessionId: session._id.toString(), token: newRefreshToken },
        { expiresIn: '7d' }
      ),
    };
  }

  async logout({ refreshToken }) {
    if (!refreshToken) return;
    try {
      const decoded = this.fastify.jwt.decode(refreshToken);
      if (decoded?.sessionId) {
        await Session.findByIdAndUpdate(decoded.sessionId, { isRevoked: true });
      }
    } catch (_e) {
      // Ignore token decode errors on logout
    }
  }

  async createManagerOverride({ managerPin, action, reason, referenceId, outletId, requestedByUserId }) {
    // Look up managers or admins in the outlet
    const managers = await User.find({
      outletId,
      role: { $in: ['admin', 'manager', 'super-admin'] },
      isActive: true,
    });

    let matchedManager = null;
    for (const mgr of managers) {
      if (await mgr.verifyPin(managerPin)) {
        matchedManager = mgr;
        break;
      }
    }

    if (!matchedManager) {
      throw { statusCode: 401, message: 'Invalid manager PIN' };
    }

    const overrideToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await argon2.hash(overrideToken);

    await OverrideLog.create({
      managerId: matchedManager._id,
      requestedBy: requestedByUserId,
      outletId,
      action,
      reason,
      referenceId,
      tokenHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minute one-time window
    });

    return {
      overrideToken,
      managerName: matchedManager.name,
      expiresInSeconds: 600,
    };
  }

  async _generateTokens(user, { deviceId, ipAddress, userAgent }) {
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = await argon2.hash(rawRefreshToken);

    const session = await Session.create({
      userId: user._id,
      tenantId: user.tenantId,
      outletId: user.outletId,
      deviceId,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const permissions = this._resolvePermissions(user);

    const accessToken = this.fastify.jwt.sign(
      {
        sub: user._id.toString(),
        name: user.name,
        role: user.role,
        tenantId: user.tenantId?.toString(),
        outletId: user.outletId?.toString(),
        permissions,
      },
      { expiresIn: '15m' }
    );

    const signedRefreshToken = this.fastify.jwt.sign(
      { sessionId: session._id.toString(), token: rawRefreshToken },
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken: signedRefreshToken,
    };
  }

  _resolvePermissions(user) {
    const basePermissions = ROLE_DEFINITIONS[user.role]?.permissions || [];
    const custom = user.customPermissions || [];
    return Array.from(new Set([...basePermissions, ...custom]));
  }

  _sanitizeUser(user, outlet = null) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId?.toString(),
      outletId: user.outletId?.toString(),
      outletName: outlet?.name,
      isSetupCompleted: outlet != null ? Boolean(outlet.isSetupCompleted) : (user.role === 'super-admin' ? true : false),
      permissions: this._resolvePermissions(user),
      maxDiscountPercent: user.maxDiscountPercent,
    };
  }
}
