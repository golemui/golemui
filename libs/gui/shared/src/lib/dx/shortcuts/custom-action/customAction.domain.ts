import type { DxActionBase, DxCommonFields } from '../../core/dxBase.types';
import type {
  DefOrCallback,
  GslConfigBase,
  GuiShortcutOf,
} from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Custom Action Decorator
// ═══════════════════════════════════════════════════

export interface CustomActionDecorator extends DxActionBase, DxCommonFields {
  customType: string;
  props?: Record<string, unknown>;
  onClick?: ((data: any) => void) | 'submit';
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
