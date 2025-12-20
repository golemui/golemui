import { MountOptions } from '@golemui/ui-testing';
import * as Core from '@golemui/core';
import { Type } from '../../src/lib/utils/types';
import { html } from 'lit';
import '../../src/lib/components/form.element';

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

  const handleFormError = (e: CustomEvent<Core.FormStoreError>) => {
    if (options.formError) {
      options.formError(e.detail);
    } else {
      cy.spy().as('formError')(e.detail);
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
      @formError=${handleFormError}
    ></gui-form>`,
  );
};
