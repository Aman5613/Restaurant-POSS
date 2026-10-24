import { OrdersService } from './orders.service.js';
import {
  createOrderSchema,
  addOrderLinesSchema,
  updateOrderLineSchema,
  cancelOrderLineSchema,
  cancelOrderSchema,
} from '@pos/shared';

export class OrdersController {
  constructor() {
    this.service = new OrdersService();
  }

  _getOutletId(req) {
    return req.user?.outletId || req.user?.outlet_id || req.body?.outletId;
  }

  async create(req, reply) {
    const validated = createOrderSchema.parse(req.body);
    const outletId = this._getOutletId(req) || validated.outletId;
    const order = await this.service.createOrder({
      outletId,
      tenantId: req.user?.tenantId || req.user?.tenant_id,
      waiterId: req.user?.sub || req.user?.id,
      ...validated,
    });
    if (req.server?.emitOutlet) {
      req.server.emitOutlet(outletId, 'order:created', order);
    }
    return reply.status(201).send({ success: true, data: order });
  }

  async list(req, reply) {
    const outletId = this._getOutletId(req);
    const { status, orderType, tableId, limit } = req.query;
    const orders = await this.service.listOrders({ outletId, status, orderType, tableId, limit });
    return reply.send({ success: true, data: orders });
  }

  async getById(req, reply) {
    const outletId = this._getOutletId(req);
    const order = await this.service.getOrderById({ outletId, orderId: req.params.id });
    return reply.send({ success: true, data: order });
  }

  async addLines(req, reply) {
    const outletId = this._getOutletId(req);
    const validated = addOrderLinesSchema.parse(req.body);
    const order = await this.service.addLines({
      outletId,
      orderId: req.params.id,
      items: validated.items,
    });
    return reply.send({ success: true, data: order });
  }

  async updateLine(req, reply) {
    const outletId = this._getOutletId(req);
    const validated = updateOrderLineSchema.parse(req.body);
    const order = await this.service.updateLine({
      outletId,
      orderId: req.params.id,
      lineId: req.params.lineId,
      ...validated,
    });
    return reply.send({ success: true, data: order });
  }

  async cancelLine(req, reply) {
    const outletId = this._getOutletId(req);
    const validated = cancelOrderLineSchema.parse(req.body);
    const result = await this.service.cancelLine({
      outletId,
      orderId: req.params.id,
      lineId: req.params.lineId,
      reason: validated.reason,
      cancelledBy: req.user?.sub || req.user?.id,
    });
    return reply.send({ success: true, data: result });
  }

  async sendToKitchen(req, reply) {
    const outletId = this._getOutletId(req);
    const result = await this.service.sendToKitchen({
      outletId,
      orderId: req.params.id,
      createdBy: req.user?.sub || req.user?.id,
    });
    if (req.server?.emitOutlet) {
      req.server.emitOutlet(outletId, 'kot:dispatched', result);
    }
    if (req.server?.emitKitchen) {
      req.server.emitKitchen(outletId, 'kot:dispatched', result);
    }
    return reply.send({ success: true, data: result });
  }

  async hold(req, reply) {
    const outletId = this._getOutletId(req);
    const order = await this.service.holdOrder({ outletId, orderId: req.params.id });
    return reply.send({ success: true, data: order });
  }

  async resume(req, reply) {
    const outletId = this._getOutletId(req);
    const order = await this.service.resumeOrder({ outletId, orderId: req.params.id });
    return reply.send({ success: true, data: order });
  }

  async cancel(req, reply) {
    const outletId = this._getOutletId(req);
    const validated = cancelOrderSchema.parse(req.body);
    const order = await this.service.cancelOrder({
      outletId,
      orderId: req.params.id,
      reason: validated.reason,
      cancelledBy: req.user?.sub || req.user?.id,
    });
    return reply.send({ success: true, data: order });
  }
}
