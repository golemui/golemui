import * as ValidatorsVanilla from '@golemui/validators-vanilla';

export type DataInputDef = {
  // whatever a field definition is for you
  type: 'text' | 'number';
  validator?: ValidatorsVanilla.StringValidator;
};
export type DataInputDefsByKey<T extends Record<string, any>> = Partial<
  Record<keyof T, DataInputDef>
>;

export interface ControllerDef {
  type: 'button';
  label: string;
  on: {
    click: string;
  };
}

export type ControllerDefParams = {
  errors: string[];
  touched: boolean;
};

export type ControllerDefCallback = (params: ControllerDefParams) => ControllerDef;

export type ControllersDefFacade = OneOrMany<ControllerDef> | ControllerDefCallback;

export type OneOrMany<T> = T | T[];

export type FormDefTuple<FORM_DATA extends Record<string, any>> =
  | ['data_inputs', DataInputDefsByKey<FORM_DATA>]
  | ['controllers', ControllersDefFacade];

export type FormDefFacadeLike<T extends Record<string, any>> =
  | FormDefTuple<T>
  | DataInputDefsByKey<T>;

export type FormDefFacade<T extends Record<string, any>> =
  | FormDefFacadeLike<T>[]
  | DataInputDefsByKey<T>;
