import type { DxCommonFields, DxDisplayBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Custom Display Decorator
// ═══════════════════════════════════════════════════

export interface CustomDisplayDecorator extends DxDisplayBase, DxCommonFields {
  customType: string;
  props?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════
// GSL Custom Display Types
// ═══════════════════════════════════════════════════

export type GslCustomDisplayConfig = GslConfigBase<CustomDisplayDecorator>;

// ═══════════════════════════════════════════════════
// GUI Custom Display Types
// ═══════════════════════════════════════════════════

export type CustomDisplayEntry = DefOrCallback<CustomDisplayDecorator>;

export type GuiCustomDisplayShortcut = GuiShortcutOf<'CUSTOM_DISPLAY', CustomDisplayEntry>;
