import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { ROLES, PERMISSIONS } from '@pos/shared';

describe('Menu and Floor Tables API Tests', () => {
  let app;
  let adminToken;
  let captainToken;

  beforeAll(async () => {
    app = await buildApp({ skipDb: true });
    await app.ready();

    adminToken = app.jwt.sign({
      sub: 'admin_id_menu',
      role: ROLES.ADMIN,
      outletId: 'outlet_menu_123',
      permissions: Object.values(PERMISSIONS),
    });

    captainToken = app.jwt.sign({
      sub: 'captain_id_menu',
      role: ROLES.CAPTAIN,
      outletId: 'outlet_menu_123',
      permissions: [PERMISSIONS.MENU_VIEW, PERMISSIONS.TABLE_VIEW, PERMISSIONS.TABLE_TRANSFER],
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Menu Endpoints & Permissions', () => {
    it('blocks captain from creating menu items (needs menu.create)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/menu/items',
        headers: { authorization: `Bearer ${captainToken}` },
        payload: {
          categoryId: 'cat_1',
          name: 'Special Biryani',
          basePrice: 35000,
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('validates item payload with Zod schema', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/menu/items',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: '', // Empty name
          basePrice: -10, // Negative price
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Table & Floor Endpoints', () => {
    it('blocks captain from deleting dining tables', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/tables/table_123',
        headers: { authorization: `Bearer ${captainToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('validates table transfer payload', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/tables/transfer',
        headers: { authorization: `Bearer ${captainToken}` },
        payload: {
          sourceTableId: '', // Empty
          targetTableId: '',
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });
});
