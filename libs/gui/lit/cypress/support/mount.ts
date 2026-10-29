import type {
  FormEvent,
  FormHealth,
  FormSubmitEvent,
  WidgetLoaders,
  WithWidget,
} from '@golemui/core';
import { type Dependencies, type GuiFormInitConfig } from '@golemui/gui-shared';
import { type Type } from '@golemui/lit';
import { afterTwoFrames, type FormHandle, type MountOptions } from '@golemui/ui-testing';
import { html } from 'lit';
import '../../src/lib/components/form.element';

export const mountFramework = (options: MountOptions) => {
  const customWidgetLoaders: WidgetLoaders<Type<WithWidget>> = options.withCustomComponent
    ? {
        heading: async () => (await import('../components/heading/heading.element')).HeadingElement,
        customdate: async () =>
          (await import('../components/custom-date/customdate.element')).CustomdateElement,
      }
    : {};

  // One spy per mount, so an alias records every call, as in the other framework mounts.
  const onFormEvent = options.formEvent ?? cy.spy().as('formEvent');
  const onFormHealth = options.formHealth ?? cy.spy().as('formHealth');
  const onFormSubmit = options.formSubmit ?? cy.spy().as('formSubmit');

  const handleFormEvent = (e: CustomEvent<FormEvent>) => onFormEvent(e.detail);
  const handleFormHealth = (e: CustomEvent<FormHealth>) => onFormHealth(e.detail);
  const handleFormSubmit = (e: CustomEvent<FormSubmitEvent>) => onFormSubmit(e.detail);

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

  cy.mount(
    html`<gui-form
      .config=${config}
      @formEvent=${handleFormEvent}
      @formHealth=${handleFormHealth}
      @formSubmit=${handleFormSubmit}
    ></gui-form>`,
  ).then(() => {
    const el = document.querySelector('gui-form') as HTMLElement & {
      config: GuiFormInitConfig;
      setData: FormHandle['setData'];
      setMeta: FormHandle['setMeta'];
      requestUpdate: () => void;
    };
    options.onFormReady?.({
      setData: (data) => el.setData(data),
      setMeta: (meta) => el.setMeta(meta),
      setConfig: (next) => {
        el.config = {
          ...el.config,
          formDef: next.formDef,
          data: next.data,
          meta: next.meta,
          formName: 'formName' in next ? next.formName : el.config.formName,
          localization: 'localization' in next ? next.localization : el.config.localization,
        };
      },
      rerender: () => {
        // Lit ignores a set with the same config object, so only the form renders again.
        el.requestUpdate();
        return afterTwoFrames();
      },
    });
  });
};
