import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { env } from '../config/env.js';

export async function jwtPlugin(fastify, _opts) {
  await fastify.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
  });

  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });
}
