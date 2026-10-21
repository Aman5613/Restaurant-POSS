import React from 'react';
import { NavLink } from 'react-router-dom';
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
  ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { user, hasRole } = useAuthStore();

  const navigation = [
    { name: 'Floor View', href: '/tables', icon: Grid3X3, roles: ['admin', 'manager', 'biller', 'captain'] },
    { name: 'Order Screen', href: '/orders', icon: UtensilsCrossed, roles: ['admin', 'manager', 'biller', 'captain'] },
    { name: 'All Orders', href: '/orders/list', icon: Receipt, roles: ['admin', 'manager', 'biller'] },
    { name: 'KOT Queue', href: '/kot', icon: ChefHat, roles: ['admin', 'manager', 'biller', 'captain'] },
    { name: 'Billing & Cashier', href: '/billing', icon: Banknote, roles: ['admin', 'manager', 'biller'] },
    { name: 'Day Operations', href: '/day-ops', icon: CalendarDays, roles: ['admin', 'manager', 'biller'] },
    { name: 'Customer Ledger', href: '/customers', icon: Contact, roles: ['admin', 'manager', 'biller'] },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Audit Trail', href: '/audit-logs', icon: ShieldAlert, roles: ['admin', 'manager'] },
    { name: 'Menu Editor', href: '/menu', icon: LayoutDashboard, roles: ['admin', 'manager'] },
    { name: 'Staff & Roles', href: '/users', icon: Users, roles: ['admin', 'manager'] },
    { name: 'Outlet Settings', href: '/settings', icon: Settings, roles: ['admin'] },
    { name: 'Super Admin', href: '/super-admin', icon: ShieldCheck, roles: ['super-admin'] },
  ];

  const visibleNav = navigation.filter((item) => hasRole(item.roles));

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen select-none">
      <div className="h-16 flex items-center px-6 border-b gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
          🍽️
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">RestoPOS</h1>
          <p className="text-xs text-muted-foreground font-medium">
            {user?.role ? user.role.toUpperCase() : 'COUNTER'}
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t text-xs text-muted-foreground flex justify-between items-center">
        <span>v1.0.0-mvp</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </span>
      </div>
    </aside>
  );
}
