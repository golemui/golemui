import type { ValidGuiShortcut } from '@golemui/dx';
import type { DxCommonFields, DxLayoutBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// Custom Layout Decorator
// ═══════════════════════════════════════════════════

export interface CustomLayoutDecorator extends DxLayoutBase, DxCommonFields {
  customType: string;
  props?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════
// GSL Custom Layout Types
// ═══════════════════════════════════════════════════

export type GslCustomLayoutConfig = GslConfigBase<CustomLayoutDecorator>;

// ═══════════════════════════════════════════════════
// GUI Custom Layout Types
// ═══════════════════════════════════════════════════

export type CustomLayoutEntry = {
  def: DefOrCallback<CustomLayoutDecorator>;
  children: ValidGuiShortcut[];
};

export type GuiCustomLayoutShortcut = GuiShortcutOf<'CUSTOM_LAYOUT', CustomLayoutEntry>;
