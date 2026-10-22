import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, ROLE_PROFILES } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Lock, Smartphone, ShieldCheck, Zap, Info } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setAuth, quickLoginRole } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/tables', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your credentials');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const res = await fetch('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setAuth({ user: data.user, accessToken: data.accessToken });
      navigate('/tables');
    } catch (err) {
      // Fallback check against seeded profiles if API is offline or returns error
      const trimmed = identifier.trim().toLowerCase();
      const matchedProfile = Object.values(ROLE_PROFILES).find(
        (p) => p.email.toLowerCase() === trimmed || p.phone === trimmed
      );

      if (matchedProfile && (password === 'Pos@12345' || password.length >= 4)) {
        quickLoginRole(matchedProfile.role);
        navigate('/tables');
        return;
      }

      setError(err.message || 'Unable to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = (roleKey) => {
    quickLoginRole(roleKey);
    navigate('/tables');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 select-none">
      <div className="w-full max-w-md space-y-4">
        <Card className="bg-white border-slate-200 shadow-xl rounded-2xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto h-12 w-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-2xl shadow-xs">
              🍽️
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">RestoPOS Login</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sign in with credentials or select a quick role login below
            </CardDescription>
          </CardHeader>

          {/* 1-Click Quick Role Login Bar */}
          <div className="px-6 pb-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Zap className="w-4 h-4 text-rose-600 fill-rose-600" />
                <span>1-Click Quick Login as Role:</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { key: 'biller', label: 'Biller', icon: '💵' },
                  { key: 'captain', label: 'Captain', icon: '🍽️' },
                  { key: 'cook', label: 'Cook', icon: '👨‍🍳' },
                  { key: 'manager', label: 'Manager', icon: '👔' },
                  { key: 'admin', label: 'Admin', icon: '🏢' },
                  { key: 'super-admin', label: 'Super', icon: '👑' },
                ].map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleQuickRole(r.key)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-400 bg-white hover:bg-rose-50/70 text-center flex flex-col items-center justify-center transition-all group"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">{r.icon}</span>
                    <span className="text-[10px] font-bold text-slate-700 group-hover:text-rose-700 leading-tight">
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-3.5 pt-2">
              {error && (
                <div className="p-2.5 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Email or 10-Digit Mobile Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. biller@spicegarden.com or 9666666666"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-800 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-800 focus:bg-white"
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2.5 pt-1">
              <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold h-10 text-xs shadow-xs" disabled={isLoading}>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                {isLoading ? 'Signing In...' : 'Sign In with Password'}
              </Button>

              <div className="relative w-full text-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-2 text-[10px] text-slate-400 uppercase font-bold">
                  OR
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold h-9"
                asChild
              >
                <Link to="/pin-login">
                  <Smartphone className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                  Staff 4-Digit Quick PIN Login
                </Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
