/**
 * @internal Used by the framework menu widgets, not part of the end-user public API.
 *
 * The parts of the navigation menu widget the four adapters must render the same way.
 */
import type { MenuItem } from '../widget.props';

/** Whether a menu item is a group: it holds items, and its button opens them. */
export function isMenuGroup(item: MenuItem): item is MenuItem & { items: MenuItem[] } {
  return Array.isArray(item.items);
}

/**
 * The id of a group's list, which its button names in `aria-controls`, or in `popovertarget` for
 * a dropdown.
 *
 * @param domId - The menu widget's DOM id.
 * @param value - The group's value.
 * @example
 * menuGroupId('checkout-main', 'settings'); // 'checkout-main_group_settings'
 */
export function menuGroupId(domId: string, value: string): string {
  return `${domId}_group_${value}`;
}

/** The `data-cy` of an item's button, group or destination, from the bare uid. */
export function menuItemCy(uid: string, value: string): string {
  return `${uid}_item_${value}`;
}

/**
 * The values of the groups that hold the item `current` names, outermost first: the groups that
 * open to show where the user is. Empty when no item has that value.
 */
export function menuPathTo(items: readonly MenuItem[] | undefined, current: unknown): string[] {
  if (typeof current !== 'string' || current === '') return [];
  for (const item of items ?? []) {
    if (item.value === current) return [];
    if (!isMenuGroup(item)) continue;
    const inner = menuPathTo(item.items, current);
    if (inner.length > 0 || item.items.some((child) => child.value === current)) {
      return [item.value, ...inner];
    }
  }
  return [];
}

/**
 * The groups open now: the ones already open, and the ones on the way to the current item, which
 * open whenever `current` changes. The user's own toggles stay until then.
 *
 * @param open - The values of the groups open so far.
 */
export function menuOpenGroups(
  open: readonly string[],
  items: readonly MenuItem[] | undefined,
  current: unknown,
): string[] {
  const path = menuPathTo(items, current).filter((value) => !open.includes(value));
  return path.length > 0 ? [...open, ...path] : [...open];
}

/** The groups open after the user opened or closed one. */
export function toggleMenuGroup(open: readonly string[], value: string, isOpen: boolean): string[] {
  const without = open.filter((group) => group !== value);
  return isOpen ? [...without, value] : without;
}
