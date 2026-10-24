import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, ROLE_PROFILES, getRoleHome } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { KeyRound, Delete, UserCheck, ArrowLeft, Zap } from 'lucide-react';

export function PinLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, setAuth, quickLoginRole } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getRoleHome(user?.role), { replace: true });
    }
  }, [isAuthenticated, user?.role, navigate]);

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handlePinSubmit = async (overridePin) => {
    const activePin = overridePin || pin;
    if (activePin.length < 4) {
      setError('Please enter a valid 4-digit PIN');
      return;
    }

    // Check against known role PINs first for instant offline/counter unlocking
    const matchedRole = Object.keys(ROLE_PROFILES).find(
      (k) => ROLE_PROFILES[k].pin === activePin
    );

    if (matchedRole) {
      quickLoginRole(matchedRole);
      navigate(getRoleHome(matchedRole), { replace: true });
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const res = await fetch('/v1/auth/pin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-outlet-id': 'default-outlet',
        },
        body: JSON.stringify({
          deviceId: 'device-pos-counter-1',
          pin: activePin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid PIN');
      }

      setAuth({ user: data.user, accessToken: data.accessToken });
      navigate(getRoleHome(data.user?.role, data.user?.isSetupCompleted), { replace: true });
    } catch (err) {
      setError(err.message || 'PIN verification failed');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = (roleKey) => {
    quickLoginRole(roleKey);
    navigate(getRoleHome(roleKey), { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 select-none">
      <div className="w-full max-w-sm space-y-4">
        <Card className="bg-white border-slate-200 shadow-xl rounded-2xl">
          <CardHeader className="text-center space-y-1 pb-3">
            <div className="mx-auto h-11 w-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-xl mb-1 shadow-xs">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">Counter PIN Login</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your assigned staff PIN on the keypad
            </CardDescription>
          </CardHeader>

          {/* Super Admin PIN Shortcut */}
          <div className="px-5 pb-1">
            <button
              type="button"
              onClick={() => handlePinSubmit('9999')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-800 shadow-2xs"
            >
              <span className="flex items-center gap-1.5">
                <span>👑</span> Super Admin (PIN: 9999)
              </span>
              <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Tap to Fill
              </span>
            </button>
          </div>

          <CardContent className="space-y-3 pt-2">
            {error && (
              <div className="p-2 text-xs text-center rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                {error}
              </div>
            )}

            {/* PIN Dots Indicator */}
            <div className="flex justify-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-3.5 w-3.5 rounded-full border transition-all duration-150 ${pin.length > idx
                      ? 'bg-rose-600 border-rose-600 scale-125 shadow-xs'
                      : 'bg-slate-100 border-slate-300'
                    }`}
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="h-12 text-lg font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 active:bg-rose-50 active:scale-95 text-slate-800 transition-all shadow-xs"
                  onClick={() => handleKeyPress(num)}
                  disabled={isLoading}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="h-12 text-xs font-semibold text-rose-600 rounded-lg hover:bg-rose-50 active:scale-95 transition-all"
                onClick={() => setPin('')}
                disabled={isLoading}
              >
                Clear
              </button>
              <button
                type="button"
                className="h-12 text-lg font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 active:bg-rose-50 active:scale-95 text-slate-800 transition-all shadow-xs"
                onClick={() => handleKeyPress(0)}
                disabled={isLoading}
              >
                0
              </button>
              <button
                type="button"
                className="h-12 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white flex items-center justify-center text-slate-600 active:scale-95 transition-all shadow-xs"
                onClick={handleBackspace}
                disabled={isLoading}
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 text-xs shadow-xs"
              onClick={() => handlePinSubmit()}
              disabled={isLoading || pin.length < 4}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {isLoading ? 'Unlocking...' : 'Unlock Terminal'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-slate-800 h-8"
              asChild
            >
              <Link to="/login">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Admin Email Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
