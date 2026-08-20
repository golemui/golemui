import { identityTranslator } from '@golemui/core';
import { initValidators } from '@golemui/gui-validators';
import { FormComponent } from '@golemui/vue';
import { h, reactive, type Component } from 'vue';
import { widgetLoaders } from '../../../src/lib/widget.loaders';

/**
 * Vue only: `FormComponent` dispatches INITIALIZE, SET_DATA and SET_META from separate watchers,
 * so a formDef replaced on the same config object has to feed the store itself. Not in the shared
 * suite because the shared mount contract only exposes `setData` and `setMeta`.
 */
const textInputForm = (uid: string, label: string) => ({
  form: [{ uid, kind: 'input', type: 'textinput', path: 'value', label }],
});

describe('formDef replaced on the same config object', () => {
  it('renders the new form definition with the config data', () => {
    const config = reactive({
      formDef: textInputForm('first', 'First') as Record<string, any>,
      widgetLoaders,
      localization: identityTranslator('en-US'),
      data: { value: 'hello' },
      validateOn: 'eager' as const,
    });

    cy.mount(() =>
      h(FormComponent as Component, {
        config,
        validators: initValidators(),
      }),
    );

    cy.get('[data-cy="first_textinput"]').should('have.value', 'hello');

    cy.then(() => {
      config.formDef = textInputForm('second', 'Second');
    });

    cy.get('[data-cy="second_textinput"]').should('have.value', 'hello');
    cy.get('[data-cy="first_textinput"]').should('not.exist');
  });
});
