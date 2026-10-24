import { create } from 'zustand';
import { TABLE_STATUS, KOT_STATUS, ORDER_TYPES } from '@pos/shared';
import { db } from '@/db/dexie';

const INITIAL_TABLES = [
  {
    id: 'tbl_1',
    tableNumber: 'T-01',
    name: 'Table 1',
    areaId: 'area_1',
    capacity: 4,
    status: TABLE_STATUS.VACANT,
    runningAmount: 0,
    elapsedMinutes: 0,
    currentOrderId: null,
  },
  {
    id: 'tbl_2',
    tableNumber: 'T-02',
    name: 'Table 2',
    areaId: 'area_1',
    capacity: 2,
    status: TABLE_STATUS.VACANT,
    runningAmount: 0,
    elapsedMinutes: 0,
    currentOrderId: null,
  },
  {
    id: 'tbl_3',
    tableNumber: 'T-03',
    name: 'Table 3',
    areaId: 'area_1',
    capacity: 6,
    status: TABLE_STATUS.VACANT,
    runningAmount: 0,
    elapsedMinutes: 0,
    currentOrderId: null,
  },
  {
    id: 'tbl_4',
    tableNumber: 'T-04',
    name: 'Table 4',
    areaId: 'area_1',
    capacity: 4,
    status: TABLE_STATUS.VACANT,
    runningAmount: 0,
    elapsedMinutes: 0,
    currentOrderId: null,
  },
  {
    id: 'tbl_5',
    tableNumber: 'T-05',
    name: 'Table 5',
    areaId: 'area_2',
    capacity: 4,
    status: TABLE_STATUS.VACANT,
    runningAmount: 0,
    elapsedMinutes: 0,
    currentOrderId: null,
  },
  {
    id: 'tbl_6',
    tableNumber: 'T-06',
    name: 'Table 6',
    areaId: 'area_2',
    capacity: 8,
    status: TABLE_STATUS.VACANT,
    runningAmount: 0,
    elapsedMinutes: 0,
    currentOrderId: null,
  },
  {
    id: 'tbl_7',
    tableNumber: 'T-07',
    name: 'Table 7',
    areaId: 'area_3',
    capacity: 4,
    status: TABLE_STATUS.VACANT,
    runningAmount: 0,
    elapsedMinutes: 0,
    currentOrderId: null,
  },
  {
    id: 'tbl_8',
    tableNumber: 'T-08',
    name: 'Table 8',
    areaId: 'area_3',
    capacity: 4,
    status: TABLE_STATUS.VACANT,
    runningAmount: 0,
    elapsedMinutes: 0,
    currentOrderId: null,
  },
];

function calculateOrderTotal(lines) {
  return (lines || []).reduce((acc, line) => {
    if (line.status === 'CANCELLED') return acc;
    const addonsTotal = (line.addons || []).reduce((sum, a) => sum + (a.price || 0), 0);
    return acc + (line.unitPrice + addonsTotal) * line.quantity;
  }, 0);
}

function getActiveOutletId() {
  try {
    const raw = localStorage.getItem('resto_pos_auth_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user?.outletId) return parsed.user.outletId;
    }
  } catch {
    // ignore
  }
  return 'default';
}

function getStorageKey(outletId) {
  const oId = outletId || getActiveOutletId();
  return `resto_pos_state_${oId}_v2`;
}

export const INITIAL_AREAS = [
  { id: 'area_1', name: 'Ground Floor AC', code: 'GF-AC', sortOrder: 1 },
  { id: 'area_2', name: 'Terrace Garden', code: 'TERR', sortOrder: 2 },
  { id: 'area_3', name: 'First Floor Family', code: 'FF-FAM', sortOrder: 3 },
];

export const INITIAL_CATEGORIES = [
  { id: 'cat_1', name: 'Starters & Appetizers' },
  { id: 'cat_2', name: 'Curries & Main Course' },
  { id: 'cat_3', name: 'Breads & Rice' },
  { id: 'cat_4', name: 'Desserts & Beverages' },
];

export const INITIAL_MENU_ITEMS = [
  {
    id: 'it_1',
    categoryId: 'cat_1',
    categoryName: 'Starters & Appetizers',
    name: 'Paneer Tikka Angara',
    code: 'STR-01',
    basePrice: 28000,
    isVeg: true,
    isAvailable: true,
    variants: [
      { id: 'v1', name: 'Half (4 pcs)', price: 16000 },
      { id: 'v2', name: 'Full (8 pcs)', price: 28000 },
    ],
    addons: [{ id: 'a1', name: 'Extra Mint Chutney', price: 2000 }],
  },
  {
    id: 'it_2',
    categoryId: 'cat_1',
    categoryName: 'Starters & Appetizers',
    name: 'Chicken Malai Tikka',
    code: 'STR-02',
    basePrice: 34000,
    isVeg: false,
    isAvailable: true,
    variants: [
      { id: 'v3', name: 'Half (4 pcs)', price: 20000 },
      { id: 'v4', name: 'Full (8 pcs)', price: 34000 },
    ],
    addons: [{ id: 'a2', name: 'Rumali Roti (1 pc)', price: 3000 }],
  },
  {
    id: 'it_3',
    categoryId: 'cat_2',
    categoryName: 'Curries & Main Course',
    name: 'Dal Makhani Gold',
    code: 'MAIN-01',
    basePrice: 26000,
    isVeg: true,
    isAvailable: true,
    variants: [],
    addons: [{ id: 'a3', name: 'Extra Butter Dollop', price: 2500 }],
  },
  {
    id: 'it_4',
    categoryId: 'cat_2',
    categoryName: 'Curries & Main Course',
    name: 'Butter Chicken Classic',
    code: 'MAIN-02',
    basePrice: 39000,
    isVeg: false,
    isAvailable: true,
    variants: [
      { id: 'v5', name: 'Boneless', price: 42000 },
      { id: 'v6', name: 'Regular Bone-in', price: 39000 },
    ],
    addons: [],
  },
  {
    id: 'it_5',
    categoryId: 'cat_3',
    categoryName: 'Breads & Rice',
    name: 'Butter Naan',
    code: 'BRD-01',
    basePrice: 6500,
    isVeg: true,
    isAvailable: true,
    variants: [],
    addons: [{ id: 'a4', name: 'Garlic Butter Topping', price: 1500 }],
  },
  {
    id: 'it_6',
    categoryId: 'cat_3',
    categoryName: 'Breads & Rice',
    name: 'Dum Chicken Biryani',
    code: 'BRD-02',
    basePrice: 36000,
    isVeg: false,
    isAvailable: true,
    variants: [],
    addons: [],
  },
  {
    id: 'it_7',
    categoryId: 'cat_4',
    categoryName: 'Desserts & Beverages',
    name: 'Gulab Jamun (2 pcs)',
    code: 'DES-01',
    basePrice: 9000,
    isVeg: true,
    isAvailable: true,
    variants: [],
    addons: [{ id: 'a5', name: 'With Vanilla Ice Cream', price: 4000 }],
  },
  {
    id: 'it_8',
    categoryId: 'cat_4',
    categoryName: 'Desserts & Beverages',
    name: 'Fresh Lime Soda',
    code: 'BEV-01',
    basePrice: 7000,
    isVeg: true,
    isAvailable: true,
    variants: [],
    addons: [],
  },
];

function loadPersistedState(outletId) {
  try {
    const key = getStorageKey(outletId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.tables) {
        return {
          tables: parsed.tables || INITIAL_TABLES,
          areas: parsed.areas?.length ? parsed.areas : INITIAL_AREAS,
          orders: parsed.orders || {},
          kots: parsed.kots || [],
          invoices: parsed.invoices || {},
          dayOps: parsed.dayOps || {
            status: 'OPEN',
            openingFloat: 500000,
            movements: [],
          },
          customers: parsed.customers || [],
          menuItems: parsed.menuItems?.length ? parsed.menuItems : INITIAL_MENU_ITEMS,
          menuCategories: parsed.menuCategories?.length ? parsed.menuCategories : INITIAL_CATEGORIES,
          outlet: parsed.outlet || null,
          kotCounter: parsed.kotCounter || 1,
          orderCounter: parsed.orderCounter || 1,
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    tables: INITIAL_TABLES,
    areas: INITIAL_AREAS,
    orders: {},
    kots: [],
    invoices: {},
    dayOps: {
      status: 'OPEN',
      openingFloat: 500000,
      movements: [],
    },
    customers: [],
    menuItems: INITIAL_MENU_ITEMS,
    menuCategories: INITIAL_CATEGORIES,
    kotCounter: 1,
    orderCounter: 1,
  };
}

function saveState(state) {
  try {
    const key = getStorageKey(state.outlet?.id || state.outlet?.outletId);
    localStorage.setItem(
      key,
      JSON.stringify({
        tables: state.tables,
        areas: state.areas,
        orders: state.orders,
        kots: state.kots,
        invoices: state.invoices,
        dayOps: state.dayOps,
        customers: state.customers,
        menuItems: state.menuItems,
        menuCategories: state.menuCategories,
        outlet: state.outlet,
        kotCounter: state.kotCounter,
        orderCounter: state.orderCounter,
      })
    );
  } catch {
    // Ignore storage errors
  }
}

const loaded = loadPersistedState();

export const usePosStore = create((set, get) => ({
  tables: loaded.tables,
  areas: loaded.areas || INITIAL_AREAS,
  orders: loaded.orders,
  kots: loaded.kots,
  invoices: loaded.invoices,
  dayOps: loaded.dayOps,
  customers: loaded.customers,
  menuItems: loaded.menuItems || INITIAL_MENU_ITEMS,
  menuCategories: loaded.menuCategories || INITIAL_CATEGORIES,
  outlet: loaded.outlet || null,
  kotCounter: loaded.kotCounter,
  orderCounter: loaded.orderCounter,

  // Socket & Multi-device Presence State
  presence: { count: 0, devices: [], room: '' },
  socketId: null,
  isSocketConnected: false,

  setPresence: (presence) => set({ presence }),
  setSocketStatus: (isSocketConnected, socketId) => set({ isSocketConnected, socketId }),

  setOutlet: (outlet) => {
    set((state) => {
      const next = { ...state, outlet };
      saveState(next);
      return next;
    });
  },

  setMenuItems: (items) => {
    set((state) => {
      const next = { ...state, menuItems: items };
      saveState(next);
      return next;
    });
  },

  setMenuCategories: (cats) => {
    set((state) => {
      const next = { ...state, menuCategories: cats };
      saveState(next);
      return next;
    });
  },

  addMenuCategory: (category) => {
    set((state) => {
      const next = { ...state, menuCategories: [...state.menuCategories, category] };
      saveState(next);
      return next;
    });
  },

  updateMenuCategory: (id, updates) => {
    set((state) => {
      const updated = state.menuCategories.map((c) =>
        c.id === id || c._id === id ? { ...c, ...updates } : c
      );
      const next = { ...state, menuCategories: updated };
      saveState(next);
      return next;
    });
  },

  deleteMenuCategory: (id) => {
    set((state) => {
      const filtered = state.menuCategories.filter((c) => c.id !== id && c._id !== id);
      const next = { ...state, menuCategories: filtered };
      saveState(next);
      return next;
    });
  },

  // Tables Management
  setTables: (tables) => {
    set((state) => {
      const next = { ...state, tables };
      saveState(next);
      return next;
    });
  },

  addTable: (table) => {
    set((state) => {
      const next = { ...state, tables: [...state.tables, table] };
      saveState(next);
      return next;
    });
  },

  updateTable: (id, updates) => {
    set((state) => {
      const updated = state.tables.map((t) =>
        t.id === id || t._id === id ? { ...t, ...updates } : t
      );
      const next = { ...state, tables: updated };
      saveState(next);
      return next;
    });
  },

  deleteTable: (id) => {
    set((state) => {
      const filtered = state.tables.filter((t) => t.id !== id && t._id !== id);
      const next = { ...state, tables: filtered };
      saveState(next);
      return next;
    });
  },

  // Areas / Floor Management
  setAreas: (areas) => {
    set((state) => {
      const next = { ...state, areas };
      saveState(next);
      return next;
    });
  },

  addArea: (area) => {
    set((state) => {
      const next = { ...state, areas: [...state.areas, area] };
      saveState(next);
      return next;
    });
  },

  updateArea: (id, updates) => {
    set((state) => {
      const updated = state.areas.map((a) =>
        a.id === id || a._id === id ? { ...a, ...updates } : a
      );
      const next = { ...state, areas: updated };
      saveState(next);
      return next;
    });
  },

  deleteArea: (id) => {
    set((state) => {
      const filtered = state.areas.filter((a) => a.id !== id && a._id !== id);
      const next = { ...state, areas: filtered };
      saveState(next);
      return next;
    });
  },

  addMenuItem: (item) => {
    set((state) => {
      const next = { ...state, menuItems: [item, ...state.menuItems] };
      saveState(next);
      return next;
    });
  },

  updateMenuItem: (id, updates) => {
    set((state) => {
      const updated = state.menuItems.map((it) =>
        it.id === id || it._id === id ? { ...it, ...updates } : it
      );
      const next = { ...state, menuItems: updated };
      saveState(next);
      return next;
    });
  },

  deleteMenuItem: (id) => {
    set((state) => {
      const updated = state.menuItems.filter((it) => it.id !== id && it._id !== id);
      const next = { ...state, menuItems: updated };
      saveState(next);
      return next;
    });
  },

  toggleItemAvailability: (id) => {
    set((state) => {
      const updated = state.menuItems.map((it) =>
        it.id === id || it._id === id ? { ...it, isAvailable: !it.isAvailable } : it
      );
      const next = { ...state, menuItems: updated };
      saveState(next);
      return next;
    });
  },

  // Get active order lines for a table
  getTableOrder: (tableId) => {
    return get().orders[tableId] || null;
  },

  // Update order lines for a specific table
  saveTableOrder: (tableId, { tableName, guestCount, orderType, lines, customerName, customerPhone, deliveryAddress }) => {
    set((state) => {
      const activeTotal = calculateOrderTotal(lines);
      const isOccupied = lines.some((l) => l.status !== 'CANCELLED');
      const orderCounter = state.orderCounter || 1;
      const orderId = state.orders[tableId]?.orderNo || `ORD-${String(orderCounter).padStart(4, '0')}`;
      const nextOrderCounter = state.orders[tableId]?.orderNo ? orderCounter : orderCounter + 1;

      const newOrders = {
        ...state.orders,
        [tableId]: {
          orderNo: orderId,
          tableId,
          tableName,
          guestCount: guestCount || 2,
          orderType: orderType || ORDER_TYPES.DINE_IN,
          lines,
          totalAmount: activeTotal,
          customerName: customerName || state.orders[tableId]?.customerName,
          customerPhone: customerPhone || state.orders[tableId]?.customerPhone,
          deliveryAddress: deliveryAddress || state.orders[tableId]?.deliveryAddress,
          createdAt: state.orders[tableId]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const newTables = state.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            status: isOccupied ? TABLE_STATUS.OCCUPIED : TABLE_STATUS.VACANT,
            runningAmount: activeTotal,
            guestCount: isOccupied ? (guestCount || t.guestCount || 2) : undefined,
            currentOrderId: isOccupied ? orderId : null,
            elapsedMinutes: isOccupied ? (t.elapsedMinutes || 1) : 0,
          };
        }
        return t;
      });

      const next = {
        ...state,
        orders: newOrders,
        tables: newTables,
        orderCounter: nextOrderCounter,
      };
      saveState(next);
      return next;
    });
  },

  // Create real KOT from draft lines and save into kots queue
  sendKotToKitchen: ({ tableId, tableName, orderNo, lines }) => {
    const draftLines = lines.filter((l) => l.status === 'DRAFT' || !l.status);
    if (!draftLines.length) return null;

    let createdKot = null;

    set((state) => {
      const nextKotNo = `KOT-${String(state.kotCounter).padStart(4, '0')}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Determine station based on category/items
      const hasBeverage = draftLines.some((l) => (l.name || '').toLowerCase().includes('chaas') || (l.name || '').toLowerCase().includes('drink'));
      const hasTandoor = draftLines.some((l) => (l.name || '').toLowerCase().includes('naan') || (l.name || '').toLowerCase().includes('tikka'));

      let stationId = 'st_1';
      let stationName = 'Main Kitchen';
      if (hasBeverage && !hasTandoor) {
        stationId = 'st_3';
        stationName = 'Bar & Beverages';
      } else if (hasTandoor) {
        stationId = 'st_2';
        stationName = 'Tandoor & Grill';
      }

      createdKot = {
        id: `kot_${Date.now()}`,
        kotNo: nextKotNo,
        orderNo: orderNo || `ORD-0001`,
        tableId,
        tableName: tableName || 'Counter',
        stationId,
        stationName,
        status: KOT_STATUS.PRINTED,
        createdAt: timeStr,
        timestamp: Date.now(),
        lines: draftLines.map((l) => ({
          name: l.name,
          variant: l.variantName || null,
          quantity: l.quantity,
          notes: l.notes || '',
          addons: (l.addons || []).map((a) => (typeof a === 'string' ? { name: a, price: 0 } : a)),
        })),
      };

      // Add to Dexie printJobs asynchronously
      db.printJobs.put({
        id: createdKot.id,
        outletId: 'default-outlet',
        stationId: createdKot.stationId,
        status: 'COMPLETED',
        createdAt: now.toISOString(),
        payload: createdKot,
      }).catch(() => {});

      const updatedKots = [createdKot, ...state.kots];
      const next = {
        ...state,
        kots: updatedKots,
        kotCounter: state.kotCounter + 1,
      };
      saveState(next);
      return next;
    });

    return createdKot;
  },

  // Update KOT status (e.g. reprint or retry)
  updateKotStatus: (kotId, status, errorMessage = null) => {
    set((state) => {
      const updated = state.kots.map((k) =>
        k.id === kotId ? { ...k, status, errorMessage } : k
      );
      const next = { ...state, kots: updated };
      saveState(next);
      return next;
    });
  },

  // Mark order as BILLED when navigating to bill
  markOrderBilled: (tableId) => {
    set((state) => {
      const newTables = state.tables.map((t) => {
        if (t.id === tableId) {
          return { ...t, status: TABLE_STATUS.BILLED };
        }
        return t;
      });
      const next = { ...state, tables: newTables };
      saveState(next);
      return next;
    });
  },

  // Transfer active table to vacant destination table
  transferTable: (sourceTableId, targetTableId) => {
    set((state) => {
      const sourceTable = state.tables.find(
        (t) => t.id === sourceTableId || t._id === sourceTableId
      );
      const targetTable = state.tables.find(
        (t) => t.id === targetTableId || t._id === targetTableId
      );
      if (!sourceTable || !targetTable) return state;

      const sId = sourceTable.id || sourceTable._id;
      const tId = targetTable.id || targetTable._id;

      // 1. Move active order from source to target
      const newOrders = { ...state.orders };
      const sourceOrder = newOrders[sId];

      if (sourceOrder) {
        newOrders[tId] = {
          ...sourceOrder,
          tableId: tId,
          tableName: targetTable.name,
          updatedAt: new Date().toISOString(),
        };
        delete newOrders[sId];
      }

      // 2. Update active KOTs pointing to source table
      const updatedKots = state.kots.map((k) => {
        if (k.tableId === sId) {
          return {
            ...k,
            tableId: tId,
            tableName: targetTable.name,
          };
        }
        return k;
      });

      // 3. Update tables status and values
      const updatedTables = state.tables.map((t) => {
        const curId = t.id || t._id;
        if (curId === tId) {
          return {
            ...t,
            status: sourceTable.status,
            runningAmount: sourceTable.runningAmount || 0,
            elapsedMinutes: sourceTable.elapsedMinutes || 1,
            guestCount: sourceTable.guestCount,
            captainName: sourceTable.captainName,
            currentOrderId: sourceTable.currentOrderId,
          };
        }
        if (curId === sId) {
          return {
            ...t,
            status: TABLE_STATUS.VACANT,
            runningAmount: 0,
            elapsedMinutes: 0,
            guestCount: undefined,
            captainName: undefined,
            currentOrderId: null,
          };
        }
        return t;
      });

      const next = {
        ...state,
        orders: newOrders,
        tables: updatedTables,
        kots: updatedKots,
      };
      saveState(next);
      return next;
    });
  },

  // Settle bill and free the table
  settleBillAndFreeTable: (tableId, invoiceData) => {
    set((state) => {
      const activeOutlet = invoiceData.outlet || state.outlet;
      const enrichedInvoice = {
        ...invoiceData,
        outlet: activeOutlet || undefined,
        outletName: invoiceData.outletName || activeOutlet?.name || undefined,
        legalName: invoiceData.legalName || activeOutlet?.legalName || undefined,
        gstin: invoiceData.gstin || activeOutlet?.gstin || undefined,
        fssai: invoiceData.fssai || activeOutlet?.fssaiNumber || activeOutlet?.fssai || undefined,
        phone: invoiceData.phone || activeOutlet?.phone || undefined,
        email: invoiceData.email || activeOutlet?.email || undefined,
        address: invoiceData.address || activeOutlet?.address || undefined,
        upiId: invoiceData.upiId || activeOutlet?.upiId || undefined,
      };

      // 1. Save settled invoice
      const newInvoices = {
        ...state.invoices,
        [invoiceData.invoiceNo]: enrichedInvoice,
      };

      // 2. Free the table (mark VACANT, reset runningAmount, reset order)
      const newTables = state.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            status: TABLE_STATUS.VACANT,
            runningAmount: 0,
            elapsedMinutes: 0,
            guestCount: undefined,
            captainName: undefined,
            currentOrderId: null,
          };
        }
        return t;
      });

      // 3. Clear active order for that table
      const newOrders = { ...state.orders };
      delete newOrders[tableId];

      // 4. Update or add customer if phone was provided
      const updatedCustomers = [...state.customers];
      if (invoiceData.customerPhone && invoiceData.customerPhone.trim()) {
        const phone = invoiceData.customerPhone.trim();
        const existingIdx = updatedCustomers.findIndex((c) => c.phone === phone);
        const amountPaise = invoiceData.grandTotal || 0;

        if (existingIdx >= 0) {
          const c = updatedCustomers[existingIdx];
          updatedCustomers[existingIdx] = {
            ...c,
            name: invoiceData.customerName || c.name,
            totalSpentPaise: (c.totalSpentPaise || 0) + amountPaise,
            visitsCount: (c.visitsCount || 1) + 1,
            lastVisitAt: new Date().toISOString(),
          };
        } else {
          updatedCustomers.unshift({
            id: `cust_${Date.now()}`,
            name: invoiceData.customerName || 'Guest Customer',
            phone,
            email: '',
            gstin: '',
            totalSpentPaise: amountPaise,
            visitsCount: 1,
            outstandingDuePaise: 0,
            lastVisitAt: new Date().toISOString(),
          });
        }
      }

      const next = {
        ...state,
        tables: newTables,
        orders: newOrders,
        invoices: newInvoices,
        customers: updatedCustomers,
      };
      saveState(next);
      return next;
    });
  },

  // Day Ops: Record cash movement (Cash In / Out / Drop)
  recordCashMovement: ({ type, amountPaise, reason }) => {
    set((state) => {
      const movement = {
        id: `mov_${Date.now()}`,
        type,
        amount: amountPaise,
        reason,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedDayOps = {
        ...state.dayOps,
        movements: [movement, ...(state.dayOps.movements || [])],
      };

      const next = { ...state, dayOps: updatedDayOps };
      saveState(next);
      return next;
    });
  },

  // Day Ops: Close business day
  closeDay: () => {
    set((state) => {
      const updatedDayOps = {
        ...state.dayOps,
        status: 'CLOSED',
        closedAt: new Date().toISOString(),
      };
      const next = { ...state, dayOps: updatedDayOps };
      saveState(next);
      return next;
    });
  },

  // Day Ops: Open business day
  openDay: (openingFloatPaise = 500000) => {
    set((state) => {
      const updatedDayOps = {
        status: 'OPEN',
        openingFloat: openingFloatPaise,
        openedAt: new Date().toISOString(),
        movements: [],
      };
      const next = { ...state, dayOps: updatedDayOps };
      saveState(next);
      return next;
    });
  },

  // Customers: Add or update customer
  saveCustomer: (custData) => {
    set((state) => {
      const existingIdx = state.customers.findIndex(
        (c) => (custData.id && c.id === custData.id) || (custData.phone && c.phone === custData.phone)
      );

      let updated;
      if (existingIdx >= 0) {
        updated = [...state.customers];
        updated[existingIdx] = { ...updated[existingIdx], ...custData };
      } else {
        const newCust = {
          id: custData.id || `cust_${Date.now()}`,
          name: custData.name,
          phone: custData.phone,
          email: custData.email || '',
          gstin: custData.gstin || '',
          address: custData.address || '',
          totalSpentPaise: custData.totalSpentPaise || 0,
          visitsCount: custData.visitsCount || 1,
          outstandingDuePaise: custData.outstandingDuePaise || 0,
          lastVisitAt: new Date().toISOString(),
        };
        updated = [newCust, ...state.customers];
      }

      const next = { ...state, customers: updated };
      saveState(next);
      return next;
    });
  },

  // Customers: Collect due payment
  collectCustomerDue: (customerId, amountPaise) => {
    set((state) => {
      const updated = state.customers.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            outstandingDuePaise: Math.max(0, (c.outstandingDuePaise || 0) - amountPaise),
          };
        }
        return c;
      });
      const next = { ...state, customers: updated };
      saveState(next);
      return next;
    });
  },

  // Get invoice by number
  getInvoice: (invoiceNo) => {
    return get().invoices[invoiceNo] || null;
  },

  // Clear / reset all data
  resetAllData: () => {
    const next = {
      tables: INITIAL_TABLES,
      orders: {},
      kots: [],
      invoices: {},
      dayOps: { status: 'OPEN', openingFloat: 500000, movements: [] },
      customers: [],
      kotCounter: 1,
      orderCounter: 1,
    };
    saveState(next);
    set(next);
  },

  // Multi-outlet data isolation: switch state per outlet
  switchOutlet: (outletId) => {
    const loadedState = loadPersistedState(outletId);
    set(loadedState);
  },
}));
