import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runDropdownComponentTests = (mountFn: MountComponentFn) => {
  describe('Dropdown Component', () => {
    const mountWithItems = (items: unknown[], extraProps: Record<string, unknown> = {}) => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'dropdown',
              path: 'myField',
              props: {
                items,
                inputDebounce: 0,
                ...extraProps,
              },
            },
          ],
        }),
      });
    };

    const visibleItems = () =>
      cy.get('gui-list:not([hidden]) .gui-list__item-wrapper').filter(':visible');

    it('should filter primitive items with a multi-character search', () => {
      mountWithItems(['React', 'Angular', 'Vue']);

      cy.get('[data-cy="testSubject_textinput"]').type('R');
      visibleItems().should('have.length', 2);

      // Regression: multi-character searches returned no results for
      // primitive items because each character was matched individually
      cy.get('[data-cy="testSubject_textinput"]').type('e');
      visibleItems().should('have.length', 1);
      visibleItems().first().should('contain.text', 'React');
    });

    it('should close the list with Escape from the input', () => {
      mountWithItems(['React', 'Angular', 'Vue']);

      cy.get('[data-cy="testSubject_textinput"]').click();
      cy.get('gui-list:not([hidden])').should('exist');

      cy.get('[data-cy="testSubject_textinput"]').type('{esc}');
      cy.get('gui-list').should('have.attr', 'hidden');
    });

    it('should close the list with Escape after navigating into it', () => {
      mountWithItems(['React', 'Angular', 'Vue']);

      cy.get('[data-cy="testSubject_textinput"]').click();
      cy.get('gui-list:not([hidden])').should('exist');

      // ArrowDown moves focus into the list; Escape there still closes it
      cy.get('[data-cy="testSubject_textinput"]').type('{downArrow}');
      cy.focused().type('{esc}');
      cy.get('gui-list').should('have.attr', 'hidden');
    });

    it('should show all primitive items again when the search is cleared', () => {
      mountWithItems(['React', 'Angular', 'Vue']);

      cy.get('[data-cy="testSubject_textinput"]').type('Re');
      visibleItems().should('have.length', 1);

      cy.get('[data-cy="testSubject_textinput"]').clear();
      visibleItems().should('have.length', 3);
    });

    it('should select a filtered primitive item', () => {
      mountWithItems(['React', 'Angular', 'Vue']);

      cy.get('[data-cy="testSubject_textinput"]').type('Re');
      visibleItems().first().click();

      cy.get('[data-cy="testSubject_textinput"]').should('have.value', 'React');
    });

    it('should filter object items by their search fields', () => {
      mountWithItems(
        [
          { label: 'React', value: 'react' },
          { label: 'Angular', value: 'angular' },
          { label: 'Vue', value: 'vue' },
        ],
        { labelField: 'label', valueField: 'value' },
      );

      cy.get('[data-cy="testSubject_textinput"]').type('Re');
      visibleItems().should('have.length', 1);
      visibleItems().first().should('contain.text', 'React');
    });
  });
};
