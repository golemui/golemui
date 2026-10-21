import type { MenuItem, MenuProps } from '../../../widget.props';
import type { DxActionBase, DxCommonFields, DxEventHandler } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// Menu Decorator
// ═══════════════════════════════════════════════════

export interface MenuDecorator extends DxCommonFields, Omit<MenuProps, 'items'> {
  /** The text of the button that opens the menu. Without one, set `ariaLabel` and an `icon`. */
  label?: DxActionBase['label'];
  /** The menu's actions, with `{ separator: true }` between groups. */
  items: MenuItem[];
  /** Disables the button, so the menu can't open. */
  disabled?: DxActionBase['disabled'];
  /**
   * Runs when the user picks an item: `event.detail.value` is the item's `value`. Return a
   * string from a handler with no parameters to dispatch that event name to the host instead.
   */
  onClick?: DxEventHandler;
}

// ═══════════════════════════════════════════════════
// GSL Menu Types
// ═══════════════════════════════════════════════════

export type GslMenusConfig = GslConfigBase<MenuDecorator>;

// ═══════════════════════════════════════════════════
// GUI Menu Types
// ═══════════════════════════════════════════════════

export type MenuEntry = DefOrCallback<MenuDecorator>;

export type GuiMenuShortcut = GuiShortcutOf<'MENUS', MenuEntry>;
