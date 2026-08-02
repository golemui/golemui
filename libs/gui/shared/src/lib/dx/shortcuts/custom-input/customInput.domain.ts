import type { Validator } from '@golemui/gui-validators';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// Custom Input Decorator
// ═══════════════════════════════════════════════════

export interface CustomInputDecorator extends DxInputBase, DxCommonFields {
  customType: string;
  props?: Record<string, unknown>;
  validator?: Validator;
}

// ═══════════════════════════════════════════════════
// GSL Custom Input Types
// ═══════════════════════════════════════════════════

export interface GslCustomInputConfig extends GslConfigBase<CustomInputDecorator> {
  suppressAutomaticLabels?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI Custom Input Types
// ═══════════════════════════════════════════════════

export type CustomInputEntry = {
  key: string;
  def: DefOrCallback<CustomInputDecorator>;
};

export type GuiCustomInputShortcut = GuiShortcutOf<'CUSTOM_INPUT', CustomInputEntry>;
