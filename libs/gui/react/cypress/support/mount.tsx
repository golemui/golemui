import type {
  FormEvent,
  FormHealth,
  FormSubmitEvent,
  WidgetLoaders,
  WithWidget,
} from '@golemui/core';
import { type Dependencies, type GuiFormInitConfig } from '@golemui/gui-shared';
import type { FormComponentHandle } from '@golemui/react';
import { type MountOptions, type SetConfigInput } from '@golemui/ui-testing';
import { mount } from 'cypress/react';
import {
  type ComponentType,
  createRef,
  forwardRef,
  type Ref,
  useImperativeHandle,
  useState,
} from 'react';
import { GuiForm } from '../../src/lib/components/Form';

interface ConfigHarnessHandle {
  setConfig: (next: SetConfigInput) => void;
}

interface ConfigHarnessProps {
  initialConfig: GuiFormInitConfig;
  formRef: Ref<FormComponentHandle>;
  formEvent: (event: FormEvent) => void | Promise<void>;
  formHealth: (health: FormHealth) => void | Promise<void>;
  formSubmit: (event: FormSubmitEvent) => void;
}

// Holds the config in state so a test can replace it, which is how a host app
// triggers a form reinitialization.
const ConfigHarness = forwardRef<ConfigHarnessHandle, ConfigHarnessProps>(function ConfigHarness(
  { initialConfig, formRef, formEvent, formHealth, formSubmit },
  ref,
) {
  const [config, setConfig] = useState(initialConfig);
  useImperativeHandle(ref, () => ({
    setConfig: (next) =>
      setConfig((current) => ({
        ...current,
        formDef: next.formDef,
        data: next.data,
        meta: next.meta,
      })),
  }));
  return (
    <GuiForm
      ref={formRef}
      config={config}
      formEvent={formEvent}
      formHealth={formHealth}
      formSubmit={formSubmit}
    />
  );
});

export const mountFramework = (options: MountOptions) => {
  const customWidgetLoaders: WidgetLoaders<ComponentType<WithWidget>> = options.withCustomComponent
    ? {
        heading: async () =>
          (await import('../components/heading/heading.component')).HeadingComponent,
        customdate: async () => (await import('../components/custom-date/Customdate')).Customdate,
      }
    : {};

  const handleFormEvent = options.formEvent ? options.formEvent : cy.spy().as('formEvent');

  const handleFormHealth = options.formHealth ? options.formHealth : cy.spy().as('formHealth');

  const handleFormSubmit = options.formSubmit ? options.formSubmit : cy.spy().as('formSubmit');

  const config: GuiFormInitConfig = {
    formDef: options.formDef,
    data: options.data,
    meta: options.meta,
    middlewares: options.middlewares ?? [],
    customValidators: options.validators,
    validateOn: options.validateOn ?? 'eager',
    localization: options.localization,
    // The conformance MountOptions declare the open dependency record. The gui suites pass gui dependencies.
    dependencies: options.dependencies as Dependencies | undefined,
    functions: options.functions,
    customWidgetLoaders,
  };

  const formRef = createRef<FormComponentHandle>();
  const harnessRef = createRef<ConfigHarnessHandle>();

  mount(
    <ConfigHarness
      ref={harnessRef}
      initialConfig={config}
      formRef={formRef}
      formEvent={handleFormEvent}
      formHealth={handleFormHealth}
      formSubmit={handleFormSubmit}
    />,
  );

  if (options.onFormReady) {
    // mount().then() fires before React's commit phase completes, so formRef.current
    // is still null. The retry loop yields the browser event loop on each attempt,
    // allowing useImperativeHandle and useEffect (store init) to run first.
    cy.wrap(formRef)
      .its('current')
      .should('not.be.null')
      .then(() => {
        options.onFormReady!({
          setData: (data) => formRef.current!.setData(data),
          setMeta: (meta) => formRef.current!.setMeta(meta),
          setConfig: (next) => harnessRef.current!.setConfig(next),
        });
      });
  }
};
