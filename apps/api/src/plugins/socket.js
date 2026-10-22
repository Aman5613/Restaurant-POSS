import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { SOCKET_EVENTS } from '@pos/shared';

async function socketPlugin(fastify, _opts) {
  const io = new Server(fastify.server, {
    cors: {
      origin: env.NODE_ENV === 'development' ? true : env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const handshakeAuth = socket.handshake.auth || {};
    const initialOutletId = handshakeAuth.outletId || socket.handshake.query?.outletId;
    const userRole = handshakeAuth.role || socket.handshake.query?.role;

    if (initialOutletId) {
      socket.join(`outlet:${initialOutletId}`);
      if (userRole) {
        socket.join(`outlet:${initialOutletId}:${userRole.toLowerCase()}`);
      }
      if (userRole === 'cook' || userRole === 'manager') {
        socket.join(`outlet:${initialOutletId}:kitchen`);
      }
      if (userRole === 'captain' || userRole === 'biller') {
        socket.join(`outlet:${initialOutletId}:service`);
      }
    }

    // Explicit room subscription
    socket.on(SOCKET_EVENTS.JOIN_OUTLET, ({ outletId, role }) => {
      const targetOutlet = outletId || initialOutletId;
      if (!targetOutlet) return;

      socket.join(`outlet:${targetOutlet}`);
      if (role) {
        socket.join(`outlet:${targetOutlet}:${role.toLowerCase()}`);
        if (role === 'cook' || role === 'manager') {
          socket.join(`outlet:${targetOutlet}:kitchen`);
        }
        if (role === 'captain' || role === 'biller') {
          socket.join(`outlet:${targetOutlet}:service`);
        }
      }
    });

    socket.on('join:station', (stationId) => {
      if (stationId) {
        socket.join(`station:${stationId}`);
      }
    });

    // Kitchen acknowledgment flow
    socket.on(SOCKET_EVENTS.KOT_ACKNOWLEDGE, (data) => {
      const outletId = data.outletId || initialOutletId;
      if (outletId) {
        io.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.KOT_ACKNOWLEDGED, data);
      }
    });

    // Kitchen ready flow (food prepared -> alerts service captains & billers)
    socket.on(SOCKET_EVENTS.KOT_READY, (data) => {
      const outletId = data.outletId || initialOutletId;
      if (outletId) {
        io.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.KOT_READY, data);
        io.to(`outlet:${outletId}:service`).emit(SOCKET_EVENTS.KOT_READY, data);
      }
    });

    // Real-time table updates
    socket.on(SOCKET_EVENTS.TABLE_UPDATED, (data) => {
      const outletId = data.outletId || initialOutletId;
      if (outletId) {
        socket.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.TABLE_UPDATED, data);
      }
    });

    // Instant 86 item out-of-stock toggle
    socket.on(SOCKET_EVENTS.ITEM_86_TOGGLED, (data) => {
      const outletId = data.outletId || initialOutletId;
      if (outletId) {
        socket.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.ITEM_86_TOGGLED, data);
      }
    });
  });

  // Helpers for Fastify controllers
  fastify.decorate('io', io);

  fastify.decorate('emitOutlet', (outletId, event, data) => {
    if (outletId && io) {
      io.to(`outlet:${outletId}`).emit(event, data);
    }
  });

  fastify.decorate('emitKitchen', (outletId, event, data) => {
    if (outletId && io) {
      io.to(`outlet:${outletId}:kitchen`).emit(event, data);
    }
  });

  fastify.decorate('emitService', (outletId, event, data) => {
    if (outletId && io) {
      io.to(`outlet:${outletId}:service`).emit(event, data);
    }
  });

  fastify.addHook('onClose', (_instance, done) => {
    io.close();
    done();
  });
}

export const socketIoPlugin = fp(socketPlugin, {
  name: 'socket-io',
});
export default socketIoPlugin;
