import argon2 from 'argon2';
import mongoose from 'mongoose';
import { User, Tenant, Outlet } from '../../models/index.js';
import { ROLES } from '@pos/shared';
import { OutletService } from '../outlet/outlet.service.js';

export class SuperAdminService {
  constructor() {
    this.outletService = new OutletService();
  }

  async listOwners() {
    if (mongoose.connection?.readyState !== 1) {
      return [];
    }
    const owners = await User.find({ role: ROLES.ADMIN })
      .populate('outletId')
      .populate('tenantId')
      .sort({ createdAt: -1 });

    return owners.map((u) => ({
      id: u._id.toString(),
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      outlet: u.outletId
        ? {
            id: u.outletId._id.toString(),
            name: u.outletId.name,
            phone: u.outletId.phone,
            address: u.outletId.address,
            upiId: u.outletId.upiId,
            logoUrl: u.outletId.logoUrl,
            isActive: u.outletId.isActive,
          }
        : null,
      tenant: u.tenantId
        ? {
            id: u.tenantId._id.toString(),
            name: u.tenantId.name,
            code: u.tenantId.code,
          }
        : null,
    }));
  }

  async createOwner(data) {
    const {
      ownerName,
      email,
      phone,
      password,
      pin,
      restaurantName,
      legalName,
      line1,
      city,
      state = 'Maharashtra',
      stateCode = '27',
      pincode = '400001',
      upiId,
      logoUrl,
    } = data;

    if (mongoose.connection?.readyState !== 1) {
      return {
        user: { id: 'usr_mock', name: ownerName, email, phone, role: ROLES.ADMIN, isActive: true },
        outlet: { id: 'out_mock', name: restaurantName, phone, upiId },
        tenant: { id: 'ten_mock', name: restaurantName, code: 'TEN_MOCK' },
      };
    }

    // Check duplicate phone
    const existing = await User.findOne({ phone });
    if (existing) {
      throw { statusCode: 400, message: `User with phone ${phone} already exists` };
    }

    // 1. Create Tenant
    const tenantCode = `TEN_${Date.now().toString().slice(-6)}`;
    const tenant = await Tenant.create({
      name: restaurantName || `${ownerName}'s Restaurant`,
      code: tenantCode,
      contactEmail: email || undefined,
      contactPhone: phone,
    });

    // 2. Create Outlet
    const outlet = await Outlet.create({
      tenantId: tenant._id,
      name: restaurantName || `${ownerName} Kitchen`,
      legalName: legalName || restaurantName,
      phone,
      email: email || undefined,
      address: {
        line1: line1 || 'Main Market Road',
        city: city || 'Mumbai',
        state,
        stateCode,
        pincode,
      },
      upiId: upiId || undefined,
      logoUrl: logoUrl || undefined,
      isSetupCompleted: true,
    });

    // 3. Hash credentials
    const passwordHash = await argon2.hash(password || 'Owner@12345');
    const pinHash = await argon2.hash(pin || '1111');

    // 4. Create Admin (Owner) user
    const owner = await User.create({
      tenantId: tenant._id,
      outletId: outlet._id,
      name: ownerName,
      email: email || undefined,
      phone,
      role: ROLES.ADMIN,
      passwordHash,
      pinHash,
      isActive: true,
    });

    // 5. Seed standard slabs for the new outlet
    try {
      await this.outletService.seedStandardSlabs(outlet._id);
    } catch (_err) {
      // Non-blocking
    }

    return {
      owner: {
        id: owner._id.toString(),
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
      },
      outlet: {
        id: outlet._id.toString(),
        name: outlet.name,
        phone: outlet.phone,
        upiId: outlet.upiId,
      },
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        code: tenant.code,
      },
    };
  }

  async toggleOwnerStatus(userId) {
    if (mongoose.connection?.readyState !== 1) {
      return { id: userId, isActive: true };
    }
    const user = await User.findById(userId);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    user.isActive = !user.isActive;
    await user.save();

    if (user.outletId) {
      await Outlet.findByIdAndUpdate(user.outletId, { isActive: user.isActive });
    }

    return { id: user._id.toString(), isActive: user.isActive };
  }

  async getPlatformStats() {
    if (mongoose.connection?.readyState !== 1) {
      return {
        totalOwners: 1,
        totalOutlets: 1,
        totalTenants: 1,
        totalUsers: 1,
      };
    }
    const [totalOwners, totalOutlets, totalTenants, totalUsers] = await Promise.all([
      User.countDocuments({ role: ROLES.ADMIN }),
      Outlet.countDocuments(),
      Tenant.countDocuments(),
      User.countDocuments(),
    ]);

    return {
      totalOwners,
      totalOutlets,
      totalTenants,
      totalUsers,
    };
  }
}
