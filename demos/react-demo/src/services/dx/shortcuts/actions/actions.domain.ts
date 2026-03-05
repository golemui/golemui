import { ButtonProps } from '@golemui/gui-shared';
import { RuntimeFunction, GuiItemsShortcut } from '../../core/dx.domain';
import { DxActionBase, DxCommonFields, DxInternalFields } from '../../core/dxBase.types';
import { DxRuntimeParams } from '../inputs/inputs.domain';

// ═══════════════════════════════════════════════════
// Action Decorators
// ═══════════════════════════════════════════════════

export interface ActionDecorator extends DxActionBase, DxCommonFields {
  data?: any | null;
  type?: 'button';
  on?: { click: string };
  onClick?: ((data: any) => void) | 'submit';
  props?: Partial<ButtonProps>;
}

/**
 * Full decorator type including pipeline-internal fields.
 */
export type ActionDecoratorFull = ActionDecorator & DxInternalFields;

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
