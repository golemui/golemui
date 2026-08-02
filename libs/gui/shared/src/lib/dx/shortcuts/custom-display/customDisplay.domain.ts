import type { DxCommonFields, DxDisplayBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

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
