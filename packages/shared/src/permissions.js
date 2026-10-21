export const PERMISSIONS = {
  // Outlet & Settings
  OUTLET_VIEW: 'outlet.view',
  OUTLET_UPDATE: 'outlet.update',
  OUTLET_SETTINGS_MANAGE: 'outlet.settings.manage',

  // User & Role Management
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  ROLE_VIEW: 'role.view',
  ROLE_MANAGE: 'role.manage',

  // Menu Management
  MENU_VIEW: 'menu.view',
  MENU_CREATE: 'menu.create',
  MENU_UPDATE: 'menu.update',
  MENU_DELETE: 'menu.delete',
  MENU_TOGGLE_AVAILABILITY: 'menu.toggle_availability',

  // Tables & Floor
  TABLE_VIEW: 'table.view',
  TABLE_MANAGE: 'table.manage',
  TABLE_TRANSFER: 'table.transfer',
  TABLE_MERGE: 'table.merge',

  // Orders
  ORDER_VIEW: 'order.view',
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_CANCEL_BEFORE_KOT: 'order.cancel_before_kot',
  ORDER_CANCEL_AFTER_KOT: 'order.cancel_after_kot', // Requires manager override
  ORDER_DISCOUNT_APPLY: 'order.discount.apply',

  // KOT
  KOT_VIEW: 'kot.view',
  KOT_PRINT: 'kot.print',
  KOT_REPRINT: 'kot.reprint',

  // Billing & Payments
  BILL_VIEW: 'bill.view',
  BILL_GENERATE: 'bill.generate',
  BILL_SPLIT: 'bill.split',
  BILL_DISCOUNT_APPLY: 'bill.discount.apply',
  BILL_VOID: 'bill.void', // Requires manager override
  PAYMENT_COLLECT: 'payment.collect',
  REFUND_PROCESS: 'refund.process',

  // Day & Shift Operations
  DAY_OPEN: 'day.open',
  DAY_CLOSE: 'day.close',
  SHIFT_OPEN: 'shift.open',
  SHIFT_CLOSE: 'shift.close',
  CASH_DRAWER_MANAGE: 'cash.drawer.manage',

  // Customers
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_MANAGE: 'customer.manage',
  CUSTOMER_DUES_COLLECT: 'customer.dues.collect',

  // Reports
  REPORT_VIEW_SALES: 'report.view.sales',
  REPORT_VIEW_FINANCIAL: 'report.view.financial',
  REPORT_VIEW_AUDIT: 'report.view.audit',
  REPORT_EXPORT: 'report.export',

  // Override
  MANAGER_OVERRIDE: 'manager.override',
};

export const PERMISSION_LIST = Object.values(PERMISSIONS);
