import { describe, expect, it } from 'vitest';
import { isMenuSeparator, menuButtonAriaLabel, menuButtonClasses, menuPanelId } from './menu';

describe('menu helpers', () => {
  it('names the panel after the widget uid, row index included', () => {
    expect(menuPanelId('rowActions[2]')).toBe('rowActions[2]_menu');
  });

  it('tells a separator from an action', () => {
    expect(isMenuSeparator({ separator: true })).toBe(true);
    expect(isMenuSeparator({ label: 'Edit', value: 'edit' })).toBe(false);
  });

  it('names the button with ariaLabel only when it shows no label', () => {
    expect(menuButtonAriaLabel(undefined, 'Row actions')).toBe('Row actions');
    expect(menuButtonAriaLabel('Actions', 'Row actions')).toBeUndefined();
    expect(menuButtonAriaLabel(undefined, undefined)).toBeUndefined();
  });

  it('gives the button the gui-button classes for its variant and icon', () => {
    expect(menuButtonClasses({})).toBe('gui-button gui-button-icon-left');
    expect(
      menuButtonClasses({ variant: 'outlined', icon: 'more_vert', iconPosition: 'right' }),
    ).toBe('gui-button gui-button-icon-right gui-button-with-icon gui-button--outlined');
  });
});
