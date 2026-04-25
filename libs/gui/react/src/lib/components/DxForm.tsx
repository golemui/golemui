import { ComponentType, ReactElement, useMemo } from 'react';
import * as Core from '@golemui/core';
import {
  DxDefinitions,
  DxFormConfig,
  GslSelectorsInput,
  formDefs,
} from '@golemui/gui-shared';
import { FormComponent } from './Form';

export interface DxFormProps<FormData extends Record<string, any> = any> {
  formDef: DxDefinitions;
  formData?: FormData;
  formSelectors?: GslSelectorsInput;
  formConfig?: DxFormConfig;
}

export function DxForm<FormData extends Record<string, any> = any>(
  props: DxFormProps<FormData>,
): ReactElement {
  const { form, events, dependencies, widgetLoaders, validateOn } = useMemo(
    () =>
      formDefs.processDxFacade<never, FormData>(
        props.formDef,
        props.formSelectors,
        props.formConfig,
      ),
    [props.formDef, props.formSelectors, props.formConfig],
  );

  return (
    <FormComponent
      formDef={form}
      data={props.formData}
      customWidgetLoaders={widgetLoaders as Core.WidgetLoaders<ComponentType<Core.WithWidget>>}
      dependencies={dependencies}
      validateOn={validateOn}
      formEvent={events}
    />
  );
}
