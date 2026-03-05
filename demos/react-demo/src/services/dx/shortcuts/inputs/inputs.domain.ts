import * as ValidatorsVanilla from '@golemui/gui-validators';
import { FunctionWidgetParams } from '@golemui/core';
import { NumberinputProps, TextinputProps, ToggleProps } from '@golemui/gui-shared';
import { RuntimeFunction, GuiItemsShortcut } from '../../core/dx.domain';
import { DxCommonFields, DxInputBase, DxInternalFields } from '../../core/dxBase.types';

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

export interface NumberDataInputDecorator extends DxInputBase, DxCommonFields {
  type: 'number';
  placeholder?: string;
  validator?: NumberDataInputValidator;
  props?: Partial<NumberinputProps>;
}

export type TextDataInputValidator = Omit<ValidatorsVanilla.StringValidator, 'type'>;

export interface TextDataInputDecorator extends DxInputBase, DxCommonFields {
  type: 'text';
  placeholder?: string;
  validator?: TextDataInputValidator;
  props?: Partial<TextinputProps>;
}

export interface BooleanDataInputDecorator extends DxInputBase, DxCommonFields {
  type: 'boolean';
  placeholder?: string;
  props?: Partial<ToggleProps>;
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

// ═══════════════════════════════════════════════════
// IntelliSense-Optimized Object Form
// ═══════════════════════════════════════════════════

/**
 * Discriminated union for the object form of _guiInputs.
 * When the user writes { type: 'text', ... }, TypeScript narrows to
 * the text-specific variant with correct validator, props, etc.
 *
 * Note: `type` is required in this form to enable discrimination.
 * The shorthand forms ('string', 'number', ['string', 'required']) are unaffected.
 */
export type InputObjectDef =
  | ({ type: 'text' } & Partial<Omit<TextDataInputDecorator, 'type'>>)
  | ({ type: 'number' } & Partial<Omit<NumberDataInputDecorator, 'type'>>)
  | ({ type: 'boolean' } & Partial<Omit<BooleanDataInputDecorator, 'type'>>);

export type ValidShortcutType = 'string' | 'number' | 'boolean';

export type InputTags = [ValidShortcutType, ...string[]];

export type DxRuntimeParams<FormData = any> = FunctionWidgetParams<FormData>;

export type PartialInputDefCallback = (
  params: DxRuntimeParams,
) => Partial<InputDecorator>;

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

export type GslInputDecoratorCallback = (current: InputDecorator) => Partial<InputDecorator> | RuntimeFunction;

export interface GslInputsConfig {
  decorator?: Partial<InputDecorator> | GslInputDecoratorCallback;
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI Input Types
// ═══════════════════════════════════════════════════

export type InputDefOrCallback = InputDecorator | PartialInputDefCallback;

export type InputEntry = { key: string; def: InputDefOrCallback };

export interface GuiInputsShortcut extends GuiItemsShortcut {
  itemType: 'INPUTS';
  items: InputEntry[];
}
