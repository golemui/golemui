import type { DxActionBase, DxCommonFields } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// Custom Action Decorator
// ═══════════════════════════════════════════════════

export interface CustomActionDecorator extends DxActionBase, DxCommonFields {
  customType: string;
  props?: Record<string, unknown>;
  onClick?: (data: any) => void | string;
  data?: any | null;
  on?: { click: string };
}

// ═══════════════════════════════════════════════════
// GSL Custom Action Types
// ═══════════════════════════════════════════════════

export type GslCustomActionConfig = GslConfigBase<CustomActionDecorator>;

// ═══════════════════════════════════════════════════
// GUI Custom Action Types
// ═══════════════════════════════════════════════════

export type CustomActionEntry = DefOrCallback<CustomActionDecorator>;

export type GuiCustomActionShortcut = GuiShortcutOf<'CUSTOM_ACTION', CustomActionEntry>;
