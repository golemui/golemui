import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import * as Core from '@golemui/core';
import {
  BUTTON_SHORTCUT,
  GROUP_SHORTCUT,
  HORIZONTAL_LAYOUT_SHORTCUT,
  SUBMIT_BUTTON_SHORTCUT,
} from './dx/dx.domain';
import {
  DxFieldsByKey,
  FieldsShortcut,
  ProcessedDxFieldsByKey,
} from './dx/gui/guiFields.impl';

export interface DataInputDef extends GolemFormItem {
  type: 'text' | 'number' | 'boolean';
  placeholder?: string;
  label?: string | null;
  dataPath?: string;
}

export type NumberDataInputValidator = Omit<ValidatorsVanilla.NumberValidator, 'type'>;

export interface NumberDataInputDef extends DataInputDef {
  type: 'number';
  validator?: NumberDataInputValidator;
}

export type TextDataInputValidator = Omit<ValidatorsVanilla.StringValidator, 'type'>;

export interface TextDataInputDef extends DataInputDef {
  type: 'text';
  validator?: TextDataInputValidator;
}

export interface BooleanDataInputDef extends DataInputDef {
  type: 'boolean';
}

export interface GolemFormItem {
  tags?: string[];
  removeField?: boolean;
}

export type OneOfDataInputDefs = TextDataInputDef | NumberDataInputDef | BooleanDataInputDef;
export type ValidShortcutType = 'string' | 'number' | 'boolean';

export interface DynamicDefParams {
  error?: boolean;
}

export type InputTags = [ValidShortcutType, ...string[]];

export interface ControllerDef extends GolemFormItem {
  data?: any | null;
  type?: 'button';
  label?: string;
  disabled?: boolean;
  onClick: (data: any) => void;
  on?: {
    click?: string;
  };
}

export type ControllerDefCallback = (params: DynamicDefParams) => ControllerDef;

export type ControllersDefFacade = OneOrMany<ControllerDef | ControllerDefCallback>;

export type OneOrMany<T> = T | T[];
export type ProcessedDataInputsTuple<FORM_DATA extends Record<string, any>> = [
  'data_inputs',
  ProcessedDxFieldsByKey<FORM_DATA>,
];

export type FormDefTuple<FORM_DATA extends Record<string, any>> =
  | ['layout', FormDefTuple<FORM_DATA>[]]
  | ProcessedDataInputsTuple<FORM_DATA>
  | ['controllers', ControllersDefFacade];

export type SubmitButtonDefinition = [
  '_submitButton',
  Partial<ControllerDef> | ControllerDefCallback,
];
export type DxShortcutDeveloped<NAME extends string, CONFIG_OBJECT> = [
  [NAME, ...string[]] | NAME,
  CONFIG_OBJECT,
];
export type DxShortcutPartial<NAME extends string, CONFIG_OBJECT, PARAMS> = [
  [NAME, ...string[]] | NAME,
  Partial<CONFIG_OBJECT> | ((params: PARAMS) => Partial<CONFIG_OBJECT>),
];

export type DxShortcutFinal<NAME extends string, CONFIG_OBJECT> = [
  [NAME, ...string[]],
  CONFIG_OBJECT [],
];


export type DxShortcutSimple<NAME extends string> = NAME;
export type DxShortcutPartialOrSimple<NAME extends string, CONFIG_OBJECT, PARAMS> =
  | DxShortcutSimple<NAME>
  | DxShortcutPartial<NAME, CONFIG_OBJECT, PARAMS>;

export type HorizontalLayoutShortcut<T extends Record<string, any>> = DxShortcutDeveloped<
  HORIZONTAL_LAYOUT_SHORTCUT,
  FormDefFacade<T>
>;

export type GroupShortcut<T extends Record<string, any>> = DxShortcutDeveloped<
  GROUP_SHORTCUT,
  FormDefFacade<T>
>;

export type SubmitButtonShortcut = DxShortcutPartialOrSimple<
  SUBMIT_BUTTON_SHORTCUT,
  ControllerDef,
  { error: boolean }
>;

export type ButtonShortcut = DxShortcutPartial<BUTTON_SHORTCUT, ControllerDef, { error: boolean }>;

export type ValidDxShortcuts<T extends Record<string, any>> =
  | HorizontalLayoutShortcut<T>
  | SubmitButtonShortcut
  | GroupShortcut<T>
  | FieldsShortcut
  | ButtonShortcut;

export type ValidDxElement<T extends Record<string, any>> = DxFieldsByKey<T> | ValidDxShortcuts<T>;

export type FormDefFacade<T extends Record<string, any>> = ValidDxElement<T>[];

export type FormEvents = (event: Core.FormEvent) => void;
