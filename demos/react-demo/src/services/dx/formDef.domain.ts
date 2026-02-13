import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import * as Core from '@golemui/core';
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

export interface DynamicItemDefParams {
  error?: boolean;
}

export type InputTags = [ValidShortcutType, ...string[]];

export interface ActionDecorator extends WidgetItemDecorator {
  data?: any | null;
  type?: 'button';
  label?: string;
  disabled?: boolean;
  onClick?: (data: any) => void;
  on?: {
    click?: string;
  };
}

export type ActionDefPartialCallback = (params: DynamicItemDefParams) => Partial<ActionDecorator>;
export type ActionDefCallback = (params: DynamicItemDefParams) => ActionDecorator;
export type ActionDefOrCallback = ActionDecorator | ActionDefCallback;
export type ActionDefOrPartialCallback = ActionDecorator | ActionDefPartialCallback;
export type DxDefinitions = ValidGuiShortcut | ValidGuiShortcut[];

export type FormEvents = (event: Core.FormEvent) => void;
