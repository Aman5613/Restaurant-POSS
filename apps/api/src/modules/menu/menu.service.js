import {
  Category,
  Item,
  AddonGroup,
  KitchenStation,
  TaxGroup,
} from '../../models/index.js';

export class MenuService {
  // Categories
  async listCategories(outletId) {
    return Category.find({ outletId }).sort({ sortOrder: 1, name: 1 });
  }

  async createCategory(outletId, data) {
    return Category.create({ ...data, outletId });
  }

  async updateCategory(outletId, categoryId, data) {
    const category = await Category.findOneAndUpdate(
      { _id: categoryId, outletId },
      data,
      { new: true }
    );
    if (!category) throw { statusCode: 404, message: 'Category not found' };
    return category;
  }

  async deleteCategory(outletId, categoryId) {
    // Check if category has items
    const itemCount = await Item.countDocuments({ outletId, categoryId });
    if (itemCount > 0) {
      throw {
        statusCode: 400,
        message: `Cannot delete category with ${itemCount} existing menu item(s)`,
      };
    }
    const res = await Category.findOneAndDelete({ _id: categoryId, outletId });
    if (!res) throw { statusCode: 404, message: 'Category not found' };
    return { success: true };
  }

  // Kitchen Stations
  async listStations(outletId) {
    return KitchenStation.find({ outletId }).populate('printerId', 'name connectionType');
  }

  async createStation(outletId, data) {
    return KitchenStation.create({ ...data, outletId });
  }

  async updateStation(outletId, stationId, data) {
    const station = await KitchenStation.findOneAndUpdate(
      { _id: stationId, outletId },
      data,
      { new: true }
    );
    if (!station) throw { statusCode: 404, message: 'Station not found' };
    return station;
  }

  // Addon Groups
  async listAddonGroups(outletId) {
    return AddonGroup.find({ outletId });
  }

  async createAddonGroup(outletId, data) {
    return AddonGroup.create({ ...data, outletId });
  }

  async updateAddonGroup(outletId, groupId, data) {
    const group = await AddonGroup.findOneAndUpdate(
      { _id: groupId, outletId },
      data,
      { new: true }
    );
    if (!group) throw { statusCode: 404, message: 'Addon group not found' };
    return group;
  }

  async deleteAddonGroup(outletId, groupId) {
    const res = await AddonGroup.findOneAndDelete({ _id: groupId, outletId });
    if (!res) throw { statusCode: 404, message: 'Addon group not found' };
    return { success: true };
  }

  // Items
  async listItems(outletId, { categoryId, isAvailable, search } = {}) {
    const query = { outletId };
    if (categoryId) query.categoryId = categoryId;
    if (typeof isAvailable === 'boolean') query.isAvailable = isAvailable;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    return Item.find(query)
      .populate('categoryId', 'name')
      .populate('taxGroupId', 'name rate isInclusive')
      .populate('stationId', 'name')
      .populate('addonGroupIds', 'name options')
      .sort({ sortOrder: 1, name: 1 });
  }

  async getItem(outletId, itemId) {
    const item = await Item.findOne({ _id: itemId, outletId })
      .populate('categoryId', 'name')
      .populate('taxGroupId', 'name rate isInclusive')
      .populate('stationId', 'name')
      .populate('addonGroupIds');
    if (!item) throw { statusCode: 404, message: 'Item not found' };
    return item;
  }

  async createItem(outletId, data) {
    // Default tax group if not provided: find 5% GST
    let taxGroupId = data.taxGroupId;
    if (!taxGroupId) {
      const defaultTax = await TaxGroup.findOne({ outletId, rate: 5 });
      if (defaultTax) taxGroupId = defaultTax._id;
    }

    return Item.create({ ...data, taxGroupId, outletId });
  }

  async updateItem(outletId, itemId, data) {
    const item = await Item.findOneAndUpdate(
      { _id: itemId, outletId },
      data,
      { new: true }
    );
    if (!item) throw { statusCode: 404, message: 'Item not found' };
    return item;
  }

  async setItemAvailability(outletId, itemId, isAvailable) {
    const item = await Item.findOneAndUpdate(
      { _id: itemId, outletId },
      { isAvailable },
      { new: true }
    );
    if (!item) throw { statusCode: 404, message: 'Item not found' };
    return item;
  }

  async deleteItem(outletId, itemId) {
    const res = await Item.findOneAndDelete({ _id: itemId, outletId });
    if (!res) throw { statusCode: 404, message: 'Item not found' };
    return { success: true };
  }

  // Full Snapshot for client offline cache (Dexie.js)
  async getMenuSnapshot(outletId) {
    const [categories, items, addonGroups, stations] = await Promise.all([
      this.listCategories(outletId),
      this.listItems(outletId),
      this.listAddonGroups(outletId),
      this.listStations(outletId),
    ]);

    return {
      version: Date.now(),
      outletId,
      categories,
      items,
      addonGroups,
      stations,
    };
  }

  // Pre-seed sample Indian restaurant menu
  async seedDemoMenu(outletId) {
    // 1. Stations
    const kitchen = await KitchenStation.findOneAndUpdate(
      { outletId, name: 'Main Kitchen' },
      { outletId, name: 'Main Kitchen' },
      { upsert: true, new: true }
    );
    const bar = await KitchenStation.findOneAndUpdate(
      { outletId, name: 'Bar & Beverages' },
      { outletId, name: 'Bar & Beverages' },
      { upsert: true, new: true }
    );

    // 2. Addons
    const extraCheese = await AddonGroup.findOneAndUpdate(
      { outletId, name: 'Add-ons & Extras' },
      {
        outletId,
        name: 'Add-ons & Extras',
        minSelect: 0,
        maxSelect: 3,
        options: [
          { name: 'Extra Cheese', price: 4000, isAvailable: true }, // ₹40.00
          { name: 'Extra Butter', price: 2500, isAvailable: true }, // ₹25.00
          { name: 'Raita', price: 5000, isAvailable: true }, // ₹50.00
        ],
      },
      { upsert: true, new: true }
    );

    // 3. Categories
    const starters = await Category.findOneAndUpdate(
      { outletId, name: 'Starters & Appetizers' },
      { outletId, name: 'Starters & Appetizers', sortOrder: 1 },
      { upsert: true, new: true }
    );
    const mains = await Category.findOneAndUpdate(
      { outletId, name: 'Main Course' },
      { outletId, name: 'Main Course', sortOrder: 2 },
      { upsert: true, new: true }
    );
    const breads = await Category.findOneAndUpdate(
      { outletId, name: 'Breads & Rice' },
      { outletId, name: 'Breads & Rice', sortOrder: 3 },
      { upsert: true, new: true }
    );
    const beverages = await Category.findOneAndUpdate(
      { outletId, name: 'Beverages' },
      { outletId, name: 'Beverages', sortOrder: 4 },
      { upsert: true, new: true }
    );

    // Tax group 5%
    const tax5 = await TaxGroup.findOne({ outletId, rate: 5 });

    // 4. Items (Amounts in integer paise)
    const demoItems = [
      {
        categoryId: starters._id,
        name: 'Paneer Tikka',
        code: 'STR-01',
        description: 'Cottage cheese cubes marinated in tandoori spices',
        basePrice: 28000, // ₹280.00
        taxGroupId: tax5?._id,
        stationId: kitchen._id,
        isVeg: true,
      },
      {
        categoryId: starters._id,
        name: 'Chicken Tikka',
        code: 'STR-02',
        description: 'Tender chicken morsels roasted in tandoor',
        basePrice: 32000, // ₹320.00
        taxGroupId: tax5?._id,
        stationId: kitchen._id,
        isVeg: false,
      },
      {
        categoryId: mains._id,
        name: 'Dal Makhani',
        code: 'MAIN-01',
        description: 'Black lentils slow cooked with cream and butter',
        basePrice: 26000, // ₹260.00
        taxGroupId: tax5?._id,
        stationId: kitchen._id,
        isVeg: true,
        addonGroupIds: [extraCheese._id],
      },
      {
        categoryId: mains._id,
        name: 'Butter Chicken',
        code: 'MAIN-02',
        description: 'Classic velvety tomato butter gravy with chicken tikka',
        basePrice: 38000, // ₹380.00
        taxGroupId: tax5?._id,
        stationId: kitchen._id,
        isVeg: false,
        variants: [
          { name: 'Half (2 Pcs)', price: 26000, isAvailable: true },
          { name: 'Full (4 Pcs)', price: 46000, isAvailable: true },
        ],
      },
      {
        categoryId: breads._id,
        name: 'Butter Naan',
        code: 'BRD-01',
        basePrice: 6000, // ₹60.00
        taxGroupId: tax5?._id,
        stationId: kitchen._id,
        isVeg: true,
      },
      {
        categoryId: breads._id,
        name: 'Chicken Dum Biryani',
        code: 'BRD-02',
        description: 'Fragrant basmati rice layered with spiced chicken and saffron',
        basePrice: 34000, // ₹340.00
        taxGroupId: tax5?._id,
        stationId: kitchen._id,
        isVeg: false,
        addonGroupIds: [extraCheese._id],
      },
      {
        categoryId: beverages._id,
        name: 'Fresh Lime Soda',
        code: 'BEV-01',
        basePrice: 9000, // ₹90.00
        taxGroupId: tax5?._id,
        stationId: bar._id,
        isVeg: true,
      },
    ];

    for (const it of demoItems) {
      await Item.findOneAndUpdate(
        { outletId, name: it.name },
        { ...it, outletId },
        { upsert: true }
      );
    }
  }
}
