import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, ROLE_PROFILES, getRoleHome } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Lock, Smartphone, ShieldCheck, Zap, Info } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, setAuth, quickLoginRole } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getRoleHome(user?.role), { replace: true });
    }
  }, [isAuthenticated, user?.role, navigate]);

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
      navigate(getRoleHome(data.user?.role, data.user?.isSetupCompleted), { replace: true });
    } catch (err) {
      // Fallback check against seeded profiles if API is offline or returns error
      const trimmed = identifier.trim().toLowerCase();
      const matchedProfile = Object.values(ROLE_PROFILES).find(
        (p) => p.email.toLowerCase() === trimmed || p.phone === trimmed
      );

      if (matchedProfile && (password === 'Pos@12345' || password.length >= 4)) {
        quickLoginRole(matchedProfile.role);
        navigate(getRoleHome(matchedProfile.role), { replace: true });
        return;
      }

      setError(err.message || 'Unable to connect to server');
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
      <div className="w-full max-w-md space-y-4">
        <Card className="bg-white border-slate-200 shadow-xl rounded-2xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto h-12 w-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-2xl shadow-xs">
              🍽️
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">RestoPOS Login</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your credentials to access your restaurant dashboard
            </CardDescription>
          </CardHeader>

          {/* Super Admin Quick Login Card */}
          <div className="px-6 pb-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0">👑</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Platform Super Admin</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">superadmin@pos.internal</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3 font-semibold shrink-0 shadow-xs"
                onClick={() => handleQuickRole('super-admin')}
              >
                1-Click Super Admin
              </Button>
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
                  placeholder="e.g. superadmin@pos.internal or 9999999999"
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
