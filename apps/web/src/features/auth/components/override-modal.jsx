import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldAlert, Delete } from 'lucide-react';

export function OverrideModal({
  isOpen,
  title = 'Manager Override Required',
  actionDescription,
  onSuccess,
  onCancel,
}) {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter a 4-6 digit manager PIN');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Please provide a reason for the override');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Simulated local override verification or direct API call
      const res = await fetch('/v1/auth/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerPin: pin,
          action: actionDescription || 'HIGH_PRIVILEGE_ACTION',
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid manager PIN');
      }

      setPin('');
      setReason('');
      onSuccess(data);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-sm border shadow-xl bg-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <CardDescription className="text-xs">
            {actionDescription || 'Authorization needed to proceed'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Reason for Override
            </label>
            <Input
              type="text"
              placeholder="e.g. Customer changed mind, accidental punch"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5 text-center">
              Enter Manager PIN
            </label>
            {/* PIN Dots */}
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-4 w-4 rounded-full border transition-all ${
                    pin.length > idx
                      ? 'bg-primary border-primary scale-110'
                      : 'bg-muted border-input'
                  }`}
                />
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => handleKeyPress(num)}
                >
                  {num}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                className="h-12 text-sm text-destructive"
                onClick={() => setPin('')}
              >
                Clear
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 text-lg font-semibold"
                onClick={() => handleKeyPress(0)}
              >
                0
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={handleBackspace}
              >
                <Delete className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-center text-destructive font-medium">{error}</p>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting || pin.length < 4}
          >
            {isSubmitting ? 'Verifying...' : 'Authorize'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
