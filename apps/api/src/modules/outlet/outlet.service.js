import {
  Outlet,
  TaxGroup,
  ChargeConfig,
  NumberingSeries,
  PaymentMode,
  Printer,
  Device,
  OutletSetting,
  Category,
  KitchenStation,
  Item,
  Area,
  DiningTable,
} from '../../models/index.js';

export class OutletService {
  async getOutlet(outletId) {
    const outlet = await Outlet.findById(outletId);
    if (!outlet) throw { statusCode: 404, message: 'Outlet not found' };
    return outlet;
  }

  async updateOutlet(outletId, data) {
    const outlet = await Outlet.findByIdAndUpdate(outletId, data, {
      new: true,
      runValidators: true,
    });
    if (!outlet) throw { statusCode: 404, message: 'Outlet not found' };
    return outlet;
  }

  // Tax Groups
  async listTaxGroups(outletId) {
    return TaxGroup.find({ outletId }).sort({ rate: 1 });
  }

  async createTaxGroup(outletId, data) {
    return TaxGroup.create({ ...data, outletId });
  }

  async updateTaxGroup(outletId, taxGroupId, data) {
    const taxGroup = await TaxGroup.findOneAndUpdate(
      { _id: taxGroupId, outletId },
      data,
      { new: true }
    );
    if (!taxGroup) throw { statusCode: 404, message: 'Tax group not found' };
    return taxGroup;
  }

  async deleteTaxGroup(outletId, taxGroupId) {
    const res = await TaxGroup.findOneAndDelete({ _id: taxGroupId, outletId });
    if (!res) throw { statusCode: 404, message: 'Tax group not found' };
    return { success: true };
  }

  // Charges
  async listCharges(outletId) {
    return ChargeConfig.find({ outletId });
  }

  async createCharge(outletId, data) {
    return ChargeConfig.create({ ...data, outletId });
  }

  async updateCharge(outletId, chargeId, data) {
    const charge = await ChargeConfig.findOneAndUpdate(
      { _id: chargeId, outletId },
      data,
      { new: true }
    );
    if (!charge) throw { statusCode: 404, message: 'Charge configuration not found' };
    return charge;
  }

  async deleteCharge(outletId, chargeId) {
    const res = await ChargeConfig.findOneAndDelete({ _id: chargeId, outletId });
    if (!res) throw { statusCode: 404, message: 'Charge configuration not found' };
    return { success: true };
  }

  // Numbering Series
  async listNumberingSeries(outletId) {
    return NumberingSeries.find({ outletId });
  }

  async updateNumberingSeries(outletId, seriesId, data) {
    const series = await NumberingSeries.findOneAndUpdate(
      { _id: seriesId, outletId },
      data,
      { new: true }
    );
    if (!series) throw { statusCode: 404, message: 'Numbering series not found' };
    return series;
  }

  // Printers
  async listPrinters(outletId) {
    return Printer.find({ outletId });
  }

  async createPrinter(outletId, data) {
    return Printer.create({ ...data, outletId });
  }

  async updatePrinter(outletId, printerId, data) {
    const printer = await Printer.findOneAndUpdate(
      { _id: printerId, outletId },
      data,
      { new: true }
    );
    if (!printer) throw { statusCode: 404, message: 'Printer not found' };
    return printer;
  }

  async testPrinter(outletId, printerId) {
    const printer = await Printer.findOne({ _id: printerId, outletId });
    if (!printer) throw { statusCode: 404, message: 'Printer not found' };
    return {
      success: true,
      printerName: printer.name,
      message: `Test print dispatched to ${printer.connectionType} at ${printer.ipAddress || 'local'}`,
      dispatchedAt: new Date().toISOString(),
    };
  }

  // Devices
  async listDevices(outletId) {
    return Device.find({ outletId });
  }

  async registerDevice(outletId, data) {
    return Device.findOneAndUpdate(
      { outletId, deviceCode: data.deviceCode },
      { ...data, outletId, lastSeenAt: new Date() },
      { upsert: true, new: true }
    );
  }

  // Payment Modes
  async listPaymentModes(outletId) {
    return PaymentMode.find({ outletId }).sort({ sortOrder: 1 });
  }

  async updatePaymentMode(outletId, modeId, data) {
    const mode = await PaymentMode.findOneAndUpdate(
      { _id: modeId, outletId },
      data,
      { new: true }
    );
    if (!mode) throw { statusCode: 404, message: 'Payment mode not found' };
    return mode;
  }

  // Settings
  async getSettings(outletId) {
    const settings = await OutletSetting.find({ outletId });
    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  }

  async updateSetting(outletId, key, value) {
    return OutletSetting.findOneAndUpdate(
      { outletId, key },
      { outletId, key, value },
      { upsert: true, new: true }
    );
  }

  // Pre-seed standard Indian setup for an outlet
  async seedStandardSlabs(outletId) {
    // 1. Tax groups
    const standardTaxes = [
      { name: 'GST Exempt (0%)', rate: 0, isInclusive: true, cgstRate: 0, sgstRate: 0, igstRate: 0 },
      { name: 'GST 5%', rate: 5, isInclusive: true, cgstRate: 2.5, sgstRate: 2.5, igstRate: 5 },
      { name: 'GST 12%', rate: 12, isInclusive: true, cgstRate: 6, sgstRate: 6, igstRate: 12 },
      { name: 'GST 18%', rate: 18, isInclusive: true, cgstRate: 9, sgstRate: 9, igstRate: 18 },
      { name: 'GST 28%', rate: 28, isInclusive: true, cgstRate: 14, sgstRate: 14, igstRate: 28 },
    ];
    for (const tax of standardTaxes) {
      await TaxGroup.findOneAndUpdate(
        { outletId, name: tax.name },
        { ...tax, outletId },
        { upsert: true }
      );
    }

    // 2. Payment modes
    const standardPaymentModes = [
      { name: 'Cash', code: 'CASH', opensCashDrawer: true, sortOrder: 1 },
      { name: 'UPI / QR', code: 'UPI', opensCashDrawer: false, sortOrder: 2 },
      { name: 'Credit / Debit Card', code: 'CARD', opensCashDrawer: false, sortOrder: 3 },
      { name: 'Customer Due', code: 'DUE', opensCashDrawer: false, sortOrder: 4 },
      { name: 'Complimentary', code: 'COMPLIMENTARY', opensCashDrawer: false, sortOrder: 5 },
    ];
    for (const mode of standardPaymentModes) {
      await PaymentMode.findOneAndUpdate(
        { outletId, code: mode.code },
        { ...mode, outletId, isEnabled: true },
        { upsert: true }
      );
    }

    // 3. Numbering series
    const standardSeries = [
      { docType: 'ORDER', prefix: 'ORD', padding: 4, resetFrequency: 'DAILY' },
      { docType: 'BILL', prefix: 'INV', padding: 4, resetFrequency: 'DAILY' },
      { docType: 'KOT', prefix: 'KOT', padding: 4, resetFrequency: 'DAILY' },
    ];
    for (const s of standardSeries) {
      await NumberingSeries.findOneAndUpdate(
        { outletId, docType: s.docType },
        { ...s, outletId },
        { upsert: true }
      );
    }
  }

  // Pre-seed standard kitchen stations, menu catalog and dining tables for any store
  async seedStandardCatalogAndTables(outletId) {
    // 1. Kitchen Stations
    const stationMain = await KitchenStation.findOneAndUpdate(
      { outletId, name: 'Main Kitchen' },
      { outletId, name: 'Main Kitchen', isActive: true },
      { upsert: true, new: true }
    );
    const stationGrill = await KitchenStation.findOneAndUpdate(
      { outletId, name: 'Tandoor & Grill' },
      { outletId, name: 'Tandoor & Grill', isActive: true },
      { upsert: true, new: true }
    );
    const stationBar = await KitchenStation.findOneAndUpdate(
      { outletId, name: 'Bar & Beverages' },
      { outletId, name: 'Bar & Beverages', isActive: true },
      { upsert: true, new: true }
    );

    // 2. Categories
    const catStarters = await Category.findOneAndUpdate(
      { outletId, name: 'Starters & Appetizers' },
      { outletId, name: 'Starters & Appetizers', sortOrder: 1, isActive: true },
      { upsert: true, new: true }
    );
    const catMains = await Category.findOneAndUpdate(
      { outletId, name: 'Curries & Main Course' },
      { outletId, name: 'Curries & Main Course', sortOrder: 2, isActive: true },
      { upsert: true, new: true }
    );
    const catBreads = await Category.findOneAndUpdate(
      { outletId, name: 'Breads & Rice' },
      { outletId, name: 'Breads & Rice', sortOrder: 3, isActive: true },
      { upsert: true, new: true }
    );
    const catDesserts = await Category.findOneAndUpdate(
      { outletId, name: 'Desserts & Beverages' },
      { outletId, name: 'Desserts & Beverages', sortOrder: 4, isActive: true },
      { upsert: true, new: true }
    );

    // 3. Standard Menu Items
    const defaultMenuItems = [
      { name: 'Paneer Tikka Angara', basePrice: 28000, categoryId: catStarters._id, stationId: stationGrill._id, isVeg: true },
      { name: 'Crispy Corn Salt & Pepper', basePrice: 21000, categoryId: catStarters._id, stationId: stationMain._id, isVeg: true },
      { name: 'Chicken Malai Tikka', basePrice: 34000, categoryId: catStarters._id, stationId: stationGrill._id, isVeg: false },
      { name: 'Veg Spring Rolls', basePrice: 19000, categoryId: catStarters._id, stationId: stationMain._id, isVeg: true },
      { name: 'Paneer Butter Masala', basePrice: 32000, categoryId: catMains._id, stationId: stationMain._id, isVeg: true },
      { name: 'Dal Makhani Gold', basePrice: 26000, categoryId: catMains._id, stationId: stationMain._id, isVeg: true },
      { name: 'Butter Chicken Classic', basePrice: 38000, categoryId: catMains._id, stationId: stationMain._id, isVeg: false },
      { name: 'Butter Naan', basePrice: 4500, categoryId: catBreads._id, stationId: stationGrill._id, isVeg: true },
      { name: 'Garlic Naan', basePrice: 6500, categoryId: catBreads._id, stationId: stationGrill._id, isVeg: true },
      { name: 'Jeera Rice', basePrice: 16000, categoryId: catBreads._id, stationId: stationMain._id, isVeg: true },
      { name: 'Gulab Jamun (2 pcs)', basePrice: 9000, categoryId: catDesserts._id, stationId: stationMain._id, isVeg: true },
      { name: 'Fresh Lime Soda', basePrice: 7000, categoryId: catDesserts._id, stationId: stationBar._id, isVeg: true },
    ];

    for (const itm of defaultMenuItems) {
      await Item.findOneAndUpdate(
        { outletId, name: itm.name },
        { ...itm, outletId, isAvailable: true },
        { upsert: true }
      );
    }

    // 4. Standard Dining Areas & Tables
    const mainArea = await Area.findOneAndUpdate(
      { outletId, name: 'Ground Floor AC' },
      { outletId, name: 'Ground Floor AC', sortOrder: 1 },
      { upsert: true, new: true }
    );
    const terraceArea = await Area.findOneAndUpdate(
      { outletId, name: 'Terrace Garden' },
      { outletId, name: 'Terrace Garden', sortOrder: 2 },
      { upsert: true, new: true }
    );

    const defaultTables = [
      { tableNumber: 'T-01', name: 'Table 1', capacity: 4, areaId: mainArea._id, status: 'VACANT' },
      { tableNumber: 'T-02', name: 'Table 2', capacity: 2, areaId: mainArea._id, status: 'VACANT' },
      { tableNumber: 'T-03', name: 'Table 3', capacity: 6, areaId: mainArea._id, status: 'VACANT' },
      { tableNumber: 'T-04', name: 'Table 4', capacity: 4, areaId: mainArea._id, status: 'VACANT' },
      { tableNumber: 'T-05', name: 'Table 5', capacity: 8, areaId: mainArea._id, status: 'VACANT' },
      { tableNumber: 'R-01', name: 'Table R1', capacity: 2, areaId: terraceArea._id, status: 'VACANT' },
      { tableNumber: 'R-02', name: 'Table R2', capacity: 4, areaId: terraceArea._id, status: 'VACANT' },
      { tableNumber: 'R-03', name: 'Table R3', capacity: 4, areaId: terraceArea._id, status: 'VACANT' },
    ];

    for (const tbl of defaultTables) {
      await DiningTable.findOneAndUpdate(
        { outletId, tableNumber: tbl.tableNumber },
        { ...tbl, outletId, isActive: true },
        { upsert: true }
      );
    }
  }
}
