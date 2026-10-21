import React, { useState, useEffect } from 'react';
import {
  LogOut,
  UserCircle2,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Keyboard,
  CheckCircle2,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/db/dexie';
import { processOfflineQueue } from '@/lib/order-sync';

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Main Outlet — Bandra West
          </h2>
          <p className="text-[11px] text-muted-foreground">Terminal POS-01</p>
        </div>

        <Badge variant="default" className="text-xs bg-emerald-600">
          Day OPEN
        </Badge>

        {/* Online / Offline & Sync Indicator */}
        <div className="flex items-center gap-2 pl-3 border-l">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="h-3.5 w-3.5" />
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <WifiOff className="h-3.5 w-3.5" />
              Offline Mode
            </span>
          )}

          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
              {pendingCount} pending sync
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Flush local offline queue to server"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Keyboard Shortcuts Dialog Trigger */}
        <button
          type="button"
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l">
          <UserCircle2 className="h-6 w-6 text-muted-foreground" />
          <div className="text-left text-xs">
            <p className="font-semibold">{user?.name || 'Cashier User'}</p>
            <p className="text-muted-foreground capitalize">{user?.role || 'Biller'}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 text-xs"
          onClick={clearAuth}
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          Logout
        </Button>
      </div>

      {/* Keyboard Shortcuts Popover Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-primary" />
              Cashier & Waiter Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-xs divide-y">
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Search Items</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono font-bold">/</kbd>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Settle / Pay Bill</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono font-bold">F2</kbd>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Send to Kitchen (KOT)</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono font-bold">F3</kbd>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Floor / Tables View</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono font-bold">F4</kbd>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Cancel / Close Modal</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono font-bold">Esc</kbd>
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={() => setShowShortcuts(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
