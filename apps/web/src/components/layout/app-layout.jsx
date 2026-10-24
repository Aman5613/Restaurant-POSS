import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { useSocket } from '@/hooks/use-socket';
import { requestAndSubscribePush } from '@/lib/push-notifications';
import { isKotRinging, stopKotRinger, isReadyRinging, stopReadyRinger } from '@/lib/sound-effects';
import { Bell, VolumeX, AlertCircle, ChefHat, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize real-time multi-outlet socket room listener
  useSocket();

  // Notification prompt state
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Active alarm states
  const [kotAlarmActive, setKotAlarmActive] = useState(false);
  const [readyAlarmActive, setReadyAlarmActive] = useState(false);

  // Check alarm states at regular intervals
  useEffect(() => {
    const interval = setInterval(() => {
      setKotAlarmActive(isKotRinging());
      setReadyAlarmActive(isReadyRinging());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Check & register Web Push
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        // Auto-refresh subscription in background
        requestAndSubscribePush({ user, outletId: user.outletId }).catch(() => {});
      } else if (Notification.permission === 'default') {
        setShowPushPrompt(true);
      }
    }
  }, [isAuthenticated, user]);

  const handleEnablePush = async () => {
    setIsSubscribing(true);
    try {
      await requestAndSubscribePush({ user, outletId: user.outletId });
      setShowPushPrompt(false);
    } catch (_err) {
      // ignore
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Mandatory Store Onboarding: Admin must complete setup before dashboard
  if (user?.role === 'admin' && user?.isSetupCompleted === false) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 select-none flex-col">
      {/* 1. Active KOT Alarm Banner (Cook) */}
      {kotAlarmActive && (
        <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between shadow-lg animate-pulse z-50">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 animate-bounce" />
            <span className="font-black text-sm">
              🔥 NEW KOT ARRIVED! Kitchen alarm ringing...
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                stopKotRinger();
                setKotAlarmActive(false);
                navigate('/kitchen');
              }}
              className="bg-white text-rose-700 hover:bg-rose-50 border-white text-xs font-bold"
            >
              <VolumeX className="w-4 h-4 mr-1" />
              Silence & View KOT
            </Button>
          </div>
        </div>
      )}

      {/* 2. Active Food Ready Alarm Banner (Captain / Biller) */}
      {readyAlarmActive && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between shadow-lg animate-pulse z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 animate-bounce" />
            <span className="font-black text-sm">
              🍽️ DISH IS READY! Kitchen has prepared items for pickup.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                stopReadyRinger();
                setReadyAlarmActive(false);
                navigate('/tables');
              }}
              className="bg-white text-emerald-700 hover:bg-emerald-50 border-white text-xs font-bold"
            >
              <VolumeX className="w-4 h-4 mr-1" />
              Acknowledge & View Floor
            </Button>
          </div>
        </div>
      )}

      {/* 3. Browser Push Permission Prompt */}
      {showPushPrompt && (
        <div className="bg-indigo-900 text-indigo-100 px-4 py-2 text-xs flex items-center justify-between border-b border-indigo-800 z-40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>Enable Device Push Notifications</strong> to receive loud alerts when screen is locked or app is in background.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={isSubscribing}
              onClick={handleEnablePush}
              className="h-7 px-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs"
            >
              {isSubscribing ? 'Enabling...' : 'Enable Alerts'}
            </Button>
            <button
              onClick={() => setShowPushPrompt(false)}
              className="text-indigo-300 hover:text-white text-xs underline ml-1"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* App Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
