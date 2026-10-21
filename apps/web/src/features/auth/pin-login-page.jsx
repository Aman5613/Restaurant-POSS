import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { KeyRound, Delete, UserCheck, ArrowLeft } from 'lucide-react';

export function PinLoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      setError('Please enter a valid 4-6 digit PIN');
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
      navigate('/');
    } catch (err) {
      setError(err.message || 'PIN verification failed');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-sm bg-card border-slate-800 shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl mb-1">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">Counter PIN Login</CardTitle>
          <CardDescription className="text-xs">
            Enter your 4-digit staff PIN to unlock terminal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-2.5 text-xs text-center rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          {/* PIN Dots Indicator */}
          <div className="flex justify-center gap-4 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full border transition-all duration-150 ${
                  pin.length > idx
                    ? 'bg-primary border-primary scale-125'
                    : 'bg-muted border-input'
                }`}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                className="h-14 text-xl font-bold rounded-lg border-input hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                onClick={() => handleKeyPress(num)}
                disabled={isLoading}
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              className="h-14 text-sm font-medium text-destructive hover:bg-destructive/10"
              onClick={() => setPin('')}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 text-xl font-bold rounded-lg border-input hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
              onClick={() => handleKeyPress(0)}
              disabled={isLoading}
            >
              0
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 rounded-lg"
              onClick={handleBackspace}
              disabled={isLoading}
            >
              <Delete className="h-6 w-6 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            className="w-full font-bold h-11"
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
            className="text-xs text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/login">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Admin Email Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
