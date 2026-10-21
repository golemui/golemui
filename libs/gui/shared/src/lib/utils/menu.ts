/**
 * @internal Used by framework menu widgets, not part of the end-user public API.
 *
 * The parts of the menu widget the four adapters must render the same way.
 */
import type { MenuItem, MenuProps, MenuSeparator } from '../widget.props';

/** Where a menu opens when its props don't say. */
export const DEFAULT_MENU_PLACEMENT = 'bottom-start';

/**
 * The id of a menu's panel, which its button names in `popovertarget`.
 *
 * @param uid - The menu widget's uid, row index suffix included.
 * @example
 * menuPanelId('rowActions[2]'); // 'rowActions[2]_menu'
 */
export function menuPanelId(uid: string): string {
  return `${uid}_menu`;
}

/** Whether a menu item is a separator rather than an action. */
export function isMenuSeparator(item: MenuItem): item is MenuSeparator {
  return (item as MenuSeparator).separator === true;
}

/**
 * The `aria-label` of a menu's button: its `ariaLabel`, only when the button shows no label, so a
 * visible label always stays the button's name. Undefined leaves the attribute out.
 *
 * @param label - The widget's label, already translated.
 * @param ariaLabel - The widget's `ariaLabel` prop, already translated.
 */
export function menuButtonAriaLabel(label: unknown, ariaLabel: unknown): string | undefined {
  if (label || typeof ariaLabel !== 'string' || ariaLabel === '') return undefined;
  return ariaLabel;
}

/**
 * The classes of a menu's button. It is a native `<button>` styled as a `gui-button`, not a
 * `<gui-button>`, so `gui-menu` finds it, named by `popovertarget`, as soon as both connect.
 */
export function menuButtonClasses({
  variant,
  icon,
  iconPosition,
}: Pick<MenuProps, 'variant' | 'icon' | 'iconPosition'>): string {
  return [
    'gui-button',
    `gui-button-icon-${iconPosition || 'left'}`,
    icon ? 'gui-button-with-icon' : '',
    variant === 'outlined' ? 'gui-button--outlined' : '',
    variant === 'link' ? 'gui-button--link' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
