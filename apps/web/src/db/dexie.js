import Dexie from 'dexie';

export class PosDatabase extends Dexie {
  constructor() {
    super('RestaurantPosDB');

    this.version(1).stores({
      outlets: 'id, name, isActive',
      users: 'id, name, phone, role, isActive',
      categories: 'id, outletId, name, sortOrder, isActive',
      menuItems: 'id, outletId, categoryId, name, isAvailable, sortOrder',
      tables: 'id, outletId, areaId, tableNumber, status, currentOrderId',
      orders: 'id, outletId, tableId, status, orderType, createdAt, isSynced',
      bills: 'id, outletId, orderId, billNumber, status, createdAt, isSynced',
      printJobs: 'id, outletId, stationId, status, createdAt',
      syncQueue: '++id, action, entity, payload, createdAt, status, retryCount',
    });
  }
}

export const db = new PosDatabase();
