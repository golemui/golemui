import { describe, expect, it } from 'vitest';
import { tooltipId, tooltipText } from './tooltip';

describe('tooltip helpers', () => {
  it('builds the id of the tooltip from the id of its button', () => {
    expect(tooltipId('checkout-delete')).toBe('checkout-delete_tooltip');
    expect(tooltipId('checkout-rowActions[2]')).toBe('checkout-rowActions[2]_tooltip');
  });

  it('shows a tooltip only for a text', () => {
    expect(tooltipText('Delete the order')).toBe('Delete the order');
    expect(tooltipText('')).toBeUndefined();
    expect(tooltipText('  ')).toBeUndefined();
    expect(tooltipText(undefined)).toBeUndefined();
    expect(tooltipText({ key: 'untranslated' })).toBeUndefined();
  });
});
