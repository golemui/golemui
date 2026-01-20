import { ReactElement, useEffect, useMemo } from 'react';
import * as Core from '@golemui/core';
import * as React from '@golemui/react';
import { FormComponent } from '@golemui/react-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import * as AppsShared from '@golemui/apps-shared';
import { FormDefFacade } from '../services/formDef/formDef.domain';
import { FormConfig } from '../services/formDef/fomConfig.domain';
import formDefs from '../services/formDef/formDefs.service';

const validators: ValidatorsVanilla.CustomValidatorSchemas = {
  allowedNames: AppsShared.allowedNames,
};

const golemLogMiddleware: Core.Middleware<Core.State, Core.Action> =
  ({ getState }) =>
  (next) =>
  (action) => {
    if (import.meta.env.DEV) {
      console.groupCollapsed(`GolemForm: ${action.type}`);
      console.log('Prev state:', getState());
      console.log('Action:', action);
    }

    next(action);

    if (import.meta.env.DEV) {
      const nextState = getState();
      console.log('Next state:', nextState);
      console.groupEnd();
    }
  };

export interface GolemFormProps<T extends Record<string, any>> {
  formDef?: FormDefFacade<T>;
  formData?: T;
  onConfigProcessed?: (config: any) => void;
  formConfig?: FormConfig<T>;
}

export function GolemForm<FormData extends Record<string, any> = any>(
  props: GolemFormProps<FormData>,
): ReactElement {
  const config = useMemo(
    () => formDefs.processFacade<never, FormData>(props.formDef ?? null, props.formConfig),
    [props.formDef, props.formConfig],
  );

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`GolemForm`, config);
    }
  }, [config]);

  // Call the callback with the processed config
  useEffect(() => {
    if (props.onConfigProcessed) {
      props.onConfigProcessed(config);
    }
  }, [config]);

  return (
    <FormComponent
      formDef={config}
      data={props.formData as Record<string, string>}
      validators={validators}
      middlewares={import.meta.env.DEV ? [golemLogMiddleware] : []}
      formEvent={(event) => {
        alert(JSON.stringify(event, null, 2));
      }}
    />
  );
}

export default GolemForm;
