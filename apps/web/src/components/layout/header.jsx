import React from 'react';
import { LogOut, UserCircle2, Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { user, clearAuth } = useAuthStore();

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">
          Main Outlet — Bandra West
        </h2>
        <Badge variant="default" className="text-xs bg-emerald-600">
          Day OPEN
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
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
          className="text-destructive hover:bg-destructive/10"
          onClick={clearAuth}
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          Logout
        </Button>
      </div>
    </header>
  );
}
