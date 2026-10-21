import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OverrideModal } from '../src/features/auth/components/override-modal';

describe('OverrideModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <OverrideModal isOpen={false} actionDescription="Test Action" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal title and action description when open', () => {
    render(
      <OverrideModal
        isOpen={true}
        title="Manager Approval Needed"
        actionDescription="Cancel KOT Item #12"
        onCancel={() => {}}
        onSuccess={() => {}}
      />
    );
    expect(screen.getByText('Manager Approval Needed')).toBeDefined();
    expect(screen.getByText('Cancel KOT Item #12')).toBeDefined();
    expect(screen.getByText('Enter Manager PIN')).toBeDefined();
  });
});
