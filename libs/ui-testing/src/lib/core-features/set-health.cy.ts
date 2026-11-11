import { defineForm, type FormHealth } from '@golemui/core';
import { type FormHandle, type MountComponentFn, withTestFormName } from '../utils';

/** A code outside the core's own range: the form stays frozen until the health is cleared. */
const HOST_CODE = 10_001;

export const runSetHealthTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('setHealth', () => {
    const mount = () => {
      let handle!: FormHandle;
      const onHealth = cy.spy().as('health');
      mountFn({
        data: { name: 'Ada' },
        formDef: defineForm({
          form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name', label: 'Name' }],
        }),
        formHealth: (health: FormHealth) => onHealth(health),
        onFormReady: (h) => {
          handle = h;
        },
      });
      cy.get('[data-cy="name_textinput"]').should('have.value', 'Ada');
      return () => handle;
    };

    it('should show the boundary and emit formHealth for an errored health', () => {
      const handle = mount();
      cy.then(() =>
        handle().setHealth({ status: 'errored', code: HOST_CODE, message: 'Broken by the host' }),
      );
      cy.get('.gui-form-health-error').should('contain.text', 'Broken by the host');
      cy.get('@health').should('have.been.calledWithMatch', {
        status: 'errored',
        code: HOST_CODE,
        message: 'Broken by the host',
      });
    });

    it('should freeze the form while the health is errored', () => {
      const handle = mount();
      cy.then(() => handle().setHealth({ status: 'errored', code: HOST_CODE, message: 'Frozen' }));
      cy.get('.gui-form-health-error').should('exist');
      cy.then(() => handle().setData({ name: 'Grace' }));
      cy.get('[data-cy="name_textinput"]').should('have.value', 'Ada');
    });

    it('should clear the error with { status: "ok" }, and the form takes input again', () => {
      const handle = mount();
      cy.then(() => handle().setHealth({ status: 'errored', code: HOST_CODE, message: 'Frozen' }));
      cy.get('.gui-form-health-error').should('exist');
      cy.then(() => handle().setHealth({ status: 'ok' }));
      cy.get('.gui-form-health-error').should('not.exist');
      cy.get('@health').should('have.been.calledWithMatch', { status: 'ok' });
      cy.get('[data-cy="name_textinput"]').clear();
      cy.get('[data-cy="name_textinput"]').type('Grace');
      cy.get('[data-cy="name_textinput"]').should('have.value', 'Grace');
    });
  });
};
