import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/auth-store';
import { usePosStore } from '../stores/pos-store';
import { playKotChime, playReadyChime } from '../lib/sound-effects';
import { SOCKET_EVENTS } from '@pos/shared';

const SOCKET_SERVER_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

let socketInstance = null;

function getDeviceLabel(user) {
  if (typeof window === 'undefined') return 'Web Client';
  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const deviceType = isMobile ? 'Mobile' : 'Desktop';
  const browser = ua.includes('Chrome')
    ? 'Chrome'
    : ua.includes('Safari')
    ? 'Safari'
    : ua.includes('Firefox')
    ? 'Firefox'
    : 'Browser';
  return `${deviceType} - ${browser} (${user?.name || user?.role || 'Staff'})`;
}

export function useSocket() {
  const { user, accessToken } = useAuthStore();
  const {
    updateKotStatus,
    updateTable,
    toggleItemAvailability,
    settleBillAndFreeTable,
    transferTable,
    setPresence,
    setSocketStatus,
    presence,
    socketId: storeSocketId,
  } = usePosStore();

  const [isConnected, setIsConnected] = useState(Boolean(socketInstance?.connected));
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!socketInstance) {
      const deviceName = getDeviceLabel(user);
      socketInstance = io(SOCKET_SERVER_URL, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        auth: {
          token: accessToken,
          outletId: user?.outletId || 'default-outlet',
          role: user?.role || 'counter',
          deviceName,
          userName: user?.name || 'Staff',
        },
      });
    }

    const socket = socketInstance;

    function onConnect() {
      setIsConnected(true);
      setSocketStatus(true, socket.id);
      const currentUser = userRef.current;
      socket.emit(SOCKET_EVENTS.JOIN_OUTLET, {
        outletId: currentUser?.outletId || 'default-outlet',
        role: currentUser?.role || 'counter',
        deviceName: getDeviceLabel(currentUser),
        userName: currentUser?.name || 'Staff',
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setSocketStatus(false, null);
    }

    function onPresenceSync(data) {
      if (data) {
        setPresence(data);
      }
    }

    function onSyncState(data) {
      if (data?.orders && Object.keys(data.orders).length > 0) {
        const store = usePosStore.getState();
        const updatedTables = store.tables.map((t) => {
          const ord = data.orders[t.id];
          if (ord) {
            return {
              ...t,
              status: 'OCCUPIED',
              runningAmount: ord.totalAmount || t.runningAmount,
              guestCount: ord.guestCount || t.guestCount,
              currentOrderId: ord.orderNo || t.currentOrderId,
            };
          }
          return t;
        });
        usePosStore.setState({
          orders: { ...store.orders, ...data.orders },
          tables: updatedTables,
        });
      }
    }

    function onOrderUpdated(data) {
      if (data?.tableId && data?.order) {
        const store = usePosStore.getState();
        const newOrders = { ...store.orders, [data.tableId]: data.order };
        const newTables = store.tables.map((t) => {
          if (t.id === data.tableId) {
            return {
              ...t,
              status: 'OCCUPIED',
              runningAmount: data.order.totalAmount || t.runningAmount,
              guestCount: data.order.guestCount || t.guestCount,
              currentOrderId: data.order.orderNo || t.currentOrderId,
            };
          }
          return t;
        });
        usePosStore.setState({ orders: newOrders, tables: newTables });
      }
    }

    function onTableTransferred(data) {
      if (data?.sourceTableId && data?.targetTableId) {
        transferTable(data.sourceTableId, data.targetTableId);
      }
    }

    function onKotDispatched(data) {
      const currentUser = userRef.current;
      if (currentUser?.role === 'cook' || currentUser?.role === 'manager' || !currentUser?.role) {
        playKotChime();
      }

      const rawKots = data?.createdKots
        ? data.createdKots
        : data?.kot
          ? [data.kot]
          : Array.isArray(data)
            ? data
            : [];

      if (rawKots.length > 0) {
        const store = usePosStore.getState();
        const currentKots = store.kots || [];
        const newKots = rawKots.filter(
          (nk) => !currentKots.some((ck) => (ck.id || ck._id) === (nk.id || nk._id))
        );
        if (newKots.length > 0) {
          const mapped = newKots.map((k) => ({
            id: k._id || k.id,
            kotNo: k.kotNo || k.kot_no,
            orderNo: k.orderNo || k.order_no,
            tableId: k.tableId || k.table_id,
            tableName: k.tableName || k.table_name || 'Table',
            stationId: k.stationId || k.station_id || 'st_1',
            stationName: k.stationName || k.station_name || 'Main Kitchen',
            lines: k.lines || k.items || [],
            items: k.lines || k.items || [],
            status: k.status || 'PENDING',
            createdAt: k.createdAt || new Date().toISOString(),
            timestamp: k.timestamp || Date.now(),
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
      if (
        currentUser?.role === 'captain' ||
        currentUser?.role === 'biller' ||
        currentUser?.role === 'manager'
      ) {
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
    socket.on(SOCKET_EVENTS.PRESENCE_SYNC, onPresenceSync);
    socket.on(SOCKET_EVENTS.SYNC_STATE, onSyncState);
    socket.on(SOCKET_EVENTS.ORDER_UPDATED, onOrderUpdated);
    socket.on(SOCKET_EVENTS.TABLE_TRANSFERRED, onTableTransferred);
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
      socket.off(SOCKET_EVENTS.PRESENCE_SYNC, onPresenceSync);
      socket.off(SOCKET_EVENTS.SYNC_STATE, onSyncState);
      socket.off(SOCKET_EVENTS.ORDER_UPDATED, onOrderUpdated);
      socket.off(SOCKET_EVENTS.TABLE_TRANSFERRED, onTableTransferred);
      socket.off(SOCKET_EVENTS.KOT_DISPATCHED, onKotDispatched);
      socket.off(SOCKET_EVENTS.KOT_ACKNOWLEDGED, onKotAcknowledged);
      socket.off(SOCKET_EVENTS.KOT_READY, onKotReady);
      socket.off(SOCKET_EVENTS.TABLE_UPDATED, onTableUpdated);
      socket.off(SOCKET_EVENTS.ITEM_86_TOGGLED, onItem86Toggled);
      socket.off(SOCKET_EVENTS.BILL_SETTLED, onBillSettled);
    };
  }, [
    user?.outletId,
    user?.role,
    accessToken,
    updateKotStatus,
    updateTable,
    toggleItemAvailability,
    settleBillAndFreeTable,
    transferTable,
    setPresence,
    setSocketStatus,
  ]);

  const broadcastOrder = useCallback(
    (tableId, order) => {
      if (socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.ORDER_UPDATED, {
          tableId,
          order,
          outletId: user?.outletId || 'default-outlet',
        });
      }
    },
    [user?.outletId]
  );

  const broadcastTableTransfer = useCallback(
    (sourceTableId, targetTableId) => {
      if (socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.TABLE_TRANSFERRED, {
          sourceTableId,
          targetTableId,
          outletId: user?.outletId || 'default-outlet',
        });
      }
    },
    [user?.outletId]
  );

  const acknowledgeKot = useCallback(
    (kotId) => {
      if (socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.KOT_ACKNOWLEDGE, {
          kotId,
          outletId: user?.outletId || 'default-outlet',
          acknowledgedBy: user?.name || 'Cook',
        });
      }
      updateKotStatus(kotId, 'PREPARING');
    },
    [user?.outletId, user?.name, updateKotStatus]
  );

  const markKotReady = useCallback(
    (kotId) => {
      if (socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.KOT_READY, {
          kotId,
          outletId: user?.outletId || 'default-outlet',
          readyBy: user?.name || 'Cook',
        });
      }
      updateKotStatus(kotId, 'READY');
    },
    [user?.outletId, user?.name, updateKotStatus]
  );

  const broadcastTableUpdate = useCallback(
    (tableId, updates) => {
      if (socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.TABLE_UPDATED, {
          tableId,
          updates,
          outletId: user?.outletId || 'default-outlet',
        });
      }
      updateTable(tableId, updates);
    },
    [user?.outletId, updateTable]
  );

  const broadcastItem86 = useCallback(
    (itemId, isAvailable) => {
      if (socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.ITEM_86_TOGGLED, {
          itemId,
          isAvailable,
          outletId: user?.outletId || 'default-outlet',
        });
      }
      toggleItemAvailability(itemId);
    },
    [user?.outletId, toggleItemAvailability]
  );

  const broadcastKotDispatch = useCallback(
    (kot) => {
      if (socketInstance && kot) {
        socketInstance.emit(SOCKET_EVENTS.KOT_DISPATCHED, {
          kot,
          createdKots: [kot],
          outletId: user?.outletId || 'default-outlet',
        });
      }
    },
    [user?.outletId]
  );

  return {
    socket: socketInstance,
    isConnected,
    socketId: storeSocketId || socketInstance?.id,
    presence,
    broadcastOrder,
    broadcastTableTransfer,
    broadcastKotDispatch,
    acknowledgeKot,
    markKotReady,
    broadcastTableUpdate,
    broadcastItem86,
  };
}

export default useSocket;
