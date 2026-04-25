import * as Core from '@golemui/core';
import { Type } from '@golemui/lit';
import { MountOptions } from '@golemui/ui-testing';
import { html } from 'lit';
import '../../src/lib/components/form.element';

export const mountFramework = (options: MountOptions) => {
  const widgetLoaders: Core.WidgetLoaders<Type<Core.WithWidget>> = options.withCustomComponent
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

  cy.mount(
    html`<gui-form
      .formDef=${options.formDef}
      .data=${options.data}
      .meta=${options.meta!}
      .middlewares=${options.middlewares ?? []}
      .customValidators=${options.validators!}
      .validateOn=${options.validateOn ?? 'eager'}
      .localization=${options.localization}
      .dependencies=${options.dependencies}
      .customWidgetLoaders=${widgetLoaders}
      @formEvent=${handleFormEvent}
      @formHealth=${handleFormHealth}
    ></gui-form>`,
  );
};
