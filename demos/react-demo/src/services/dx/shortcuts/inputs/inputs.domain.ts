import * as ValidatorsVanilla from '@golemui/gui-validators';
import { NumberinputProps, TextinputProps, ToggleProps } from '@golemui/gui-shared';
import { DxCommonFields, DxInputBase, DxInternalFields } from '../../core/dxBase.types';
import {
  DefOrCallback,
  DxRuntimeParams,
  GslConfigBase,
  GuiShortcutOf,
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

export type NumberDataInputValidator = Omit<ValidatorsVanilla.NumberValidator, 'type'>;

export interface NumberDataInputDecorator extends DxInputBase, DxCommonFields, Partial<NumberinputProps> {
  type: 'number';
  validator?: NumberDataInputValidator;
}

export type TextDataInputValidator = Omit<ValidatorsVanilla.StringValidator, 'type'>;

export interface TextDataInputDecorator extends DxInputBase, DxCommonFields, Partial<TextinputProps> {
  type: 'text';
  validator?: TextDataInputValidator;
}

export interface BooleanDataInputDecorator extends DxInputBase, DxCommonFields, Partial<ToggleProps> {
  type: 'boolean';
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
