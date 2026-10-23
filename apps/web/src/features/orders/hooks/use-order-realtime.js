import { useEffect } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function useOrderRealtime(outletId, onEvent) {
  useEffect(() => {
    if (!outletId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    if (!socket) {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });
    }

    socket.emit('join:outlet', outletId);

    const handleOrderEvent = (data) => {
      if (onEvent) onEvent('order', data);
    };

    const handleKotEvent = (data) => {
      if (onEvent) onEvent('kot', data);
    };

    const handleTableEvent = (data) => {
      if (onEvent) onEvent('table', data);
    };

    socket.on('order:updated', handleOrderEvent);
    socket.on('kot:created', handleKotEvent);
    socket.on('kot:dispatched', handleKotEvent);
    socket.on('table:updated', handleTableEvent);

    return () => {
      socket.off('order:updated', handleOrderEvent);
      socket.off('kot:created', handleKotEvent);
      socket.off('kot:dispatched', handleKotEvent);
      socket.off('table:updated', handleTableEvent);
    };
  }, [outletId, onEvent]);
}
