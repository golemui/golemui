import type { NumberValidator, StringValidator } from '@golemui/gui-validators';
import type { BooleanValidator } from '@golemui/gui-validators';
import {
  type NumberinputProps,
  type TextinputProps,
  type ToggleProps,
} from '../../../widget.props';
import {
  type DxCommonFields,
  type DxInputBase,
  type DxInternalFields,
} from '../../core/dxBase.types';
import {
  type DefOrCallback,
  type DxRuntimeParams,
  type GslConfigBase,
  type GuiShortcutOf,
} from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Input Decorators
// ═══════════════════════════════════════════════════

/**
 * @deprecated Kept for backward compatibility in pipeline internals.
 * New code should use the individual subtypes directly.
 */
export interface DataInputDecorator extends DxInputBase, DxCommonFields {
  type: 'text' | 'number' | 'boolean';
  placeholder?: string;
}

export type NumberDataInputValidator = Omit<NumberValidator, 'type'>;

export interface NumberDataInputDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<NumberinputProps> {
  type: 'number';
  validator?: NumberDataInputValidator;
}

export type TextDataInputValidator = Omit<StringValidator, 'type'>;

export interface TextDataInputDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<TextinputProps> {
  type: 'text';
  validator?: TextDataInputValidator;
}

export interface BooleanDataInputDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<ToggleProps> {
  type: 'boolean';
  validator?: Omit<BooleanValidator, 'type'>;
}

export type InputDecorator =
  | TextDataInputDecorator
  | NumberDataInputDecorator
  | BooleanDataInputDecorator;

/**
 * Full decorator type including pipeline-internal fields.
 * Used by the pipeline only — form authors use InputDecorator.
 */
export type InputDecoratorFull = InputDecorator & DxInternalFields;

export type ValidShortcutType = 'string' | 'number' | 'boolean';

export type InputTags = [ValidShortcutType, ...string[]];

export type SimpleFieldDef = ValidShortcutType | InputTags;

export type { DxRuntimeParams };

// ═══════════════════════════════════════════════════
// Input Sensible Defaults Config
// ═══════════════════════════════════════════════════

export interface InputSensibleDefaultsConfig {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

// ═══════════════════════════════════════════════════
// GSL Input Types
// ═══════════════════════════════════════════════════

export interface GslInputsConfig extends GslConfigBase<InputDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI Input Types
// ═══════════════════════════════════════════════════

export type InputDefOrCallback = DefOrCallback<InputDecorator>;

export type InputEntry = { key: string; def: InputDefOrCallback };

export type GuiInputsShortcut = GuiShortcutOf<'INPUTS', InputEntry>;
