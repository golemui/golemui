import type {
  FormEvent,
  FormHealth,
  FormSubmitEvent,
  WidgetLoaders,
  WithWidget,
} from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
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
    dependencies: options.dependencies,
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
    const el = document.querySelector('gui-form') as HTMLElement & FormHandle;
    options.onFormReady?.({
      setData: (data) => el.setData(data),
      setMeta: (meta) => el.setMeta(meta),
    });
  });
};
