import { Order, DiningTable, TableSession, KOT, PrintJob, KitchenStation, NumberingSeries, Item } from '../../models/index.js';
import { ORDER_STATUS, TABLE_STATUS, KOT_STATUS, PRINT_JOB_STATUS } from '@pos/shared';

export class OrdersService {
  async createOrder({ outletId, tenantId, waiterId, orderType, tableId, guestCount, items, customer, notes }) {
    let orderNo;
    const series = await NumberingSeries.findOneAndUpdate(
      { outlet_id: outletId, type: 'ORDER', active: true },
      { $inc: { current_number: 1 } },
      { new: true }
    );

    if (series) {
      orderNo = `${series.prefix || 'ORD-'}${series.current_number.toString().padStart(4, '0')}`;
    } else {
      orderNo = `ORD-${Date.now().toString().slice(-4)}`;
    }

    let tableSessionId = null;
    let table = null;

    if (tableId) {
      table = await DiningTable.findOne({ _id: tableId, outlet_id: outletId });
      if (table) {
        let activeSession = await TableSession.findOne({ table_id: tableId, state: 'active' });
        if (!activeSession) {
          activeSession = await TableSession.create({
            outlet_id: outletId,
            table_id: tableId,
            guest_count: guestCount || table.capacity || 2,
            captain_id: waiterId,
            opened_at: new Date(),
            state: 'active',
          });
        }
        tableSessionId = activeSession._id;
        table.status = TABLE_STATUS.OCCUPIED;
        await table.save();
      }
    }

    // Resolve kitchen stations for items if not specified
    const enrichedLines = [];
    for (const item of items) {
      let stationId = item.stationId;
      if (!stationId) {
        const dbItem = await Item.findById(item.itemId);
        stationId = dbItem?.station_id || null;
      }

      enrichedLines.push({
        item_id: item.itemId,
        name: item.name,
        variant_id: item.variantId || null,
        variant_name: item.variantName || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate ?? 5,
        is_tax_inclusive: item.isTaxInclusive ?? true,
        station_id: stationId,
        addons: (item.addons || []).map((a) => ({
          addon_id: a.addonId,
          name: a.name,
          price: a.price,
        })),
        notes: item.notes || '',
        course: item.course || 'general',
        status: 'DRAFT',
      });
    }

    const { subtotal, taxAmount, totalAmount } = this._calculateTotals(enrichedLines);

    const order = await Order.create({
      outlet_id: outletId,
      tenant_id: tenantId,
      order_no: orderNo,
      order_type: orderType,
      table_id: tableId || null,
      table_session_id: tableSessionId,
      guest_count: guestCount || 1,
      waiter_id: waiterId,
      customer: customer || {},
      notes: notes || '',
      lines: enrichedLines,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: ORDER_STATUS.DRAFT,
    });

    return order;
  }

  async listOrders({ outletId, status, orderType, tableId, limit = 50 }) {
    const filter = { outlet_id: outletId };
    if (status) filter.status = status;
    if (orderType) filter.order_type = orderType;
    if (tableId) filter.table_id = tableId;

    return Order.find(filter)
      .populate('table_id', 'table_number name area_id')
      .populate('waiter_id', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }

  async getOrderById({ outletId, orderId }) {
    const order = await Order.findOne({ _id: orderId, outlet_id: outletId })
      .populate('table_id', 'table_number name capacity')
      .populate('waiter_id', 'name phone')
      .populate('lines.station_id', 'name code');

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }
    return order;
  }

  async addLines({ outletId, orderId, items }) {
    const order = await this.getOrderById({ outletId, orderId });

    if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.SETTLED) {
      const error = new Error(`Cannot add lines to an order with status ${order.status}`);
      error.statusCode = 400;
      throw error;
    }

    for (const item of items) {
      let stationId = item.stationId;
      if (!stationId) {
        const dbItem = await Item.findById(item.itemId);
        stationId = dbItem?.station_id || null;
      }

      order.lines.push({
        item_id: item.itemId,
        name: item.name,
        variant_id: item.variantId || null,
        variant_name: item.variantName || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate ?? 5,
        is_tax_inclusive: item.isTaxInclusive ?? true,
        station_id: stationId,
        addons: (item.addons || []).map((a) => ({
          addon_id: a.addonId,
          name: a.name,
          price: a.price,
        })),
        notes: item.notes || '',
        course: item.course || 'general',
        status: 'DRAFT',
      });
    }

    const { subtotal, taxAmount, totalAmount } = this._calculateTotals(order.lines);
    order.subtotal = subtotal;
    order.tax_amount = taxAmount;
    order.total_amount = totalAmount;

    await order.save();
    return order;
  }

  async updateLine({ outletId, orderId, lineId, quantity, notes }) {
    const order = await this.getOrderById({ outletId, orderId });
    const line = order.lines.id(lineId);

    if (!line) {
      const error = new Error('Order line not found');
      error.statusCode = 404;
      throw error;
    }

    if (line.status !== 'DRAFT') {
      const error = new Error('Only DRAFT lines can be directly modified. Sent lines must be cancelled.');
      error.statusCode = 400;
      throw error;
    }

    if (quantity !== undefined) line.quantity = quantity;
    if (notes !== undefined) line.notes = notes;

    const { subtotal, taxAmount, totalAmount } = this._calculateTotals(order.lines);
    order.subtotal = subtotal;
    order.tax_amount = taxAmount;
    order.total_amount = totalAmount;

    await order.save();
    return order;
  }

  async cancelLine({ outletId, orderId, lineId, reason, cancelledBy }) {
    const order = await this.getOrderById({ outletId, orderId });
    const line = order.lines.id(lineId);

    if (!line) {
      const error = new Error('Order line not found');
      error.statusCode = 404;
      throw error;
    }

    if (line.status === 'CANCELLED') {
      return order;
    }

    const wasSent = line.status === 'SENT';
    line.status = 'CANCELLED';
    line.cancel_reason = reason;
    line.cancelled_by = cancelledBy;
    line.cancelled_at = new Date();

    let cancelKot = null;
    if (wasSent && line.station_id) {
      const station = await KitchenStation.findById(line.station_id);
      cancelKot = await KOT.create({
        outlet_id: outletId,
        order_id: order._id,
        order_no: order.order_no,
        kot_no: `KOT-C-${Date.now().toString().slice(-4)}`,
        table_id: order.table_id?._id || order.table_id,
        table_name: order.table_id?.name || 'Quick Order',
        station_id: line.station_id,
        station_name: station?.name || 'Kitchen',
        type: 'CANCEL',
        status: KOT_STATUS.PENDING,
        created_by: cancelledBy,
        lines: [
          {
            line_id: line._id,
            item_id: line.item_id,
            name: line.name,
            variant_name: line.variant_name,
            quantity: line.quantity,
            addons: line.addons,
            notes: `CANCELLED: ${reason}`,
          },
        ],
      });

      if (station?.printer_id) {
        await PrintJob.create({
          outlet_id: outletId,
          printer_id: station.printer_id,
          kot_id: cancelKot._id,
          job_type: 'KOT',
          status: PRINT_JOB_STATUS.QUEUED,
          created_by: cancelledBy,
        });
      }
    }

    const { subtotal, taxAmount, totalAmount } = this._calculateTotals(order.lines);
    order.subtotal = subtotal;
    order.tax_amount = taxAmount;
    order.total_amount = totalAmount;

    await order.save();
    return { order, cancelKot };
  }

  async sendToKitchen({ outletId, orderId, createdBy }) {
    const order = await this.getOrderById({ outletId, orderId });

    const draftLines = order.lines.filter((l) => l.status === 'DRAFT');
    if (draftLines.length === 0) {
      const error = new Error('No draft items to send to kitchen');
      error.statusCode = 400;
      throw error;
    }

    // Default station if station_id is null
    let defaultStation = await KitchenStation.findOne({ outlet_id: outletId, active: true });
    if (!defaultStation) {
      defaultStation = await KitchenStation.create({
        outlet_id: outletId,
        name: 'Main Kitchen',
        code: 'MK',
        active: true,
      });
    }

    // Group lines by station
    const stationGroups = new Map();
    for (const line of draftLines) {
      const stId = (line.station_id?._id || line.station_id || defaultStation._id).toString();
      if (!stationGroups.has(stId)) {
        stationGroups.set(stId, []);
      }
      stationGroups.get(stId).push(line);
    }

    const createdKots = [];
    const createdPrintJobs = [];

    for (const [stId, lines] of stationGroups.entries()) {
      const station = await KitchenStation.findById(stId);
      const kotNo = `KOT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`;

      const kot = await KOT.create({
        outlet_id: outletId,
        order_id: order._id,
        order_no: order.order_no,
        kot_no: kotNo,
        table_id: order.table_id?._id || order.table_id,
        table_name: order.table_id?.name || 'Counter',
        station_id: stId,
        station_name: station?.name || defaultStation.name,
        type: 'REGULAR',
        status: KOT_STATUS.PENDING,
        created_by: createdBy,
        lines: lines.map((l) => ({
          line_id: l._id,
          item_id: l.item_id,
          name: l.name,
          variant_name: l.variant_name,
          quantity: l.quantity,
          addons: l.addons,
          notes: l.notes,
          course: l.course,
        })),
      });

      createdKots.push(kot);

      if (station?.printer_id) {
        const pj = await PrintJob.create({
          outlet_id: outletId,
          printer_id: station.printer_id,
          kot_id: kot._id,
          job_type: 'KOT',
          status: PRINT_JOB_STATUS.QUEUED,
          created_by: createdBy,
        });
        createdPrintJobs.push(pj);
      }

      // Mark lines as SENT
      for (const line of lines) {
        line.status = 'SENT';
        line.kot_id = kot._id;
      }
    }

    order.status = ORDER_STATUS.RUNNING;
    await order.save();

    return { order, kots: createdKots, printJobs: createdPrintJobs };
  }

  async holdOrder({ outletId, orderId }) {
    const order = await this.getOrderById({ outletId, orderId });
    order.is_held = true;
    await order.save();
    return order;
  }

  async resumeOrder({ outletId, orderId }) {
    const order = await this.getOrderById({ outletId, orderId });
    order.is_held = false;
    await order.save();
    return order;
  }

  async cancelOrder({ outletId, orderId, reason, cancelledBy }) {
    const order = await this.getOrderById({ outletId, orderId });

    if (order.status === ORDER_STATUS.SETTLED) {
      const error = new Error('Settled orders cannot be cancelled');
      error.statusCode = 400;
      throw error;
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.notes = `${order.notes ? order.notes + ' | ' : ''}CANCELLED: ${reason}`;

    for (const line of order.lines) {
      if (line.status !== 'CANCELLED') {
        line.status = 'CANCELLED';
        line.cancel_reason = reason;
        line.cancelled_by = cancelledBy;
        line.cancelled_at = new Date();
      }
    }

    if (order.table_id) {
      const otherActive = await Order.findOne({
        outlet_id: outletId,
        table_id: order.table_id,
        _id: { $ne: order._id },
        status: { $in: [ORDER_STATUS.DRAFT, ORDER_STATUS.RUNNING, ORDER_STATUS.BILLED] },
      });

      if (!otherActive) {
        await DiningTable.findByIdAndUpdate(order.table_id, { status: TABLE_STATUS.VACANT });
        if (order.table_session_id) {
          await TableSession.findByIdAndUpdate(order.table_session_id, {
            state: 'closed',
            closed_at: new Date(),
          });
        }
      }
    }

    await order.save();
    return order;
  }

  _calculateTotals(lines) {
    let subtotal = 0;
    let taxAmount = 0;

    for (const line of lines) {
      if (line.status === 'CANCELLED') continue;

      const addonsSum = (line.addons || []).reduce((sum, a) => sum + (a.price || 0), 0);
      const lineUnit = line.unit_price + addonsSum;
      const lineGross = lineUnit * line.quantity;

      subtotal += lineGross;

      // Tax calculation (integer paise)
      if (line.is_tax_inclusive) {
        // Back-calculate: tax = gross - (gross / (1 + rate / 100))
        const net = Math.round(lineGross / (1 + line.tax_rate / 100));
        taxAmount += lineGross - net;
      } else {
        taxAmount += Math.round((lineGross * line.tax_rate) / 100);
      }
    }

    return {
      subtotal,
      taxAmount,
      totalAmount: subtotal + (lines.some((l) => !l.is_tax_inclusive) ? taxAmount : 0),
    };
  }
}
