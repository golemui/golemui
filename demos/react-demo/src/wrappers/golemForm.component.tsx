import { ReactElement, useEffect, useMemo } from 'react';
import * as Core from '@golemui/core';
import * as React from '@golemui/react';
import { FormComponent } from '@golemui/react-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import * as AppsShared from '@golemui/apps-shared';
import { DxDefinitions, FormEvents } from '../services/dx/formDef.domain';
import { DxSelectors } from '../services/dx/dxSelectors.domain';
import formDefs from '../services/dx/dx.service';

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
  formDef: DxDefinitions<T>;
  formData?: T;
  onConfigProcessed?: (config: any) => void;
  formConfig?: DxSelectors<T>;
}

export function GolemForm<FormData extends Record<string, any> = any>(
  props: GolemFormProps<FormData>,
): ReactElement {
  const fwFormDefRaw = useMemo(
    () => formDefs.processDxFacade<never, FormData>(props.formDef, props.formConfig),
    [props.formDef, props.formConfig],
  );

  const fwFormDef = Array.isArray(fwFormDefRaw) ? fwFormDefRaw[0] : fwFormDefRaw;

  const fwFormEvents: FormEvents = Array.isArray(fwFormDefRaw)
    ? fwFormDefRaw[1]
    : (event: any) => {
        console.log(JSON.stringify(event, null, 2));
      };

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`GolemForm`, fwFormDef);
    }
  }, [fwFormDef]);

  // Call the callback with the processed config
  useEffect(() => {
    if (props.onConfigProcessed) {
      props.onConfigProcessed(fwFormDef);
    }
  }, [fwFormDef]);

  return (
    <FormComponent
      formDef={fwFormDef}
      data={props.formData as Record<string, string>}
      validators={validators}
      middlewares={import.meta.env.DEV ? [golemLogMiddleware] : []}
      formEvent={fwFormEvents}
    />
  );
}

export default GolemForm;
