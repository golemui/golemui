import { defineForm } from '@golemui/core';
import { afterTwoFrames, eventsNamed, type FormHandle, type MountComponentFn } from '../utils';
import { testForm } from '../test-form';

const requiredName = {
  uid: 'name',
  kind: 'input',
  type: 'textinput',
  path: 'name',
  validator: { type: 'string', required: true },
} as const;

const submitButton = {
  uid: 'submitBtn',
  kind: 'action',
  type: 'button',
  label: 'Submit',
  actionType: 'submit',
} as const;

export const runActionsComponentTests = (mountFn: MountComponentFn) => {
  describe('Actions', () => {
    context('Submit button invalid state', () => {
      it('should not have the invalid class before any submit attempt', () => {
        mountFn({
          formDef: testForm({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                actionType: 'submit',
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]')
          .closest('.gui-button')
          .should('not.have.class', 'gui-button--invalid');
      });

      it('should apply the invalid class when submitted with validation errors', () => {
        mountFn({
          formDef: testForm({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                actionType: 'submit',
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('[data-cy="submitBtn_button"]')
          .closest('.gui-button')
          .should('have.class', 'gui-button--invalid');
      });

      it('should remove the invalid class once all errors are resolved', () => {
        mountFn({
          formDef: testForm({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                actionType: 'submit',
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('[data-cy="submitBtn_button"]')
          .closest('.gui-button')
          .should('have.class', 'gui-button--invalid');

        cy.get('[data-cy="name_textinput"]').type('Joan');
        cy.get('[data-cy="submitBtn_button"]')
          .closest('.gui-button')
          .should('not.have.class', 'gui-button--invalid');
      });

      it('should not apply the invalid class to a non-submit button', () => {
        mountFn({
          formDef: testForm({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'plainBtn',
                kind: 'action',
                type: 'button',
                label: 'Action',
                actionType: 'button',
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                actionType: 'submit',
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('[data-cy="submitBtn_button"]')
          .closest('.gui-button')
          .should('have.class', 'gui-button--invalid');
        cy.get('[data-cy="plainBtn_button"]')
          .closest('.gui-button')
          .should('not.have.class', 'gui-button--invalid');
      });
    });

    context('Button action types', () => {
      it('should not submit when a button with actionType button is clicked', () => {
        mountFn({
          formDef: defineForm({
            form: [
              requiredName,
              {
                uid: 'plainBtn',
                kind: 'action',
                type: 'button',
                label: 'Action',
                actionType: 'button',
              },
              submitButton,
            ],
          }),
          data: { name: 'Joan' },
          formSubmit: cy.stub().as('formSubmit'),
        });

        cy.get('[data-cy="plainBtn_button"]').click();
        // Wait, so a submit that runs after a frame is also seen.
        cy.then(() => afterTwoFrames());
        cy.get('@formSubmit').should('not.have.been.called');

        // Control: the submit button of the same form submits.
        cy.get('[data-cy="submitBtn_button"]').click();
        cy.then(() => afterTwoFrames());
        cy.get('@formSubmit').should('have.been.calledOnce');
      });

      it('should submit only after the required field is filled', () => {
        mountFn({
          formDef: defineForm({ form: [requiredName, submitButton] }),
          formSubmit: cy.stub().as('formSubmit'),
        });

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('[data-cy="name_validator-errors"]').should('exist');
        cy.get('@formSubmit').should('not.have.been.called');

        cy.get('[data-cy="name_textinput"]').type('Joan');
        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('@formSubmit').should('have.been.calledOnce');
        cy.get('@formSubmit').its('firstCall.args.0.data').should('deep.equal', { name: 'Joan' });
      });

      it('should reject a form with actionType reset and render no field', () => {
        mountFn({
          formDef: defineForm({
            form: [
              requiredName,
              {
                uid: 'resetBtn',
                kind: 'action',
                type: 'button',
                label: 'Reset',
                // The type allows only button and submit. A JSON document can still hold reset.
                actionType: 'reset' as 'button',
              },
            ],
          }),
          formHealth: cy.stub().as('formHealth'),
        });

        cy.get('@formHealth')
          .its('lastCall.args.0')
          .should((health) => {
            expect(health).to.include({ status: 'errored', code: 22 });
            expect(health.message).to.contain('form.children[1].actionType');
          });
        // The fields load after the mount, so wait before the check that they are absent.
        cy.then(() => afterTwoFrames());
        cy.get('[data-cy="name_textinput"]').should('not.exist');
      });
    });

    context('Disabled and hidden buttons', () => {
      it('should send no click event for a disabled button', () => {
        const formEvent = cy.stub().as('formEvent');
        mountFn({
          formDef: defineForm({
            form: [
              {
                uid: 'disabledBtn',
                kind: 'action',
                type: 'button',
                label: 'Disabled',
                disabled: true,
                on: { click: 'disabledClicked' },
              },
              {
                uid: 'enabledBtn',
                kind: 'action',
                type: 'button',
                label: 'Enabled',
                on: { click: 'enabledClicked' },
              },
            ],
          }),
          formEvent,
        });

        cy.get('[data-cy="disabledBtn_button"]').should('have.attr', 'disabled');
        // The native click() does nothing on a disabled button, like a user click. A Cypress
        // click with force dispatches the event anyway.
        cy.get('[data-cy="disabledBtn_button"]').then((button) => button[0].click());
        cy.then(() => afterTwoFrames());
        cy.then(() => {
          expect(eventsNamed(formEvent, 'disabledClicked')).to.have.length(0);
        });

        // Control: the enabled button of the same form sends its event.
        cy.get('[data-cy="enabledBtn_button"]').then((button) => button[0].click());
        cy.get('@formEvent').should(() => {
          expect(eventsNamed(formEvent, 'enabledClicked')).to.have.length(1);
        });
      });

      it('should not render a button while its include.when is false', () => {
        let handle!: FormHandle;
        mountFn({
          formDef: defineForm({
            form: [
              {
                uid: 'hiddenBtn',
                kind: 'action',
                type: 'button',
                label: 'Hidden',
                include: { when: '$form.showButton === true' },
              },
              {
                uid: 'shownBtn',
                kind: 'action',
                type: 'button',
                label: 'Shown',
                include: { when: '$form.showButton !== true' },
              },
            ],
          }),
          data: { showButton: false },
          onFormReady: (h) => {
            handle = h;
          },
        });

        cy.get('[data-cy="shownBtn_button"]').should('exist');
        cy.get('[data-cy="hiddenBtn_button"]').should('not.exist');

        cy.then(() => handle.setData({ showButton: true }));
        cy.get('[data-cy="hiddenBtn_button"]').should('exist');
        cy.get('[data-cy="shownBtn_button"]').should('not.exist');
      });
    });
  });
};
