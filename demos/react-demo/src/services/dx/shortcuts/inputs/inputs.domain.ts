import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import { FunctionWidgetParams } from '@golemui/core';
import { WidgetItemDecorator } from '../../formDef.domain';
import { RuntimeFunction, GuiItemsShortcut, GUI_ITEM_TYPE_INPUTS } from '../../core/dx.domain';

// ═══════════════════════════════════════════════════
// Input Decorators
// ═══════════════════════════════════════════════════

export interface DataInputDecorator extends WidgetItemDecorator {
  type: 'text' | 'number' | 'boolean';
  placeholder?: string;
  label?: string | null;
  path?: string;
}

export type NumberDataInputValidator = Omit<ValidatorsVanilla.NumberValidator, 'type'>;

export interface NumberDataInputDecorator extends DataInputDecorator {
  type: 'number';
  validator?: NumberDataInputValidator;
}

export type TextDataInputValidator = Omit<ValidatorsVanilla.StringValidator, 'type'>;

export interface TextDataInputDecorator extends DataInputDecorator {
  type: 'text';
  validator?: TextDataInputValidator;
}

export interface BooleanDataInputDecorator extends DataInputDecorator {
  type: 'boolean';
}

export type InputDecorator =
  | TextDataInputDecorator
  | NumberDataInputDecorator
  | BooleanDataInputDecorator;

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
  itemType: GUI_ITEM_TYPE_INPUTS;
  items: InputEntry[];
}
