import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

export function RoleGuard({ allowedRoles, fallbackPath = '/unauthorized' }) {
  const { isAuthenticated, hasRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
