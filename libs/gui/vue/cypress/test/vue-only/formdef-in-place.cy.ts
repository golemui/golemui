import { type Action, identityTranslator, type Middleware, type State } from '@golemui/core';
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

/** Counts the stores the form creates and keeps the state after the last action. */
const storeRecorder = () => {
  const recorder: { storeCount: number; lastState?: State; middleware: Middleware<State, Action> } =
    {
      storeCount: 0,
      middleware: (api) => {
        recorder.storeCount += 1;
        return (next) => (action) => {
          next(action);
          recorder.lastState = api.getState();
        };
      },
    };
  return recorder;
};

const mountConfig = (config: Record<string, any>) => {
  cy.mount(() =>
    h(FormComponent as Component, {
      config,
      validators: initValidators(),
    }),
  );
};

describe('formDef replaced on the same config object', () => {
  it('renders the new form definition with the config data', () => {
    const config = reactive({
      formDef: textInputForm('first', 'First') as Record<string, any>,
      widgetLoaders,
      localization: identityTranslator('en-US'),
      data: { value: 'hello' },
      validateOn: 'eager' as const,
    });

    mountConfig(config);

    cy.get('[data-cy="first_textinput"]').should('have.value', 'hello');

    cy.then(() => {
      config.formDef = textInputForm('second', 'Second');
    });

    cy.get('[data-cy="second_textinput"]').should('have.value', 'hello');
    cy.get('[data-cy="first_textinput"]').should('not.exist');
  });

  it('resets the typed value and touched to the config data and keeps the store', () => {
    const recorder = storeRecorder();
    const config = reactive({
      formDef: textInputForm('first', 'First') as Record<string, any>,
      widgetLoaders,
      localization: identityTranslator('en-US'),
      data: { value: 'hello' },
      validateOn: 'eager' as const,
      middlewares: [recorder.middleware],
    });
    mountConfig(config);

    cy.get('[data-cy="first_textinput"]').type(' world');
    cy.get('[data-cy="first_textinput"]').should('have.value', 'hello world');
    cy.wrap(recorder).should(() => {
      expect(recorder.lastState?.touchedControls).to.deep.equal({ value: true });
    });

    cy.then(() => {
      config.formDef = textInputForm('second', 'Second');
    });

    cy.get('[data-cy="second_textinput"]').should('have.value', 'hello');
    cy.wrap(recorder).should(() => {
      expect(recorder.lastState?.touchedControls).to.deep.equal({});
      expect(recorder.storeCount).to.equal(1);
    });
  });

  it('applies data and meta replaced on the same config object', () => {
    const recorder = storeRecorder();
    const config = reactive({
      formDef: {
        form: [
          { uid: 'first', kind: 'input', type: 'textinput', path: 'value', label: 'First' },
          {
            uid: 'status',
            kind: 'display',
            type: 'alert',
            props: { text: 'Status: {{$meta.status}}' },
          },
        ],
      } as Record<string, any>,
      widgetLoaders,
      localization: identityTranslator('en-US'),
      data: { value: 'hello' } as Record<string, any>,
      meta: { status: 'offline' } as Record<string, any>,
      validateOn: 'eager' as const,
      middlewares: [recorder.middleware],
    });
    mountConfig(config);

    cy.get('[data-cy="first_textinput"]').should('have.value', 'hello');
    cy.get('.gui-alert [role="alert"]').should('contain', 'Status: offline');

    cy.then(() => {
      config.data = { value: 'world' };
    });
    cy.get('[data-cy="first_textinput"]').should('have.value', 'world');

    cy.then(() => {
      config.meta = { status: 'online' };
    });
    cy.get('.gui-alert [role="alert"]').should('contain', 'Status: online');
    cy.wrap(recorder).should(() => expect(recorder.storeCount).to.equal(1));
  });
});
