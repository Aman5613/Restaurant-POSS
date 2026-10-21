import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';

async function jwtPluginInner(fastify, _opts) {
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

export const jwtPlugin = fp(jwtPluginInner, { name: 'jwt-auth' });
