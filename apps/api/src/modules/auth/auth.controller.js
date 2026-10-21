import { AuthService } from './auth.service.js';
import {
  loginSchema,
  pinLoginSchema,
  managerOverrideSchema,
  refreshTokenSchema,
} from '@pos/shared';

export class AuthController {
  constructor(fastify) {
    this.authService = new AuthService(fastify);
  }

  async login(request, reply) {
    const validated = loginSchema.parse(request.body);
    const result = await this.authService.loginWithCredentials({
      ...validated,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    this._setRefreshCookie(reply, result.refreshToken);

    return reply.status(200).send({
      code: 'LOGIN_SUCCESS',
      user: result.user,
      accessToken: result.accessToken,
    });
  }

  async pinLogin(request, reply) {
    const validated = pinLoginSchema.parse(request.body);
    const result = await this.authService.loginWithPin({
      ...validated,
      outletId: request.headers['x-outlet-id'],
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    this._setRefreshCookie(reply, result.refreshToken);

    return reply.status(200).send({
      code: 'PIN_LOGIN_SUCCESS',
      user: result.user,
      accessToken: result.accessToken,
    });
  }

  async refresh(request, reply) {
    const body = refreshTokenSchema.parse(request.body || {});
    const token = body.refreshToken || request.cookies.refreshToken;

    const result = await this.authService.refreshTokens({ refreshToken: token });
    this._setRefreshCookie(reply, result.refreshToken);

    return reply.status(200).send({
      code: 'TOKEN_REFRESHED',
      accessToken: result.accessToken,
    });
  }

  async logout(request, reply) {
    const token = request.cookies.refreshToken;
    await this.authService.logout({ refreshToken: token });

    reply.clearCookie('refreshToken', { path: '/' });
    return reply.status(200).send({ code: 'LOGOUT_SUCCESS', message: 'Logged out successfully' });
  }

  async managerOverride(request, reply) {
    const validated = managerOverrideSchema.parse(request.body);
    const result = await this.authService.createManagerOverride({
      ...validated,
      outletId: request.user.outletId,
      requestedByUserId: request.user.sub,
    });

    return reply.status(200).send({
      code: 'OVERRIDE_GRANTED',
      ...result,
    });
  }

  _setRefreshCookie(reply, token) {
    reply.setCookie('refreshToken', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  }
}
