import { ReactElement } from 'react';
import * as React from '@golemui/react';
import { FormComponent } from '@golemui/react-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import * as AppsShared from '@golemui/apps-shared';
import { FormDefFacade } from '../services/formDef/formDef.domain';
import formDefs from '../services/formDef/formDefs.service';

const validators: ValidatorsVanilla.CustomValidatorSchemas = {
  allowedNames: AppsShared.allowedNames,
};

export interface GolemFormProps<T extends Record<string, any>> {
  formDef?: FormDefFacade<T>;
  formData?: T;
}

export function GolemForm<FormData extends Record<string, any> = any>(
  props: GolemFormProps<FormData>,
): ReactElement {
  const config = formDefs.processFacade<never, FormData>(
    props.formDef ?? null,
    props.formData ?? null,
  );
  console.log(`GolemForm`, config);
  return (
    <FormComponent
      formDef={config}
      data={props.formData as Record<string, string>}
      validators={validators}
      formEvent={(event) => {
        alert(JSON.stringify(event, null, 2));
      }}
    />
  );
}

export default GolemForm;
