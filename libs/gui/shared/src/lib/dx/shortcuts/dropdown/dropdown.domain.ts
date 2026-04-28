import type { Validator } from '@golemui/gui-validators';
import type { DropdownProps, ListItem, OptionValue } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type {
  DefOrCallback,
  GslConfigBase,
  GuiShortcutOf,
} from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Dropdown Decorator
// ═══════════════════════════════════════════════════

export interface DropdownDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<Omit<DropdownProps<any>, 'items'>> {
  type: 'dropdown';
  items?: ListItem<any>[] | OptionValue[] | Record<string, unknown>[];
  validator?: Validator;
}

// ═══════════════════════════════════════════════════
// GSL Dropdown Types
// ═══════════════════════════════════════════════════

export interface GslDropdownConfig extends GslConfigBase<DropdownDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI Dropdown Types
// ═══════════════════════════════════════════════════

export type DropdownEntry = {
  key: string;
  def: DefOrCallback<DropdownDecorator>;
};

export type GuiDropdownShortcut = GuiShortcutOf<'DROPDOWN', DropdownEntry>;
