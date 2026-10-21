import { TablesService } from './tables.service.js';
import {
  areaSchema,
  diningTableSchema,
  updateTableStatusSchema,
  transferTableSchema,
  mergeTablesSchema,
} from '@pos/shared';

export class TablesController {
  constructor() {
    this.tablesService = new TablesService();
  }

  _getOutletId(request) {
    return request.user?.outletId || request.headers['x-outlet-id'];
  }

  // Areas
  async listAreas(request, reply) {
    const outletId = this._getOutletId(request);
    const areas = await this.tablesService.listAreas(outletId);
    return reply.send({ code: 'OK', areas });
  }

  async createArea(request, reply) {
    const outletId = this._getOutletId(request);
    const validated = areaSchema.parse(request.body);
    const area = await this.tablesService.createArea(outletId, validated);
    return reply.status(201).send({ code: 'AREA_CREATED', area });
  }

  async updateArea(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const validated = areaSchema.partial().parse(request.body);
    const area = await this.tablesService.updateArea(outletId, id, validated);
    return reply.send({ code: 'AREA_UPDATED', area });
  }

  async deleteArea(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    await this.tablesService.deleteArea(outletId, id);
    return reply.send({ code: 'AREA_DELETED' });
  }

  // Dining Tables
  async listTables(request, reply) {
    const outletId = this._getOutletId(request);
    const { areaId, status } = request.query;
    const tables = await this.tablesService.listTables(outletId, { areaId, status });
    return reply.send({ code: 'OK', tables });
  }

  async getTable(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const table = await this.tablesService.getTable(outletId, id);
    return reply.send({ code: 'OK', table });
  }

  async createTable(request, reply) {
    const outletId = this._getOutletId(request);
    const validated = diningTableSchema.parse(request.body);
    const table = await this.tablesService.createTable(outletId, validated);
    return reply.status(201).send({ code: 'TABLE_CREATED', table });
  }

  async updateTable(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const validated = diningTableSchema.partial().parse(request.body);
    const table = await this.tablesService.updateTable(outletId, id, validated);
    return reply.send({ code: 'TABLE_UPDATED', table });
  }

  async updateStatus(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const validated = updateTableStatusSchema.parse(request.body);
    const table = await this.tablesService.updateTableStatus(outletId, id, validated);
    return reply.send({ code: 'TABLE_STATUS_UPDATED', table });
  }

  async transferTable(request, reply) {
    const outletId = this._getOutletId(request);
    const validated = transferTableSchema.parse(request.body);
    const result = await this.tablesService.transferTable(outletId, validated);
    return reply.send({ code: 'TABLE_TRANSFERRED', ...result });
  }

  async mergeTables(request, reply) {
    const outletId = this._getOutletId(request);
    const validated = mergeTablesSchema.parse(request.body);
    const result = await this.tablesService.mergeTables(outletId, validated);
    return reply.send({ code: 'TABLES_MERGED', ...result });
  }

  async deleteTable(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    await this.tablesService.deleteTable(outletId, id);
    return reply.send({ code: 'TABLE_DELETED' });
  }

  async seedDemo(request, reply) {
    const outletId = this._getOutletId(request);
    await this.tablesService.seedDemoTables(outletId);
    return reply.send({ code: 'DEMO_TABLES_SEEDED', message: 'Demo floor layout initialized' });
  }
}
