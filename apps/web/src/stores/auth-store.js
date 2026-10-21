import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: ({ user, accessToken }) =>
    set({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),

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
