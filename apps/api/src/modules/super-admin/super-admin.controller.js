import { SuperAdminService } from './super-admin.service.js';
import { z } from 'zod';

const createOwnerSchema = z.object({
  ownerName: z.string().min(2, 'Owner name required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be a valid 10-digit number'),
  password: z.string().min(6).optional(),
  pin: z.string().regex(/^\d{4,6}$/).optional(),
  restaurantName: z.string().min(2, 'Restaurant name required'),
  legalName: z.string().optional(),
  line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
  pincode: z.string().optional(),
  upiId: z.string().optional(),
  logoUrl: z.string().optional(),
});

export class SuperAdminController {
  constructor() {
    this.service = new SuperAdminService();
  }

  async listOwners(_req, reply) {
    const owners = await this.service.listOwners();
    return reply.send({ success: true, code: 'OK', data: owners, owners });
  }

  async createOwner(req, reply) {
    const validated = createOwnerSchema.parse(req.body);
    const result = await this.service.createOwner(validated);
    return reply.status(201).send({ success: true, code: 'OWNER_CREATED', ...result });
  }

  async toggleStatus(req, reply) {
    const { id } = req.params;
    const result = await this.service.toggleOwnerStatus(id);
    return reply.send({ success: true, code: 'STATUS_UPDATED', ...result });
  }

  async getStats(_req, reply) {
    const stats = await this.service.getPlatformStats();
    return reply.send({ success: true, code: 'OK', data: stats, stats });
  }
}
