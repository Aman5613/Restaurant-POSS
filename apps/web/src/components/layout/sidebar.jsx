import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
  Receipt,
  Users,
  Settings,
  ShieldCheck,
  ChefHat,
  Banknote,
  CalendarDays,
  Contact,
  BarChart3,
  Store,
  ShieldAlert,
  X,
  LogOut,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

const ROLE_NAVIGATION = {
  'super-admin': [
    { name: 'Super Admin Hub', href: '/super-admin', icon: ShieldCheck },
    { name: 'Platform Audit Logs', href: '/audit-logs', icon: ShieldAlert },
  ],
  admin: [
    { name: 'Owner Admin Hub', href: '/admin', icon: Store },
    { name: 'Manager Hub', href: '/manager', icon: ShieldCheck },
    { name: 'Staff & Roles', href: '/users', icon: Users },
    { name: 'Outlet Settings', href: '/settings', icon: Settings },
    { name: 'Floor View', href: '/tables', icon: Grid3X3 },
    { name: 'All Orders', href: '/orders/list', icon: Receipt },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
  ],
  manager: [
    { name: 'Manager Hub', href: '/manager', icon: ShieldCheck },
    { name: 'Floor View', href: '/tables', icon: Grid3X3 },
    { name: 'Menu Catalog', href: '/menu', icon: LayoutDashboard },
    { name: 'Day Operations', href: '/day-ops', icon: CalendarDays },
    { name: 'Customer Ledger', href: '/customers', icon: Contact },
    { name: 'All Orders', href: '/orders/list', icon: Receipt },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ],
  cook: [
    { name: 'Kitchen KDS', href: '/kitchen', icon: ChefHat },
    { name: 'KOT Queue', href: '/kot', icon: Receipt },
  ],
  biller: [
    { name: 'Floor View', href: '/tables', icon: Grid3X3 },
    { name: 'Order Screen', href: '/orders', icon: UtensilsCrossed },
    { name: 'Billing & Cashier', href: '/billing', icon: Banknote },
    { name: 'All Orders', href: '/orders/list', icon: Receipt },
    { name: 'Day Operations', href: '/day-ops', icon: CalendarDays },
    { name: 'Customer Ledger', href: '/customers', icon: Contact },
  ],
  captain: [
    { name: 'Floor View', href: '/tables', icon: Grid3X3 },
    { name: 'Order Screen', href: '/orders', icon: UtensilsCrossed },
    { name: 'KOT Status', href: '/kot', icon: Receipt },
  ],
};

const ROLE_LABELS = {
  'super-admin': 'Super Admin',
  admin: 'Owner / Admin',
  manager: 'Manager',
  cook: 'Kitchen Chef',
  biller: 'Biller / Cashier',
  captain: 'Captain',
};

export function Sidebar() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { isMobileSidebarOpen, closeMobileSidebar } = useUiStore();
  const isTopNavRole = user?.role === 'biller' || user?.role === 'captain' || user?.role === 'cook';
  const visibleNav = (user?.role && ROLE_NAVIGATION[user.role]) || ROLE_NAVIGATION.biller;
  const roleLabel = (user?.role && ROLE_LABELS[user.role]) || user?.role || 'Staff';

  const handleLogout = () => {
    closeMobileSidebar();
    clearAuth();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'w-64 border-r border-slate-200 bg-white flex flex-col h-screen select-none shadow-xs transition-transform duration-300 ease-in-out',
          // If biller/captain: hide on laptop/desktop
          isTopNavRole ? 'lg:hidden' : 'lg:static lg:translate-x-0 lg:z-0 flex-shrink-0',
          // Mobile drawer
          'fixed inset-y-0 left-0 z-50',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-base">
              🍽️
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-tight">RestoPOS</h1>
              <p className="text-[11px] text-slate-500 font-semibold uppercase">
                {roleLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
          {visibleNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <item.icon className="h-4 w-4 stroke-[2]" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout Button */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Staff'}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{user?.email || user?.phone || 'Logged in'}</p>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 uppercase tracking-wider shrink-0">
              {roleLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Account</span>
          </button>
        </div>

        <div className="p-2.5 border-t border-slate-200 text-[10px] font-medium text-slate-500 flex justify-between items-center bg-slate-100/50">
          <span>v1.0.0-mvp</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>
      </aside>
    </>
  );
}
