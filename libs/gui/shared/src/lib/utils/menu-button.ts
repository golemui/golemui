/**
 * @internal Used by the framework menuButton widgets, not part of the end-user public API.
 *
 * The parts of the menuButton widget the four adapters must render the same way.
 */
import type { MenuButtonItem, MenuButtonProps, MenuButtonSeparator } from '../widget.props';

/** Where a menu opens when its props don't say. */
export const DEFAULT_MENU_BUTTON_PLACEMENT = 'bottom-start';

/**
 * The id of a menu's panel, which its button names in `popovertarget`.
 *
 * @param uid - The menuButton widget's uid, row index suffix included.
 * @example
 * menuButtonPanelId('rowActions[2]'); // 'rowActions[2]_menu'
 */
export function menuButtonPanelId(uid: string): string {
  return `${uid}_menu`;
}

/** Whether a menu item is a separator rather than an action. */
export function isMenuButtonSeparator(item: MenuButtonItem): item is MenuButtonSeparator {
  return (item as MenuButtonSeparator).separator === true;
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
 * `<gui-button>`, so `gui-menu-button` finds it, named by `popovertarget`, as soon as both connect.
 */
export function menuButtonClasses({
  variant,
  icon,
  iconPosition,
}: Pick<MenuButtonProps, 'variant' | 'icon' | 'iconPosition'>): string {
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
