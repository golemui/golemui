import { ReactElement } from 'react';
import * as React from '@golemui/react';
import * as Core from '@golemui/core';
import { defineForm } from '@golemui/core';
import * as Vanilla from '@golemui/react-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import * as AppsShared from '@golemui/apps-shared';
import formMapperService from '../services/formMapper.service';

const vanillaFieldLoaders = {
  ...Vanilla.vanillaFieldLoaders,
};

const validators: Core.ValidatorFn<ValidatorsVanilla.Validator> = ValidatorsVanilla.initValidators({
  allowedNames: AppsShared.allowedNames,
});

export type FieldDef = {
  // whatever a field definition is for you
  type: 'text' | 'number';
  validator?: ValidatorsVanilla.StringValidator;
};

export type DataInput<T extends Record<string, any>> = Partial<Record<keyof T, FieldDef>>;

export interface ControllerDef {
  type: 'button';
  label: string;
  on: {
    click: string;
  };
}

export type FormElement<T extends Record<string, any>> =
  | ['data_inputs', DataInput<T>]
  | ['controllers', (ControllerDef[] | ControllerDef)];

export type FormDef<T extends Record<string, any>> = (FormElement<T> | DataInput<T>)[];

export interface GolemFormProps<T extends Record<string, any>> {
  formDef: FormDef<T>;
  formData: T;
}

export function GolemForm<T extends Record<string, any>>(props: GolemFormProps<T>): ReactElement {
  const config = formMapperService.map(props.formDef);
  console.log(`GolemForm`, config);
  return (
    <React.FormComponent
      formDef={defineForm(config)}
      data={props.formData as Record<string, string>}
      fieldLoader={vanillaFieldLoaders}
      validators={validators}
      onFormEvent={(event) => {
        alert(JSON.stringify(event, null, 2));
      }}
    />
  );
}

export default GolemForm;
