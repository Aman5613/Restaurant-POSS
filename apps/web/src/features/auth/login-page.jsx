import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Lock, Smartphone } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-card border-slate-800 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl">
            🍽️
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">RestoPOS Login</CardTitle>
          <CardDescription>
            Admin & Store Manager Portal
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Email or Mobile Number
              </label>
              <Input
                type="text"
                placeholder="e.g. admin@pos.internal or 9999999999"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
              <Lock className="h-4 w-4 mr-2" />
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="relative w-full text-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <span className="relative bg-card px-2 text-xs text-muted-foreground uppercase">
                Or
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              asChild
            >
              <Link to="/pin-login">
                <Smartphone className="h-4 w-4 mr-2 text-emerald-500" />
                Switch to Quick PIN Login (Cashier / Waiter)
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
