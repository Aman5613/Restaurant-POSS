import { MenuService } from './menu.service.js';
import {
  categorySchema,
  kitchenStationSchema,
  addonGroupSchema,
  itemSchema,
  updateItemAvailabilitySchema,
} from '@pos/shared';

export class MenuController {
  constructor() {
    this.menuService = new MenuService();
  }

  _getOutletId(request) {
    return request.user?.outletId || request.headers['x-outlet-id'];
  }

  // Categories
  async listCategories(request, reply) {
    const outletId = this._getOutletId(request);
    const categories = await this.menuService.listCategories(outletId);
    return reply.send({ code: 'OK', categories });
  }

  async createCategory(request, reply) {
    const outletId = this._getOutletId(request);
    const validated = categorySchema.parse(request.body);
    const category = await this.menuService.createCategory(outletId, validated);
    return reply.status(201).send({ code: 'CATEGORY_CREATED', category });
  }

  async updateCategory(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const validated = categorySchema.partial().parse(request.body);
    const category = await this.menuService.updateCategory(outletId, id, validated);
    return reply.send({ code: 'CATEGORY_UPDATED', category });
  }

  async deleteCategory(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    await this.menuService.deleteCategory(outletId, id);
    return reply.send({ code: 'CATEGORY_DELETED' });
  }

  // Kitchen Stations
  async listStations(request, reply) {
    const outletId = this._getOutletId(request);
    const stations = await this.menuService.listStations(outletId);
    return reply.send({ code: 'OK', stations });
  }

  async createStation(request, reply) {
    const outletId = this._getOutletId(request);
    const validated = kitchenStationSchema.parse(request.body);
    const station = await this.menuService.createStation(outletId, validated);
    return reply.status(201).send({ code: 'STATION_CREATED', station });
  }

  async updateStation(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const validated = kitchenStationSchema.partial().parse(request.body);
    const station = await this.menuService.updateStation(outletId, id, validated);
    return reply.send({ code: 'STATION_UPDATED', station });
  }

  // Addon Groups
  async listAddonGroups(request, reply) {
    const outletId = this._getOutletId(request);
    const addonGroups = await this.menuService.listAddonGroups(outletId);
    return reply.send({ code: 'OK', addonGroups });
  }

  async createAddonGroup(request, reply) {
    const outletId = this._getOutletId(request);
    const validated = addonGroupSchema.parse(request.body);
    const addonGroup = await this.menuService.createAddonGroup(outletId, validated);
    return reply.status(201).send({ code: 'ADDON_GROUP_CREATED', addonGroup });
  }

  async updateAddonGroup(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const validated = addonGroupSchema.partial().parse(request.body);
    const addonGroup = await this.menuService.updateAddonGroup(outletId, id, validated);
    return reply.send({ code: 'ADDON_GROUP_UPDATED', addonGroup });
  }

  async deleteAddonGroup(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    await this.menuService.deleteAddonGroup(outletId, id);
    return reply.send({ code: 'ADDON_GROUP_DELETED' });
  }

  // Items
  async listItems(request, reply) {
    const outletId = this._getOutletId(request);
    const { categoryId, isAvailable, search } = request.query;
    const items = await this.menuService.listItems(outletId, {
      categoryId,
      isAvailable: isAvailable === undefined ? undefined : isAvailable === 'true',
      search,
    });
    return reply.send({ code: 'OK', items });
  }

  async getItem(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const item = await this.menuService.getItem(outletId, id);
    return reply.send({ code: 'OK', item });
  }

  async createItem(request, reply) {
    const outletId = this._getOutletId(request);
    const validated = itemSchema.parse(request.body);
    const item = await this.menuService.createItem(outletId, validated);
    return reply.status(201).send({ code: 'ITEM_CREATED', item });
  }

  async updateItem(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const validated = itemSchema.partial().parse(request.body);
    const item = await this.menuService.updateItem(outletId, id, validated);
    return reply.send({ code: 'ITEM_UPDATED', item });
  }

  async setAvailability(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    const validated = updateItemAvailabilitySchema.parse(request.body);
    const item = await this.menuService.setItemAvailability(outletId, id, validated.isAvailable);
    return reply.send({ code: 'ITEM_AVAILABILITY_UPDATED', item });
  }

  async deleteItem(request, reply) {
    const outletId = this._getOutletId(request);
    const { id } = request.params;
    await this.menuService.deleteItem(outletId, id);
    return reply.send({ code: 'ITEM_DELETED' });
  }

  // Snapshot for offline cache
  async getSnapshot(request, reply) {
    const outletId = this._getOutletId(request);
    const snapshot = await this.menuService.getMenuSnapshot(outletId);
    return reply.send({ code: 'OK', snapshot });
  }

  async seedDemo(request, reply) {
    const outletId = this._getOutletId(request);
    await this.menuService.seedDemoMenu(outletId);
    return reply.send({ code: 'DEMO_MENU_SEEDED', message: 'Demo menu initialized' });
  }
}
