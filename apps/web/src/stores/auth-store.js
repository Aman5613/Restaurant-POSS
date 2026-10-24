import { create } from 'zustand';

export const ROLE_PROFILES = {
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

export function getRoleHome(role, isSetupCompleted = true) {
  if (role === 'admin' && isSetupCompleted === false) {
    return '/setup';
  }
  switch (role) {
    case 'super-admin':
      return '/super-admin';
    case 'admin':
      return '/admin';
    case 'manager':
      return '/manager';
    case 'cook':
      return '/kitchen';
    case 'captain':
    case 'biller':
    default:
      return '/tables';
  }
}

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

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    persistAuth(updated, get().accessToken);
    set({ user: updated });
  },

  quickLoginRole: (roleKey = 'super-admin') => {
    const baseProfile = ROLE_PROFILES[roleKey] || ROLE_PROFILES['super-admin'];
    const activeOutletId = get().user?.outletId || 'default-outlet';
    const profile = {
      ...baseProfile,
      outletId: activeOutletId,
      isSetupCompleted: get().user?.isSetupCompleted ?? true,
    };
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
    if (user.role === 'super-admin') return true;
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
