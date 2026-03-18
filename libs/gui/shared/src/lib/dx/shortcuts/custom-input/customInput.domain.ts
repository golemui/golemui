import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type {
  DefOrCallback,
  GslConfigBase,
  GuiShortcutOf,
} from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Custom Input Decorator
// ═══════════════════════════════════════════════════

export interface CustomInputDecorator extends DxInputBase, DxCommonFields {
  customType: string;
  props?: Record<string, unknown>;
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
