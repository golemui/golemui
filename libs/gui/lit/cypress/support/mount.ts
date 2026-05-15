import * as Core from '@golemui/core';
import { GuiFormInitConfig } from '@golemui/gui-shared';
import { Type } from '@golemui/lit';
import { FormHandle, MountOptions } from '@golemui/ui-testing';
import { html } from 'lit';
import '../../src/lib/components/form.element';

export const mountFramework = (options: MountOptions) => {
  const customWidgetLoaders: Core.WidgetLoaders<Type<Core.WithWidget>> = options.withCustomComponent
    ? {
        heading: async () => (await import('../components/heading/heading.element')).HeadingElement,
        customdate: async () =>
          (await import('../components/custom-date/customdate.element')).CustomdateElement,
      }
    : {};

  const handleFormEvent = (e: CustomEvent<Core.FormEvent>) => {
    if (options.formEvent) {
      options.formEvent(e.detail);
    } else {
      cy.spy().as('formEvent')(e.detail);
    }
  };

  const handleFormHealth = (e: CustomEvent<Core.FormHealth>) => {
    if (options.formHealth) {
      options.formHealth(e.detail);
    } else {
      cy.spy().as('formHealth')(e.detail);
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
    customWidgetLoaders,
  };

  cy.mount(
    html`<gui-form
      .config=${config}
      @formEvent=${handleFormEvent}
      @formHealth=${handleFormHealth}
    ></gui-form>`,
  ).then(() => {
    const el = document.querySelector('gui-form') as HTMLElement & FormHandle;
    options.onFormReady?.({
      setData: (data) => el.setData(data),
      setMeta: (meta) => el.setMeta(meta),
    });
  });
};
