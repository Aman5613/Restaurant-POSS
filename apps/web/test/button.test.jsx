import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../src/components/ui/button';

describe('Button Component', () => {
  it('renders correctly with default styles', () => {
    const { container } = render(<Button>Click Me</Button>);
    expect(container.textContent).toContain('Click Me');
  });

  it('renders destructive variant', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild.className).toContain('bg-destructive');
  });
});
