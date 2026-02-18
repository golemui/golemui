import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import * as Core from '@golemui/core';
import { FunctionWidgetParams } from '@golemui/core';
import { ValidGuiShortcut } from './shortcuts/gui/gui.domain';

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

export interface WidgetItemDecorator {
  tags?: string[];
  removeField?: boolean;
}

export type InputDecorator =
  | TextDataInputDecorator
  | NumberDataInputDecorator
  | BooleanDataInputDecorator;
export type ValidShortcutType = 'string' | 'number' | 'boolean';

export type DxRuntimeParams<FormData = any> = FunctionWidgetParams<FormData>;

export type InputTags = [ValidShortcutType, ...string[]];

export interface ActionDecorator extends WidgetItemDecorator {
  uid?: string;
  data?: any | null;
  type?: 'button';
  label?: string;
  disabled?: boolean;
  onClick?: ((data: any) => void) | 'submit';
}
export type ActionDefCallback = (params: DxRuntimeParams) => ActionDecorator;
export type ActionDefOrCallback = ActionDecorator | ActionDefCallback;
export type DxDisplayRenderFn = (params: DxRuntimeParams) => any;
export type DxDefinitionItem = ValidGuiShortcut | DxDisplayRenderFn;
export type DxDefinitions = DxDefinitionItem | DxDefinitionItem[];

export type FormEvents = (event: Core.FormEvent) => void;

export type PartialInputDefCallback = (
  params: DxRuntimeParams,
) => Partial<InputDecorator>;
