import { describe, expect, it } from 'vitest';
import type { MenuItem } from '../widget.props';
import {
  isMenuGroup,
  menuGroupId,
  menuItemCy,
  menuOpenGroups,
  menuPathTo,
  toggleMenuGroup,
} from './menu';

const items: MenuItem[] = [
  { label: 'Home', value: 'home' },
  {
    label: 'Settings',
    value: 'settings',
    items: [
      { label: 'Profile', value: 'profile' },
      {
        label: 'Billing',
        value: 'billing',
        items: [
          { label: 'Invoices', value: 'invoices' },
          { label: 'Payment', value: 'payment', items: [{ label: 'Cards', value: 'cards' }] },
        ],
      },
    ],
  },
];

describe('menu helpers', () => {
  it('tells a group from a destination', () => {
    expect(isMenuGroup(items[1])).toBe(true);
    expect(isMenuGroup(items[0])).toBe(false);
    expect(isMenuGroup({ label: 'Empty', value: 'empty', items: [] })).toBe(true);
  });

  it('builds the ids of a group and the data-cy of an item', () => {
    expect(menuGroupId('checkout-main', 'settings')).toBe('checkout-main_group_settings');
    expect(menuItemCy('main', 'profile')).toBe('main_item_profile');
  });

  it('finds the groups that hold the current item, outermost first, at any depth', () => {
    expect(menuPathTo(items, 'cards')).toEqual(['settings', 'billing', 'payment']);
    expect(menuPathTo(items, 'invoices')).toEqual(['settings', 'billing']);
    expect(menuPathTo(items, 'profile')).toEqual(['settings']);
    expect(menuPathTo(items, 'home')).toEqual([]);
    // A group as the current item opens the groups around it, not itself.
    expect(menuPathTo(items, 'billing')).toEqual(['settings']);
  });

  it('opens nothing for no current item, or one that is not in the menu', () => {
    expect(menuPathTo(items, undefined)).toEqual([]);
    expect(menuPathTo(items, '')).toEqual([]);
    expect(menuPathTo(items, 'nowhere')).toEqual([]);
    expect(menuPathTo(undefined, 'cards')).toEqual([]);
  });

  it('adds the way to the current item to the open groups, and keeps the others', () => {
    expect(menuOpenGroups([], items, 'invoices')).toEqual(['settings', 'billing']);
    expect(menuOpenGroups(['other'], items, 'profile')).toEqual(['other', 'settings']);
    expect(menuOpenGroups(['settings'], items, 'profile')).toEqual(['settings']);
  });

  it('opens and closes a group the user toggles', () => {
    expect(toggleMenuGroup(['settings'], 'billing', true)).toEqual(['settings', 'billing']);
    expect(toggleMenuGroup(['settings', 'billing'], 'settings', false)).toEqual(['billing']);
    expect(toggleMenuGroup([], 'billing', false)).toEqual([]);
  });
});
