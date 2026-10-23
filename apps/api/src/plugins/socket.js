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

  // In-memory presence and active state cache per outlet
  const outletPresence = new Map(); // outletId -> Map<socketId, DeviceInfo>
  const outletState = new Map(); // outletId -> { orders: {}, tables: {}, kots: [] }

  function broadcastPresence(outletId) {
    if (!outletId) return;
    const deviceMap = outletPresence.get(outletId);
    const devices = deviceMap ? Array.from(deviceMap.values()) : [];
    io.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.PRESENCE_SYNC, {
      outletId,
      room: `outlet:${outletId}`,
      count: devices.length,
      devices,
    });
  }

  io.on('connection', (socket) => {
    let currentOutletId = null;
    const handshakeAuth = socket.handshake.auth || {};
    const initialOutletId = handshakeAuth.outletId || socket.handshake.query?.outletId;
    const userRole = handshakeAuth.role || socket.handshake.query?.role;
    const deviceName = handshakeAuth.deviceName || socket.handshake.query?.deviceName || 'Terminal';
    const userName = handshakeAuth.userName || socket.handshake.query?.userName || 'Staff';

    function registerDevice(outletId, role, dName, uName) {
      if (!outletId) return;
      currentOutletId = outletId;
      socket.join(`outlet:${outletId}`);
      if (role) {
        socket.join(`outlet:${outletId}:${role.toLowerCase()}`);
        if (role === 'cook' || role === 'manager') socket.join(`outlet:${outletId}:kitchen`);
        if (role === 'captain' || role === 'biller') socket.join(`outlet:${outletId}:service`);
      }

      if (!outletPresence.has(outletId)) {
        outletPresence.set(outletId, new Map());
      }
      outletPresence.get(outletId).set(socket.id, {
        socketId: socket.id,
        deviceName: dName || deviceName,
        userName: uName || userName,
        role: role || userRole || 'staff',
        connectedAt: Date.now(),
      });

      broadcastPresence(outletId);

      // Send cached live state to newly connected/joined device
      if (outletState.has(outletId)) {
        socket.emit(SOCKET_EVENTS.SYNC_STATE, outletState.get(outletId));
      }
    }

    if (initialOutletId) {
      registerDevice(initialOutletId, userRole, deviceName, userName);
    }

    // Explicit room subscription
    socket.on(SOCKET_EVENTS.JOIN_OUTLET, (data = {}) => {
      const targetOutlet = data.outletId || initialOutletId;
      registerDevice(
        targetOutlet,
        data.role || userRole,
        data.deviceName || deviceName,
        data.userName || userName
      );
    });

    socket.on('join:station', (stationId) => {
      if (stationId) {
        socket.join(`station:${stationId}`);
      }
    });

    // Real-time order sync
    socket.on(SOCKET_EVENTS.ORDER_UPDATED, (data = {}) => {
      const outletId = data.outletId || currentOutletId;
      if (!outletId) return;
      if (!outletState.has(outletId)) {
        outletState.set(outletId, { orders: {}, tables: {}, kots: [] });
      }
      const st = outletState.get(outletId);
      if (data.tableId && data.order) {
        st.orders[data.tableId] = data.order;
      }
      socket.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.ORDER_UPDATED, data);
    });

    // Real-time table updates
    socket.on(SOCKET_EVENTS.TABLE_UPDATED, (data = {}) => {
      const outletId = data.outletId || currentOutletId;
      if (!outletId) return;
      if (!outletState.has(outletId)) {
        outletState.set(outletId, { orders: {}, tables: {}, kots: [] });
      }
      const st = outletState.get(outletId);
      if (data.tableId && data.updates) {
        st.tables[data.tableId] = { ...(st.tables[data.tableId] || {}), ...data.updates };
      }
      socket.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.TABLE_UPDATED, data);
    });

    // Real-time table transfer sync
    socket.on(SOCKET_EVENTS.TABLE_TRANSFERRED, (data = {}) => {
      const outletId = data.outletId || currentOutletId;
      if (!outletId) return;
      if (outletState.has(outletId)) {
        const st = outletState.get(outletId);
        if (data.sourceTableId && data.targetTableId && st.orders[data.sourceTableId]) {
          st.orders[data.targetTableId] = {
            ...st.orders[data.sourceTableId],
            tableId: data.targetTableId,
          };
          delete st.orders[data.sourceTableId];
        }
      }
      socket.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.TABLE_TRANSFERRED, data);
    });

    // Real-time bill settlement
    socket.on(SOCKET_EVENTS.BILL_SETTLED, (data = {}) => {
      const outletId = data.outletId || currentOutletId;
      if (!outletId) return;
      if (outletState.has(outletId) && data.tableId) {
        delete outletState.get(outletId).orders[data.tableId];
        delete outletState.get(outletId).tables[data.tableId];
      }
      socket.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.BILL_SETTLED, data);
    });

    // Kitchen dispatch flow
    socket.on(SOCKET_EVENTS.KOT_DISPATCHED, (data = {}) => {
      const outletId = data.outletId || currentOutletId;
      if (!outletId) return;
      if (!outletState.has(outletId)) {
        outletState.set(outletId, { orders: {}, tables: {}, kots: [] });
      }
      if (data.createdKots && Array.isArray(data.createdKots)) {
        outletState.get(outletId).kots.push(...data.createdKots);
      }
      socket.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.KOT_DISPATCHED, data);
    });

    // Kitchen acknowledgment flow
    socket.on(SOCKET_EVENTS.KOT_ACKNOWLEDGE, (data) => {
      const outletId = data.outletId || currentOutletId;
      if (outletId) {
        io.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.KOT_ACKNOWLEDGED, data);
      }
    });

    // Kitchen ready flow
    socket.on(SOCKET_EVENTS.KOT_READY, (data) => {
      const outletId = data.outletId || currentOutletId;
      if (outletId) {
        io.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.KOT_READY, data);
        io.to(`outlet:${outletId}:service`).emit(SOCKET_EVENTS.KOT_READY, data);
      }
    });

    // Instant 86 item out-of-stock toggle
    socket.on(SOCKET_EVENTS.ITEM_86_TOGGLED, (data) => {
      const outletId = data.outletId || currentOutletId;
      if (outletId) {
        socket.to(`outlet:${outletId}`).emit(SOCKET_EVENTS.ITEM_86_TOGGLED, data);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (currentOutletId && outletPresence.has(currentOutletId)) {
        outletPresence.get(currentOutletId).delete(socket.id);
        broadcastPresence(currentOutletId);
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
