import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import * as Core from '@golemui/core';
import {
  BUTTON_SHORTCUT,
  GROUP_SHORTCUT,
  HORIZONTAL_LAYOUT_SHORTCUT,
  SUBMIT_BUTTON_SHORTCUT,
} from './dx/dx.domain';
import { GuiFieldsShortcut, ValidGuiShortcut } from './dx/gui/gui.domain';
import { ProcessedDxFieldsByKey } from './dx/gui/shortcuts/guiFields.impl';

export interface DataInputDef extends WidgetItemDef {
  type: 'text' | 'number' | 'boolean';
  placeholder?: string;
  label?: string | null;
  path?: string;
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

export interface WidgetItemDef {
  tags?: string[];
  removeField?: boolean;
}

export type InputDef = TextDataInputDef | NumberDataInputDef | BooleanDataInputDef;
export type ValidShortcutType = 'string' | 'number' | 'boolean';

export interface DynamicItemDefParams {
  error?: boolean;
}

export type InputTags = [ValidShortcutType, ...string[]];

export interface ActionDef extends WidgetItemDef {
  data?: any | null;
  type?: 'button';
  label?: string;
  disabled?: boolean;
  onClick?: (data: any) => void;
  on?: {
    click?: string;
  };
}

export type ActionDefPartialCallback = (params: DynamicItemDefParams) => Partial<ActionDef>;
export type ActionDefCallback = (params: DynamicItemDefParams) => ActionDef;
export type ActionDefOrCallback = ActionDef | ActionDefCallback;
export type ActionDefOrPartialCallback = ActionDef | ActionDefPartialCallback;

export type ControllersDefFacade = OneOrMany<ActionDef | ActionDefCallback>;

export type OneOrMany<T> = T | T[];
export type ProcessedDataInputsTuple<FORM_DATA extends Record<string, any>> = [
  'data_inputs',
  ProcessedDxFieldsByKey<FORM_DATA>,
];

export type FormDefTuple<FORM_DATA extends Record<string, any>> =
  | ['layout', FormDefTuple<FORM_DATA>[]]
  | ProcessedDataInputsTuple<FORM_DATA>
  | ['controllers', ControllersDefFacade];
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
  CONFIG_OBJECT[],
];

export type DxShortcutSimple<NAME extends string> = NAME;
export type DxShortcutPartialOrSimple<NAME extends string, CONFIG_OBJECT, PARAMS> =
  | DxShortcutSimple<NAME>
  | DxShortcutPartial<NAME, CONFIG_OBJECT, PARAMS>;

export type HorizontalLayoutShortcut = DxShortcutDeveloped<
  HORIZONTAL_LAYOUT_SHORTCUT,
  FormDefFacade
>;

export type GroupShortcut = DxShortcutDeveloped<GROUP_SHORTCUT, FormDefFacade>;

export type SubmitButtonShortcut = DxShortcutPartialOrSimple<
  SUBMIT_BUTTON_SHORTCUT,
  ActionDef,
  { error: boolean }
>;

export type ButtonShortcut = DxShortcutPartial<BUTTON_SHORTCUT, ActionDef, { error: boolean }>;

export type ValidDxShortcuts =
  | HorizontalLayoutShortcut
  | SubmitButtonShortcut
  | GroupShortcut
  | GuiFieldsShortcut
  | ButtonShortcut;

export type ValidDxElement = ValidDxShortcuts;

export type FormDefFacade = ValidGuiShortcut | ValidGuiShortcut[];

export type FormEvents = (event: Core.FormEvent) => void;
