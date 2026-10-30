import { type MountComponentFn, eventsNamed } from '../utils';
import { defineForm } from '@golemui/core';
import { customWidgetsForm } from './custom-widgets-form';

/**
 * Registers the tests for widgets that the form loads with a dynamic import, and for custom
 * widgets of each kind.
 *
 * @param mountFn - Mounts a form with the options and the framework of the calling package.
 */
export const runWidgetLoadersComponentTests = (mountFn: MountComponentFn) => {
  describe('Widget Loaders', () => {
    it('Should load a custom component', () => {
      mountFn({
        withCustomComponent: true,
        formDef: defineForm({
          form: [
            {
              uid: '',
              kind: 'display',
              type: 'heading',
              props: {
                text: 'KITCHEN SINK',
                level: 3,
              },
            },
          ],
        }),
      });

      cy.get('[data-cy="heading"]').should('exist');
    });

    it('should render a custom layout with its props and its children', () => {
      mountFn({ withCustomComponent: true, formDef: customWidgetsForm(), data: { name: 'Ada' } });

      cy.get('[data-cy="custom-layout-title"]').should('have.text', 'Contact');
      cy.get('[data-cy="custom-layout"] [data-cy="name_textinput"]').should('have.value', 'Ada');
      cy.get('[data-cy="custom-layout"] [data-cy="custom-action"]')
        .invoke('text')
        .should((text) => expect(text.trim()).to.equal('Save'));
    });

    it('should send the form event of a custom action on click', () => {
      const formEvent = cy.stub().as('formEvent');
      mountFn({ withCustomComponent: true, formDef: customWidgetsForm(), formEvent });

      cy.get('[data-cy="name_textinput"]').type('Ada');
      cy.get('[data-cy="custom-action"]').click();
      cy.get('@formEvent').should(() => {
        const events = eventsNamed(formEvent, 'customClicked');
        expect(events).to.have.length(1);
        expect(events[0].data).to.deep.equal({ name: 'Ada' });
      });
    });
  });
};
