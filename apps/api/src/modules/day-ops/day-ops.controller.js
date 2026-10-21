import { DayOpsService } from './day-ops.service.js';
import {
  openDaySchema,
  closeDaySchema,
  openShiftSchema,
  closeShiftSchema,
  cashMovementSchema,
} from '@pos/shared';

export class DayOpsController {
  constructor() {
    this.service = new DayOpsService();
  }

  async getCurrentDay(req, reply) {
    const day = await this.service.getCurrentDay({ outletId: req.user.outlet_id });
    return reply.send({ success: true, data: day });
  }

  async openDay(req, reply) {
    const validated = openDaySchema.parse(req.body);
    const day = await this.service.openDay({
      outletId: req.user.outlet_id,
      openedBy: req.user.sub || req.user.id,
      ...validated,
    });
    return reply.status(201).send({ success: true, data: day });
  }

  async closeDay(req, reply) {
    const validated = closeDaySchema.parse(req.body);
    const day = await this.service.closeDay({
      outletId: req.user.outlet_id,
      closedBy: req.user.sub || req.user.id,
      ...validated,
    });
    return reply.send({ success: true, data: day });
  }

  async openShift(req, reply) {
    const validated = openShiftSchema.parse(req.body);
    const shift = await this.service.openShift({
      outletId: req.user.outlet_id,
      userId: req.user.sub || req.user.id,
      ...validated,
    });
    return reply.status(201).send({ success: true, data: shift });
  }

  async closeShift(req, reply) {
    const validated = closeShiftSchema.parse(req.body);
    const shift = await this.service.closeShift({
      outletId: req.user.outlet_id,
      shiftId: req.params.id,
      userId: req.user.sub || req.user.id,
      ...validated,
    });
    return reply.send({ success: true, data: shift });
  }

  async recordCashMovement(req, reply) {
    const validated = cashMovementSchema.parse(req.body);
    const movement = await this.service.recordCashMovement({
      outletId: req.user.outlet_id,
      performedBy: req.user.sub || req.user.id,
      ...validated,
    });
    return reply.status(201).send({ success: true, data: movement });
  }
}
