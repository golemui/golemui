import { WidgetItemDecorator } from '../../formDef.domain';
import { RuntimeFunction, GuiItemsShortcut } from '../../core/dx.domain';
import { DxRuntimeParams } from '../inputs/inputs.domain';

// ═══════════════════════════════════════════════════
// Action Decorators
// ═══════════════════════════════════════════════════

export interface ActionDecorator extends WidgetItemDecorator {
  uid?: string;
  data?: any | null;
  type?: 'button';
  label?: string;
  disabled?: boolean;
  on?: { click: string };
  onClick?: ((data: any) => void) | 'submit';
}

export type ActionDefCallback = (params: DxRuntimeParams) => ActionDecorator;
export type ActionDefOrCallback = ActionDecorator | ActionDefCallback;

// ═══════════════════════════════════════════════════
// Action Sensible Defaults Config
// ═══════════════════════════════════════════════════

export type ActionSensibleDefaultsConfig = Record<string, never>;

// ═══════════════════════════════════════════════════
// GSL Action Types
// ═══════════════════════════════════════════════════

export type GslActionDecoratorCallback = (current: ActionDecorator) => Partial<ActionDecorator> | RuntimeFunction;

export interface GslActionsConfig {
  decorator?: Partial<ActionDecorator> | GslActionDecoratorCallback;
}

// ═══════════════════════════════════════════════════
// GUI Action Types
// ═══════════════════════════════════════════════════

export type ActionEntry = ActionDecorator | ActionDefCallback;

export interface GuiActionsShortcut extends GuiItemsShortcut {
  itemType: 'ACTIONS';
  items: ActionEntry[];
}
