import { type ButtonProps } from '../../../widget.props';
import {
  type DxActionBase,
  type DxCommonFields,
  type DxInternalFields,
} from '../../core/dxBase.types';
import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import {
  type DefOrCallback,
  type GslConfigBase,
  type GuiShortcutOf,
} from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Action Decorators
// ═══════════════════════════════════════════════════

export interface ActionDecorator extends DxActionBase, DxCommonFields, Partial<ButtonProps> {
  data?: any | null;
  type?: 'button';
  on?: { click: string };
  onClick?: ((data: any) => void) | string;
}

/**
 * Full decorator type including pipeline-internal fields.
 */
export type ActionDecoratorFull = ActionDecorator & DxInternalFields;

export type ActionDefCallback = (params: DxRuntimeParams) => Partial<ActionDecorator>;
export type ActionDefOrCallback = DefOrCallback<ActionDecorator>;

// ═══════════════════════════════════════════════════
// Action Sensible Defaults Config
// ═══════════════════════════════════════════════════

export type ActionSensibleDefaultsConfig = Record<string, never>;

// ═══════════════════════════════════════════════════
// GSL Action Types
// ═══════════════════════════════════════════════════

export type GslActionsConfig = GslConfigBase<ActionDecorator>;

// ═══════════════════════════════════════════════════
// GUI Action Types
// ═══════════════════════════════════════════════════

export type ActionEntry = ActionDefOrCallback;

export type GuiActionsShortcut = GuiShortcutOf<'ACTIONS', ActionEntry>;
