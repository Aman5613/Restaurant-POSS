import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LogOut,
  UserCircle2,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Keyboard,
  Grid3X3,
  UtensilsCrossed,
  Receipt,
  ChefHat,
  Banknote,
  CalendarDays,
  Contact,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  Store,
  Menu,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuthStore, ROLE_PROFILES } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/db/dexie';
import { processOfflineQueue } from '@/lib/order-sync';
import { cn } from '@/lib/utils';
import { usePosStore } from '@/stores/pos-store';
import { apiClient } from '@/lib/api-client';

const TOP_NAV_ITEMS = {
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

export function Header() {
  const navigate = useNavigate();
  const { user, clearAuth, hasRole, quickLoginRole } = useAuthStore();
  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
  const { outlet, setOutlet } = usePosStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    if (!outlet) {
      apiClient
        .get('/v1/outlet/profile')
        .then((res) => {
          const o = res?.data?.outlet || res?.data;
          if (o) setOutlet(o);
        })
        .catch(() => {});
    }
  }, [outlet, setOutlet]);

  const isTopNavRole = user?.role === 'biller' || user?.role === 'captain' || user?.role === 'cook';
  const topNavLinks = isTopNavRole ? TOP_NAV_ITEMS[user?.role] || [] : [];

  const navigation = [
    { name: 'Tables', href: '/tables', icon: Grid3X3, roles: ['admin', 'manager', 'biller', 'captain'] },
    { name: 'Orders', href: '/orders', icon: UtensilsCrossed, roles: ['admin', 'manager', 'biller', 'captain'] },
    { name: 'All Bills', href: '/orders/list', icon: Receipt, roles: ['admin', 'manager', 'biller'] },
    { name: 'Kitchen KDS', href: '/kitchen', icon: ChefHat, roles: ['admin', 'manager', 'biller', 'captain', 'cook'] },
    { name: 'KOT Queue', href: '/kot', icon: Receipt, roles: ['admin', 'manager', 'biller', 'captain', 'cook'] },
    { name: 'Billing', href: '/billing', icon: Banknote, roles: ['admin', 'manager', 'biller'] },
    { name: 'Day Ops', href: '/day-ops', icon: CalendarDays, roles: ['admin', 'manager', 'biller'] },
    { name: 'Customers', href: '/customers', icon: Contact, roles: ['admin', 'manager', 'biller'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Manager', href: '/manager', icon: ShieldCheck, roles: ['admin', 'manager'] },
    { name: 'Owner Hub', href: '/admin', icon: Store, roles: ['admin'] },
    { name: 'Super Admin', href: '/super-admin', icon: ShieldCheck, roles: ['super-admin'] },
  ];

  const visibleNav = navigation.filter((item) => hasRole(item.roles));

  // Live count of pending items in sync queue
  const pendingCount = useLiveQuery(
    () => db.syncQueue.where('status').equals('PENDING').count(),
    [],
    0
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await processOfflineQueue();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleSwitchRole = (roleKey) => {
    quickLoginRole(roleKey);
    setShowRoleMenu(false);
    if (roleKey === 'super-admin') {
      navigate('/super-admin');
    } else if (roleKey === 'admin') {
      navigate('/admin');
    } else if (roleKey === 'manager') {
      navigate('/manager');
    } else if (roleKey === 'cook') {
      navigate('/kitchen');
    } else {
      navigate('/tables');
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-3 sm:px-6 flex items-center justify-between shadow-xs select-none gap-2 sm:gap-4">
      {/* Left: Mobile Hamburger & Outlet Context */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 -ml-1 sm:-ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Store className="h-4 w-4 text-slate-500 hidden sm:inline" />
          <span className="font-bold text-slate-800 text-sm tracking-tight truncate max-w-[120px] sm:max-w-none">
            {outlet?.name || 'Restaurant POS'}
          </span>
          <span className="text-slate-300 hidden md:inline">•</span>
          <span className="text-xs text-slate-500 font-medium hidden md:inline">
            {outlet?.address?.city || outlet?.address?.state || 'Main Outlet'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
            {user?.role || 'Staff'}
          </span>
        </div>
      </div>

      {/* Center: Top Navbar Navigation for Biller & Captain on Laptop/Desktop */}
      {isTopNavRole && topNavLinks.length > 0 && (
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {topNavLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )
              }
            >
              <item.icon className="h-3.5 w-3.5 stroke-[2]" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      )}

      {/* Right: Quick Role Switcher, Online Indicator, User Profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Sync & Connectivity */}
        <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-200">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Offline
            </span>
          )}

          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-800 border border-amber-200">
              {pendingCount}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing}
            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            title="Sync offline data"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-rose-600' : ''}`} />
          </Button>
        </div>

        {/* Quick Role Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-all shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span className="capitalize">{user?.role || 'Switch Role'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Quick Role Switch
              </p>
              {Object.entries(ROLE_PROFILES).map(([key, prof]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSwitchRole(key)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.role === key ? 'bg-rose-50/70 text-rose-700 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="capitalize font-semibold">{prof.role}</p>
                    <p className="text-[10px] text-slate-400">{prof.name}</p>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-500">
                    PIN {prof.pin}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Trigger */}
        <button
          type="button"
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors hidden md:block"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right text-xs hidden sm:block">
            <p className="font-bold text-slate-900 leading-tight">{user?.name || 'Cashier'}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.email || 'Logged in'}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold h-8 px-2.5 gap-1"
            onClick={handleLogout}
            title="Log out and return to login screen"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Popover Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-rose-600" />
              Cashier & Waiter Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Search Items</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded font-mono font-bold text-slate-800">/</kbd>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Settle / Pay Bill</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded font-mono font-bold text-slate-800">F2</kbd>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Send to Kitchen (KOT)</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded font-mono font-bold text-slate-800">F3</kbd>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Floor / Tables View</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded font-mono font-bold text-slate-800">F4</kbd>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Cancel / Close Modal</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded font-mono font-bold text-slate-800">Esc</kbd>
              </div>
            </div>
            <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs" onClick={() => setShowShortcuts(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
