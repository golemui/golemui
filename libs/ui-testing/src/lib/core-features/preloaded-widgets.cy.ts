import { defineForm } from '@golemui/core';
import { type MountComponentFn, eventsNamed } from '../utils';
import { customWidgetsForm } from './custom-widgets-form';

const submitButton = {
  uid: 'submit',
  kind: 'action',
  type: 'button',
  label: 'Submit',
  actionType: 'submit',
} as const;

/**
 * Registers the tests for a form whose widgets were loaded with `preloadFormWidgets` before the
 * mount. A form must give the same results as with widgets that load on demand.
 *
 * @param mountFn - Mounts a form with the options and the framework of the calling package.
 */
export const runPreloadedWidgetsComponentTests = (mountFn: MountComponentFn) => {
  describe('Preloaded widgets', () => {
    it('should submit the typed value of a textinput', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountFn({
        preloadWidgets: true,
        formDef: defineForm({
          form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name' }, submitButton],
        }),
        formSubmit,
      });

      cy.get('[data-cy="name_textinput"]').type('Ada');
      cy.get('[data-cy="submit_button"]').click();
      cy.get('@formSubmit').should('have.been.calledOnce');
      cy.get('@formSubmit').should(() => {
        expect(formSubmit.getCall(0).args[0].data).to.deep.equal({ name: 'Ada' });
      });
    });

    it('should add and remove repeater rows and submit the rows that are left', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountFn({
        preloadWidgets: true,
        formDef: defineForm({
          form: [
            {
              uid: 'users',
              kind: 'input',
              type: 'repeater',
              path: 'users',
              props: {
                addLabel: 'Add user',
                removeLabel: 'Remove user',
                template: {
                  kind: 'layout',
                  type: 'grid',
                  children: [
                    {
                      uid: 'name',
                      kind: 'input',
                      type: 'textinput',
                      path: 'users.items.name',
                    },
                  ],
                },
              },
            },
            submitButton,
          ],
        }),
        data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
        formSubmit,
      });

      cy.get('.gui-button').contains('Add user').click();
      cy.get('[data-cy="name[2]_textinput"]').type('Grace');
      cy.get('.gui-button').contains('Remove user').click();
      cy.get('[data-cy="name[2]_textinput"]').should('not.exist');
      cy.get('[data-cy="name[0]_textinput"]').should('have.value', 'Linus');
      cy.get('[data-cy="name[1]_textinput"]').should('have.value', 'Grace');

      cy.get('[data-cy="submit_button"]').click();
      cy.get('@formSubmit').should('have.been.calledOnce');
      cy.get('@formSubmit').should(() => {
        expect(formSubmit.getCall(0).args[0].data).to.deep.equal({
          users: [{ name: 'Linus' }, { name: 'Grace' }],
        });
      });
    });

    it('should render a custom layout and send the event of a custom action', () => {
      const formEvent = cy.stub().as('formEvent');
      mountFn({
        preloadWidgets: true,
        withCustomComponent: true,
        formDef: customWidgetsForm(),
        formEvent,
      });

      cy.get('[data-cy="custom-layout-title"]').should('have.text', 'Contact');
      cy.get('[data-cy="custom-layout"] [data-cy="name_textinput"]').type('Ada');
      cy.get('[data-cy="custom-action"]').click();
      cy.get('@formEvent').should(() => {
        const events = eventsNamed(formEvent, 'customClicked');
        expect(events).to.have.length(1);
        expect(events[0].data).to.deep.equal({ name: 'Ada' });
      });
    });
  });
};
