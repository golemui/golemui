import * as Core from '@golemui/core';
import { MountOptions } from '@golemui/ui-testing';
import { html } from 'lit';
import '../../src/lib/components/form.element';
import { Type } from '../../src/lib/utils/types';

export const mountFramework = (options: MountOptions) => {
  const fieldLoaders: Core.FieldLoaders<Type<Core.WithField>> = options.withCustomComponent
    ? {
        heading: async () => (await import('../components/heading/heading.element')).HeadingElement,
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
      .middlewares=${options.middlewares ?? []}
      .validators=${options.validators}
      .validateOn=${options.validateOn ?? 'eager'}
      .fieldLoaders=${fieldLoaders}
      @formEvent=${handleFormEvent}
      @formHealth=${handleFormHealth}
    ></gui-form>`,
  );
};
