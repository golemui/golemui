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
  cy.mount(
    html`<gui-form
      .formDef=${options.formDef}
      .middlewares=${options.middlewares ?? []}
      .validators=${options.validators}
      .fieldLoaders=${fieldLoaders}
    ></gui-form>`,
  );
};
