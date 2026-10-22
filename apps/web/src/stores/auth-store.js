import { create } from 'zustand';

export const ROLE_PROFILES = {
  biller: {
    id: 'usr_biller',
    name: 'Deepak Sharma (Cashier / Biller)',
    email: 'biller@spicegarden.com',
    phone: '9666666666',
    role: 'biller',
    pin: '3333',
    permissions: ['bills:create', 'bills:read', 'orders:create', 'orders:read', 'kot:read'],
  },
  captain: {
    id: 'usr_captain',
    name: 'Sunil Kumar (Head Captain)',
    email: 'captain@spicegarden.com',
    phone: '9555555555',
    role: 'captain',
    pin: '4444',
    permissions: ['orders:create', 'orders:read', 'tables:read', 'kot:create'],
  },
  cook: {
    id: 'usr_cook',
    name: 'Chef Vikas (Kitchen Chef / Cook)',
    email: 'cook@spicegarden.com',
    phone: '9444444444',
    role: 'cook',
    pin: '5555',
    permissions: ['kot:read', 'kot:view', 'kot:acknowledge', 'kot:ready', 'menu:view'],
  },
  manager: {
    id: 'usr_manager',
    name: 'Rajesh Verma (General Manager)',
    email: 'manager@spicegarden.com',
    phone: '9777777777',
    role: 'manager',
    pin: '2222',
    permissions: ['reports:read', 'bills:void', 'discounts:apply', 'day:manage', 'all'],
  },
  admin: {
    id: 'usr_admin',
    name: 'Aman (Outlet Owner / Admin)',
    email: 'admin@spicegarden.com',
    phone: '9888888888',
    role: 'admin',
    pin: '1111',
    permissions: ['all'],
  },
  'super-admin': {
    id: 'usr_super',
    name: 'Platform Super Admin',
    email: 'superadmin@pos.internal',
    phone: '9999999999',
    role: 'super-admin',
    pin: '9999',
    permissions: ['all'],
  },
};

const AUTH_STORAGE_KEY = 'resto_pos_auth_v1';

function loadPersistedAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user) {
        return { user: parsed.user, accessToken: parsed.accessToken || 'demo_token' };
      }
    }
  } catch {
    // fallback
  }
  return { user: null, accessToken: null };
}

function persistAuth(user, accessToken) {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, accessToken }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

const initialAuth = loadPersistedAuth();

export const useAuthStore = create((set, get) => ({
  user: initialAuth.user,
  accessToken: initialAuth.accessToken,
  isAuthenticated: Boolean(initialAuth.user),
  isLoading: false,

  setAuth: ({ user, accessToken }) => {
    persistAuth(user, accessToken);
    set({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
    });
  },

  quickLoginRole: (roleKey) => {
    const profile = ROLE_PROFILES[roleKey] || ROLE_PROFILES.biller;
    const token = `token_${roleKey}_${Date.now()}`;
    persistAuth(profile, token);
    set({
      user: profile,
      accessToken: token,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    persistAuth(null, null);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  hasRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  },

  hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'super-admin') return true;
    return (user.permissions || []).includes(permission);
  },
}));
