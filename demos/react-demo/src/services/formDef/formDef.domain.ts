import * as ValidatorsVanilla from '@golemui/validators-vanilla';

export interface DataInputDef {
  // whatever a field definition is for you
  type: 'text' | 'number' | 'boolean';
  placeholder?: string;
  label?: string | null;
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


export interface BaseDataInputDef {
  tags?: string[];
}

export type OneOfDataInputDefs = (TextDataInputDef | NumberDataInputDef | BooleanDataInputDef) & BaseDataInputDef;
export type ValidShortcutType = 'string' | 'number' | 'boolean';

export interface OneOfDataInputDefsParams {
  error?: boolean;
}

export type InputTags = [ValidShortcutType, ...string[]];
export type ValidInputDef = ProcessedValidInputDef | ValidShortcutType | InputTags;

export type OneOfDataInputDefsCallback = (params: OneOfDataInputDefsParams) => OneOfDataInputDefs;
export type ProcessedValidInputDef = OneOfDataInputDefs | OneOfDataInputDefsCallback;

export type DataInputDefsByKey<T extends Record<string, any>> = Partial<
  Record<keyof T, ValidInputDef>
>;

export type ProcessedDataInputDefsByKey<T extends Record<string, any>> = Partial<
  Record<keyof T, ProcessedValidInputDef>
>;

export interface ControllerDef {
  type: 'button';
  label: string;
  disabled?: boolean;
  on: {
    click: string;
  };
}

export type ControllerDefParams = {
  errors: string[];
  touched: boolean;
};

export type ControllerDefCallback = (params: ControllerDefParams) => ControllerDef;

export type ControllersDefFacade = OneOrMany<ControllerDef | ControllerDefCallback>;

export type OneOrMany<T> = T | T[];

export type DataInputsTuple<FORM_DATA extends Record<string, any>> = [
  'data_inputs',
  DataInputDefsByKey<FORM_DATA>,
];

export type ProcessedDataInputsTuple<FORM_DATA extends Record<string, any>> = [
  'data_inputs',
  ProcessedDataInputDefsByKey<FORM_DATA>,
];

export type FormDefTuple<FORM_DATA extends Record<string, any>> =
  | ['layout', FormDefTuple<FORM_DATA>[]]
  | ProcessedDataInputsTuple<FORM_DATA>
  | ['controllers', ControllersDefFacade];

export interface HorizontalLayoutShortcut<T extends Record<string, any>> {
  _horizontalLayout: FormDefFacade<T>;
}

export type ValidDxElement<T extends Record<string, any>> = (
  | DataInputDefsByKey<T>
  | HorizontalLayoutShortcut<T>
);

export type FormDefFacade<T extends Record<string, any>> =
  | DataInputDefsByKey<T>
  | ValidDxElement<T> [];
