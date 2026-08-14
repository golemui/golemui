import type { Validator } from '@golemui/gui-validators';
import type { ListItem, MultiDropdownProps, OptionValue } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// MultiDropdown Decorator
// ═══════════════════════════════════════════════════

export interface MultiDropdownDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<Omit<MultiDropdownProps<any>, 'items'>> {
  type: 'multiDropdown';
  items?: ListItem<any>[] | OptionValue[] | Record<string, unknown>[];
  validator?: Validator;
}

// ═══════════════════════════════════════════════════
// GSL MultiDropdown Types
// ═══════════════════════════════════════════════════

export interface GslMultiDropdownConfig extends GslConfigBase<MultiDropdownDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI MultiDropdown Types
// ═══════════════════════════════════════════════════

export type MultiDropdownEntry = {
  key: string;
  def: DefOrCallback<MultiDropdownDecorator>;
};

export type GuiMultiDropdownShortcut = GuiShortcutOf<'MULTI_DROPDOWN', MultiDropdownEntry>;
