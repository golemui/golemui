import type {
  FormEvent,
  FormHealth,
  FormSubmitEvent,
  WidgetLoaders,
  WithWidget,
} from '@golemui/core';
import { type Dependencies, type GuiFormInitConfig } from '@golemui/gui-shared';
import { type Type } from '@golemui/lit';
import { type FormHandle, type MountOptions } from '@golemui/ui-testing';
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

  const handleFormEvent = (e: CustomEvent<FormEvent>) => {
    if (options.formEvent) {
      options.formEvent(e.detail);
    } else {
      cy.spy().as('formEvent')(e.detail);
    }
  };

  const handleFormHealth = (e: CustomEvent<FormHealth>) => {
    if (options.formHealth) {
      options.formHealth(e.detail);
    } else {
      cy.spy().as('formHealth')(e.detail);
    }
  };

  const handleFormSubmit = (e: CustomEvent<FormSubmitEvent>) => {
    if (options.formSubmit) {
      options.formSubmit(e.detail);
    } else {
      cy.spy().as('formSubmit')(e.detail);
    }
  };

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
    };
    options.onFormReady?.({
      setData: (data) => el.setData(data),
      setMeta: (meta) => el.setMeta(meta),
      setConfig: (next) => {
        el.config = { ...el.config, formDef: next.formDef, data: next.data, meta: next.meta };
      },
    });
  });
};
