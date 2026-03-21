import { ReactElement, useEffect, useMemo } from 'react';
import * as Core from '@golemui/core';
import { FormComponent } from '@golemui/gui-react';
import * as ValidatorsVanilla from '@golemui/gui-validators';
import * as AppsShared from '@golemui/apps-shared';
import { DxDefinitions, formDefs, FormEvents, GslSelectorsInput, DxFormConfig } from '@golemui/gui-shared';

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

const devMiddlewares: Core.Middleware<Core.State, Core.Action>[] = [golemLogMiddleware];
const prodMiddlewares: Core.Middleware<Core.State, Core.Action>[] = [];

export interface GolemFormProps<T extends Record<string, any>> {
  formDef: DxDefinitions;
  formData?: T;
  onConfigProcessed?: (config: any) => void;
  formSelectors?: GslSelectorsInput;
  formConfig?: DxFormConfig;
}

export function GolemForm<FormData extends Record<string, any> = any>(
  props: GolemFormProps<FormData>,
): ReactElement {
  const { form, events, dependencies, widgetLoaders, validateOn } = useMemo(
    () => formDefs.processDxFacade<never, FormData>(props.formDef, props.formSelectors, props.formConfig),
    [props.formDef, props.formSelectors, props.formConfig],
  );

  const fwFormDef = form;

  const fwFormEvents: FormEvents =
    events ??
    ((event: any) => {
      console.log(JSON.stringify(event, null, 2));
    });

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`GolemForm`, fwFormDef);
    }
  }, [fwFormDef]);

  // Call the callback with the full DxResult
  useEffect(() => {
    if (props.onConfigProcessed) {
      props.onConfigProcessed({ form, events, dependencies, validateOn });
    }
  }, [form, events, dependencies, validateOn]);

  return (
    <FormComponent
      formDef={fwFormDef}
      data={props.formData as Record<string, string>}
      validators={validators}
      middlewares={import.meta.env.DEV ? devMiddlewares : prodMiddlewares}
      formEvent={fwFormEvents}
      dependencies={dependencies}
      widgetLoaders={widgetLoaders as any}
      validateOn={validateOn}
    />
  );
}

export default GolemForm;
