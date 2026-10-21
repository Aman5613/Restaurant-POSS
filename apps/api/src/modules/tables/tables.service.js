import { Area, DiningTable, TableSession } from '../../models/index.js';
import { TABLE_STATUS } from '@pos/shared';

export class TablesService {
  // Areas
  async listAreas(outletId) {
    return Area.find({ outletId }).sort({ sortOrder: 1, name: 1 });
  }

  async createArea(outletId, data) {
    return Area.create({ ...data, outletId });
  }

  async updateArea(outletId, areaId, data) {
    const area = await Area.findOneAndUpdate({ _id: areaId, outletId }, data, { new: true });
    if (!area) throw { statusCode: 404, message: 'Area not found' };
    return area;
  }

  async deleteArea(outletId, areaId) {
    const tableCount = await DiningTable.countDocuments({ outletId, areaId });
    if (tableCount > 0) {
      throw {
        statusCode: 400,
        message: `Cannot delete area with ${tableCount} existing table(s)`,
      };
    }
    const res = await Area.findOneAndDelete({ _id: areaId, outletId });
    if (!res) throw { statusCode: 404, message: 'Area not found' };
    return { success: true };
  }

  // Dining Tables
  async listTables(outletId, { areaId, status } = {}) {
    const query = { outletId, isActive: true };
    if (areaId) query.areaId = areaId;
    if (status) query.status = status;

    return DiningTable.find(query)
      .populate('areaId', 'name')
      .populate('currentOrderId')
      .sort({ sortOrder: 1, tableNumber: 1 });
  }

  async getTable(outletId, tableId) {
    const table = await DiningTable.findOne({ _id: tableId, outletId })
      .populate('areaId', 'name')
      .populate('currentOrderId');
    if (!table) throw { statusCode: 404, message: 'Table not found' };
    return table;
  }

  async createTable(outletId, data) {
    return DiningTable.create({ ...data, outletId });
  }

  async updateTable(outletId, tableId, data) {
    const table = await DiningTable.findOneAndUpdate(
      { _id: tableId, outletId },
      data,
      { new: true }
    );
    if (!table) throw { statusCode: 404, message: 'Table not found' };
    return table;
  }

  async updateTableStatus(outletId, tableId, { status, guestCount, currentOrderId }) {
    const table = await DiningTable.findOne({ _id: tableId, outletId });
    if (!table) throw { statusCode: 404, message: 'Table not found' };

    table.status = status;
    if (status === TABLE_STATUS.OCCUPIED) {
      table.openedAt = table.openedAt || new Date();
      if (guestCount) table.currentGuestCount = guestCount;
      if (currentOrderId) table.currentOrderId = currentOrderId;

      await TableSession.create({
        tableId: table._id,
        outletId,
        orderId: currentOrderId,
        guestCount: table.currentGuestCount || 1,
        openedAt: new Date(),
      });
    } else if (status === TABLE_STATUS.VACANT) {
      // Close session
      await TableSession.updateMany(
        { tableId: table._id, closedAt: null },
        { closedAt: new Date() }
      );
      table.currentOrderId = null;
      table.currentGuestCount = 0;
      table.openedAt = null;
    }

    await table.save();
    return table;
  }

  async transferTable(outletId, { sourceTableId, targetTableId, reason: _reason }) {
    const [source, target] = await Promise.all([
      DiningTable.findOne({ _id: sourceTableId, outletId }),
      DiningTable.findOne({ _id: targetTableId, outletId }),
    ]);

    if (!source || !target) {
      throw { statusCode: 404, message: 'Source or target table not found' };
    }

    if (target.status !== TABLE_STATUS.VACANT) {
      throw { statusCode: 400, message: `Target table ${target.tableNumber} is not vacant` };
    }

    // Move state to target
    target.status = source.status;
    target.currentOrderId = source.currentOrderId;
    target.currentGuestCount = source.currentGuestCount;
    target.openedAt = source.openedAt;
    await target.save();

    // Reset source
    source.status = TABLE_STATUS.VACANT;
    source.currentOrderId = null;
    source.currentGuestCount = 0;
    source.openedAt = null;
    await source.save();

    return { success: true, source, target };
  }

  async mergeTables(outletId, { primaryTableId, secondaryTableIds }) {
    const primary = await DiningTable.findOne({ _id: primaryTableId, outletId });
    if (!primary) throw { statusCode: 404, message: 'Primary table not found' };

    for (const secId of secondaryTableIds) {
      await DiningTable.findOneAndUpdate(
        { _id: secId, outletId },
        { status: TABLE_STATUS.OCCUPIED, currentOrderId: primary.currentOrderId }
      );
    }

    return { success: true, primaryTable: primary };
  }

  async deleteTable(outletId, tableId) {
    const table = await DiningTable.findOne({ _id: tableId, outletId });
    if (!table) throw { statusCode: 404, message: 'Table not found' };
    if (table.status !== TABLE_STATUS.VACANT) {
      throw { statusCode: 400, message: 'Cannot delete an active non-vacant table' };
    }
    await DiningTable.findByIdAndDelete(tableId);
    return { success: true };
  }

  // Pre-seed standard floor layout with areas and tables
  async seedDemoTables(outletId) {
    const acHall = await Area.findOneAndUpdate(
      { outletId, name: 'Ground Floor AC Dining' },
      { outletId, name: 'Ground Floor AC Dining', sortOrder: 1 },
      { upsert: true, new: true }
    );
    const rooftop = await Area.findOneAndUpdate(
      { outletId, name: 'Rooftop Terrace' },
      { outletId, name: 'Rooftop Terrace', sortOrder: 2 },
      { upsert: true, new: true }
    );
    const barArea = await Area.findOneAndUpdate(
      { outletId, name: 'Lounge & Bar' },
      { outletId, name: 'Lounge & Bar', sortOrder: 3 },
      { upsert: true, new: true }
    );

    // AC Dining Tables (T1-T6)
    for (let i = 1; i <= 6; i++) {
      await DiningTable.findOneAndUpdate(
        { outletId, tableNumber: `T${i}` },
        {
          outletId,
          areaId: acHall._id,
          tableNumber: `T${i}`,
          capacity: i % 2 === 0 ? 4 : 2,
          sortOrder: i,
          status: i === 2 ? TABLE_STATUS.OCCUPIED : i === 4 ? TABLE_STATUS.BILLED : TABLE_STATUS.VACANT,
          currentGuestCount: i === 2 ? 3 : i === 4 ? 4 : 0,
        },
        { upsert: true }
      );
    }

    // Rooftop Tables (R1-R4)
    for (let i = 1; i <= 4; i++) {
      await DiningTable.findOneAndUpdate(
        { outletId, tableNumber: `R${i}` },
        {
          outletId,
          areaId: rooftop._id,
          tableNumber: `R${i}`,
          capacity: 4,
          sortOrder: i + 10,
          status: TABLE_STATUS.VACANT,
        },
        { upsert: true }
      );
    }

    // Bar Stools / Tables (B1-B3)
    for (let i = 1; i <= 3; i++) {
      await DiningTable.findOneAndUpdate(
        { outletId, tableNumber: `B${i}` },
        {
          outletId,
          areaId: barArea._id,
          tableNumber: `B${i}`,
          capacity: 2,
          sortOrder: i + 20,
          status: TABLE_STATUS.VACANT,
        },
        { upsert: true }
      );
    }
  }
}
