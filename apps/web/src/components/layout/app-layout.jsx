import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { useSocket } from '@/hooks/use-socket';

export function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Initialize real-time multi-outlet socket room listener
  useSocket();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 select-none">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

