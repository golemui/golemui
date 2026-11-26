import { describe, expect, it } from 'vitest';
import { widgetTooltip } from './tooltip';

describe('widgetTooltip', () => {
  it('describes a button that has a label or an ariaLabel', () => {
    expect(widgetTooltip('checkout-delete', 'Deletes the order', 'Delete', undefined)).toEqual({
      text: 'Deletes the order',
      id: 'checkout-delete_tooltip',
      type: 'description',
    });
    expect(widgetTooltip('checkout-delete', 'Deletes the order', '', 'Delete')?.type).toBe(
      'description',
    );
  });

  it('names a button that has neither', () => {
    expect(widgetTooltip('checkout-rowActions[2]', 'Row actions', undefined, '')).toEqual({
      text: 'Row actions',
      id: 'checkout-rowActions[2]_tooltip',
      type: 'label',
    });
    expect(widgetTooltip('checkout-close', 'Close', '', '  ')?.type).toBe('label');
  });

  it('shows no tooltip without a text', () => {
    expect(widgetTooltip('checkout-close', '', undefined, undefined)).toBeUndefined();
    expect(widgetTooltip('checkout-close', '  ', 'Close', undefined)).toBeUndefined();
    expect(widgetTooltip('checkout-close', undefined, 'Close', undefined)).toBeUndefined();
    expect(
      widgetTooltip('checkout-close', { key: 'untranslated' }, 'Close', undefined),
    ).toBeUndefined();
  });
});
