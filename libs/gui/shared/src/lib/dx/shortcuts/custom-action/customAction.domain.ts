import type { DxActionBase, DxCommonFields, DxFormEvent } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// Custom Action Decorator
// ═══════════════════════════════════════════════════

export interface CustomActionDecorator extends DxActionBase, DxCommonFields {
  customType: string;
  props?: Record<string, unknown>;
  /**
   * Runs on click with the form data and the event, for example `event.row` in a repeater row.
   * A handler with no parameters is also called while the form is built: return a string from it
   * to send that host event name instead.
   */
  onClick?: (data: any, event: DxFormEvent) => void | string;
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
