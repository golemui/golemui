import type { ValidGuiShortcut } from '../../core/dx.domain';
import type { DxCommonFields, DxLayoutBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

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
