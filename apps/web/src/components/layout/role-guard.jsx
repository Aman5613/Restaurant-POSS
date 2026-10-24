import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, getRoleHome } from '@/stores/auth-store';

export function RoleGuard({ allowedRoles, fallbackPath }) {
  const { isAuthenticated, user, hasRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to={fallbackPath || getRoleHome(user?.role)} replace />;
  }

  return <Outlet />;
}
