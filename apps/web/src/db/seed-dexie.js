import { db } from './dexie';

export async function seedDexieIfEmpty() {
  const count = await db.menuItems.count();
  if (count > 0) return;

  // Seed default categories
  await db.categories.bulkPut([
    { id: 'cat_1', outletId: 'default', name: 'Starters', sortOrder: 1, isActive: true },
    { id: 'cat_2', outletId: 'default', name: 'Main Course', sortOrder: 2, isActive: true },
    { id: 'cat_3', outletId: 'default', name: 'Breads & Rice', sortOrder: 3, isActive: true },
    { id: 'cat_4', outletId: 'default', name: 'Beverages', sortOrder: 4, isActive: true },
  ]);

  // Seed default items
  await db.menuItems.bulkPut([
    { id: 'it_1', outletId: 'default', categoryId: 'cat_1', name: 'Paneer Tikka', price: 28000, taxRate: 5, isAvailable: true, sortOrder: 1 },
    { id: 'it_2', outletId: 'default', categoryId: 'cat_1', name: 'Crispy Corn', price: 21000, taxRate: 5, isAvailable: true, sortOrder: 2 },
    { id: 'it_3', outletId: 'default', categoryId: 'cat_2', name: 'Paneer Butter Masala', price: 32000, taxRate: 5, isAvailable: true, sortOrder: 1 },
    { id: 'it_4', outletId: 'default', categoryId: 'cat_2', name: 'Butter Chicken', price: 38000, taxRate: 5, isAvailable: true, sortOrder: 2 },
    { id: 'it_5', outletId: 'default', categoryId: 'cat_2', name: 'Dal Makhani', price: 26000, taxRate: 5, isAvailable: true, sortOrder: 3 },
    { id: 'it_6', outletId: 'default', categoryId: 'cat_3', name: 'Butter Naan', price: 4500, taxRate: 5, isAvailable: true, sortOrder: 1 },
    { id: 'it_7', outletId: 'default', categoryId: 'cat_3', name: 'Garlic Naan', price: 6000, taxRate: 5, isAvailable: true, sortOrder: 2 },
    { id: 'it_8', outletId: 'default', categoryId: 'cat_3', name: 'Chicken Biryani', price: 36000, taxRate: 5, isAvailable: true, sortOrder: 3 },
    { id: 'it_9', outletId: 'default', categoryId: 'cat_4', name: 'Mango Lassi', price: 12000, taxRate: 5, isAvailable: true, sortOrder: 1 },
    { id: 'it_10', outletId: 'default', categoryId: 'cat_4', name: 'Fresh Lime Soda', price: 7000, taxRate: 5, isAvailable: true, sortOrder: 2 },
  ]);

  // Seed default tables
  await db.tables.bulkPut([
    { id: 'tbl_1', outletId: 'default', areaId: 'area_1', tableNumber: 'T-01', status: 'VACANT', currentOrderId: null },
    { id: 'tbl_2', outletId: 'default', areaId: 'area_1', tableNumber: 'T-02', status: 'VACANT', currentOrderId: null },
    { id: 'tbl_3', outletId: 'default', areaId: 'area_1', tableNumber: 'T-03', status: 'VACANT', currentOrderId: null },
    { id: 'tbl_4', outletId: 'default', areaId: 'area_1', tableNumber: 'T-04', status: 'VACANT', currentOrderId: null },
    { id: 'tbl_5', outletId: 'default', areaId: 'area_1', tableNumber: 'T-05', status: 'VACANT', currentOrderId: null },
  ]);
}
