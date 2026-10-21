import { db } from '../db/dexie';

/**
 * Syncs outlet configurations and staff credentials into Dexie.js
 * for offline operations.
 */
export async function syncOutletSettingsOffline({
  outlet,
  _taxGroups,
  _paymentModes,
  users,
}) {
  try {
    if (outlet) {
      await db.outlets.put({
        id: outlet._id || outlet.id,
        name: outlet.name,
        legalName: outlet.legalName,
        gstin: outlet.gstin,
        phone: outlet.phone,
        isActive: outlet.isActive !== false,
      });
    }

    if (Array.isArray(users)) {
      for (const u of users) {
        await db.users.put({
          id: u._id || u.id,
          name: u.name,
          phone: u.phone,
          role: u.role,
          isActive: u.isActive !== false,
        });
      }
    }

    return { success: true, timestamp: Date.now() };
  } catch (err) {
    console.error('Failed to cache settings to Dexie.js:', err);
    return { success: false, error: err.message };
  }
}
