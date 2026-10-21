import * as React from 'react';
import { cn } from '@/lib/utils';

function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
    outline: 'text-foreground',
    vacant: 'bg-emerald-500 text-white',
    occupied: 'bg-blue-500 text-white',
    billed: 'bg-amber-500 text-white',
    reserved: 'bg-purple-500 text-white',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
