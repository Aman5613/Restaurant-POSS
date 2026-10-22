import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/auth-store';
import { usePosStore } from '../stores/pos-store';
import { playKotChime, playReadyChime } from '../lib/sound-effects';
import { SOCKET_EVENTS } from '@pos/shared';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

let socketInstance = null;

export function useSocket() {
  const { user, accessToken } = useAuthStore();
  const {
    updateKotStatus,
    updateTable,
    toggleItemAvailability,
    settleBillAndFreeTable,
  } = usePosStore();

  const [isConnected, setIsConnected] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_SERVER_URL, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        auth: {
          token: accessToken,
          outletId: user?.outletId || 'default-outlet',
          role: user?.role || 'counter',
        },
      });
    }

    const socket = socketInstance;

    function onConnect() {
      setIsConnected(true);
      const currentUser = userRef.current;
      socket.emit(SOCKET_EVENTS.JOIN_OUTLET, {
        outletId: currentUser?.outletId || 'default-outlet',
        role: currentUser?.role || 'counter',
      });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onKotDispatched(data) {
      const currentUser = userRef.current;
      // Play cook audio chime when KOT arrives
      if (currentUser?.role === 'cook' || currentUser?.role === 'manager') {
        playKotChime();
      }

      // Add to KOT store if createdKots array is present
      if (data?.createdKots && Array.isArray(data.createdKots)) {
        const store = usePosStore.getState();
        const currentKots = store.kots || [];
        const newKots = data.createdKots.filter(
          (nk) => !currentKots.some((ck) => ck.id === (nk._id || nk.id))
        );
        if (newKots.length > 0) {
          const mapped = newKots.map((k) => ({
            id: k._id || k.id,
            kotNo: k.kot_no,
            orderNo: k.order_no,
            tableId: k.table_id,
            tableName: k.table_name,
            stationId: k.station_id,
            stationName: k.station_name,
            lines: k.lines || [],
            items: k.lines || [],
            status: k.status || 'PENDING',
            createdAt: k.createdAt || new Date().toISOString(),
          }));
          usePosStore.setState({ kots: [...mapped, ...currentKots] });
        }
      }
    }

    function onKotAcknowledged(data) {
      if (data?.kotId) {
        updateKotStatus(data.kotId, 'PREPARING');
      }
    }

    function onKotReady(data) {
      if (data?.kotId) {
        updateKotStatus(data.kotId, 'READY');
      }
      const currentUser = userRef.current;
      // Captains & Billers hear ready tone
      if (currentUser?.role === 'captain' || currentUser?.role === 'biller' || currentUser?.role === 'manager') {
        playReadyChime();
      }
    }

    function onTableUpdated(data) {
      if (data?.tableId) {
        updateTable(data.tableId, data.updates || data);
      }
    }

    function onItem86Toggled(data) {
      if (data?.itemId) {
        toggleItemAvailability(data.itemId);
      }
    }

    function onBillSettled(data) {
      if (data?.tableId && data?.invoice) {
        settleBillAndFreeTable(data.tableId, data.invoice);
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.KOT_DISPATCHED, onKotDispatched);
    socket.on(SOCKET_EVENTS.KOT_ACKNOWLEDGED, onKotAcknowledged);
    socket.on(SOCKET_EVENTS.KOT_READY, onKotReady);
    socket.on(SOCKET_EVENTS.TABLE_UPDATED, onTableUpdated);
    socket.on(SOCKET_EVENTS.ITEM_86_TOGGLED, onItem86Toggled);
    socket.on(SOCKET_EVENTS.BILL_SETTLED, onBillSettled);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_EVENTS.KOT_DISPATCHED, onKotDispatched);
      socket.off(SOCKET_EVENTS.KOT_ACKNOWLEDGED, onKotAcknowledged);
      socket.off(SOCKET_EVENTS.KOT_READY, onKotReady);
      socket.off(SOCKET_EVENTS.TABLE_UPDATED, onTableUpdated);
      socket.off(SOCKET_EVENTS.ITEM_86_TOGGLED, onItem86Toggled);
      socket.off(SOCKET_EVENTS.BILL_SETTLED, onBillSettled);
    };
  }, [user?.outletId, user?.role, accessToken, updateKotStatus, updateTable, toggleItemAvailability, settleBillAndFreeTable]);

  const acknowledgeKot = useCallback((kotId) => {
    if (socketInstance) {
      socketInstance.emit(SOCKET_EVENTS.KOT_ACKNOWLEDGE, {
        kotId,
        outletId: user?.outletId || 'default-outlet',
        acknowledgedBy: user?.name || 'Cook',
      });
    }
    updateKotStatus(kotId, 'PREPARING');
  }, [user?.outletId, user?.name, updateKotStatus]);

  const markKotReady = useCallback((kotId) => {
    if (socketInstance) {
      socketInstance.emit(SOCKET_EVENTS.KOT_READY, {
        kotId,
        outletId: user?.outletId || 'default-outlet',
        readyBy: user?.name || 'Cook',
      });
    }
    updateKotStatus(kotId, 'READY');
  }, [user?.outletId, user?.name, updateKotStatus]);

  const broadcastTableUpdate = useCallback((tableId, updates) => {
    if (socketInstance) {
      socketInstance.emit(SOCKET_EVENTS.TABLE_UPDATED, {
        tableId,
        updates,
        outletId: user?.outletId || 'default-outlet',
      });
    }
    updateTable(tableId, updates);
  }, [user?.outletId, updateTable]);

  const broadcastItem86 = useCallback((itemId, isAvailable) => {
    if (socketInstance) {
      socketInstance.emit(SOCKET_EVENTS.ITEM_86_TOGGLED, {
        itemId,
        isAvailable,
        outletId: user?.outletId || 'default-outlet',
      });
    }
    toggleItemAvailability(itemId);
  }, [user?.outletId, toggleItemAvailability]);

  return {
    socket: socketInstance,
    isConnected,
    acknowledgeKot,
    markKotReady,
    broadcastTableUpdate,
    broadcastItem86,
  };
}

export default useSocket;
