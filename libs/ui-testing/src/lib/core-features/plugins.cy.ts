import { defineForm, type FormPlugin, type FormPluginContext } from '@golemui/core';
import { type FormHandle, type MountComponentFn } from '../utils';

/**
 * Plugin lifecycle conformance: every framework binding must attach the config's plugins once
 * the form is live on the client, hand them the live store, detach and re-attach them when the
 * config is replaced, and survive a plugin that throws.
 */
export const runPluginsComponentTests = (mountFn: MountComponentFn) => {
  describe('Plugins', () => {
    const checkboxForm = () =>
      defineForm({
        form: [
          {
            uid: 'check1',
            kind: 'input',
            type: 'checkbox',
            label: 'Check 1',
            path: 'check1',
            props: {},
          },
        ],
      });

    // Bindings attach plugins after their first commit, so a captured context is awaited.
    const attached = (read: () => FormPluginContext | undefined) =>
      cy.wrap(null, { log: false }).should(() => {
        expect(read(), 'plugin attached').to.not.be.undefined;
      });

    const requiredNameForm = () =>
      defineForm({
        form: [
          {
            uid: 'name',
            kind: 'input',
            type: 'textinput',
            label: 'Name',
            path: 'name',
            validator: { type: 'string', required: true },
          },
        ],
      });

    it('attaches once the form is live and hands the plugin the live store', () => {
      const contexts: FormPluginContext[] = [];
      const plugin: FormPlugin = (context) => {
        contexts.push(context);
      };
      mountFn({ formDef: checkboxForm(), plugins: [plugin] });

      cy.get('[data-cy="check1_checkbox"]').click();
      cy.then(() => {
        expect(contexts).to.have.length(1);
        expect(contexts[0].store.getState().data).to.deep.equal({ check1: true });
      });
    });

    it('detaches and re-attaches on the new store when the config is replaced', () => {
      const attached: FormPluginContext[] = [];
      const teardown = cy.spy().as('teardown');
      const plugin: FormPlugin = (context) => {
        attached.push(context);
        return teardown;
      };
      let handle: FormHandle;
      mountFn({
        formDef: checkboxForm(),
        plugins: [plugin],
        onFormReady: (h) => {
          handle = h;
        },
      });

      cy.then(() => {
        expect(attached).to.have.length(1);
        handle.setConfig({ formDef: checkboxForm(), data: { check1: true } });
      });

      cy.get('@teardown').should('have.been.calledOnce');
      cy.then(() => {
        expect(attached).to.have.length(2);
        expect(attached[1].store).to.not.equal(attached[0].store);
        expect(attached[1].store.getState().data).to.deep.equal({ check1: true });
      });
    });

    it('keeps the form working when a plugin throws while attaching', () => {
      const healthy = cy.spy().as('healthy');
      const broken: FormPlugin = () => {
        throw new Error('broken plugin');
      };
      mountFn({ formDef: checkboxForm(), plugins: [broken, healthy as unknown as FormPlugin] });

      cy.get('@healthy').should('have.been.calledOnce');
      cy.get('[data-cy="check1_checkbox"]').click();
      cy.get('[data-cy="check1_checkbox"]').should('be.checked');
    });

    it('submit() validates, then emits the submit only when the form is valid', () => {
      let context: FormPluginContext | undefined;
      // Some mount adapters create the `@formSubmit` spy lazily, so submits are collected
      // through an explicit handler to assert that none happened.
      const submits: Record<string, unknown>[] = [];
      mountFn({
        formDef: requiredNameForm(),
        plugins: [
          (c) => {
            context = c;
          },
        ],
        formSubmit: (event) => submits.push(event.data),
      });

      attached(() => context);
      cy.then(() => {
        expect(context!.submit()).to.equal(false);
        expect(submits).to.have.length(0);
      });
      cy.get('[data-cy="name_validator-errors"]').should('exist');

      cy.then(() => {
        context!.store.dispatch({
          type: 'SET_WIDGET_DATA',
          payload: { path: 'name', data: 'Ada' },
        });
        expect(context!.submit()).to.equal(true);
        expect(submits).to.have.length(1);
        expect(submits[0]['name']).to.equal('Ada');
      });
    });

    it('validate() previews the validity without touching the form', () => {
      let context: FormPluginContext | undefined;
      mountFn({
        formDef: requiredNameForm(),
        plugins: [
          (c) => {
            context = c;
          },
        ],
      });

      attached(() => context);
      cy.then(() => {
        const report = context!.validate();
        expect(report.isValid).to.equal(false);
        expect(report.errors).to.have.property('name');
        expect(context!.store.getState().touched).to.equal(false);
      });
      cy.get('[data-cy="name_validator-errors"]').should('not.exist');
    });

    it('receives the widget set value schemas', () => {
      let context: FormPluginContext | undefined;
      mountFn({
        formDef: checkboxForm(),
        plugins: [
          (c) => {
            context = c;
          },
        ],
      });

      attached(() => context);
      cy.then(() => {
        const widget = context!.store.getState().calculatedWidgets['check1'].current;
        const described = context!.valueSchemas?.valueSchema(widget as never);
        expect(described?.schema).to.deep.equal({ type: 'boolean' });
      });
    });
  });
};
