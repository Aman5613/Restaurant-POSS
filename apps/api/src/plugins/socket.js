import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import { env } from '../config/env.js';

async function socketPlugin(fastify, _opts) {
  // Only bind if fastify server is listening/ready and not in standalone unit test mode
  const io = new Server(fastify.server, {
    cors: {
      origin: env.NODE_ENV === 'development' ? true : env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join:outlet', (outletId) => {
      if (outletId) {
        socket.join(`outlet:${outletId}`);
      }
    });

    socket.on('join:station', (stationId) => {
      if (stationId) {
        socket.join(`station:${stationId}`);
      }
    });
  });

  fastify.decorate('io', io);

  fastify.addHook('onClose', (_instance, done) => {
    io.close();
    done();
  });
}

export const socketIoPlugin = fp(socketPlugin, {
  name: 'socket-io',
});
export default socketIoPlugin;
