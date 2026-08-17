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

    it('should consume Escape while the list is open so it does not bubble to a modal', () => {
      mountWithItems(['React', 'Angular', 'Vue']);

      // A modal ancestor typically closes on a document-level Escape keydown.
      const escSpy = cy.spy().as('escSpy');
      cy.document().then((doc) => {
        doc.addEventListener('keydown', (e) => {
          if ((e as KeyboardEvent).key === 'Escape') escSpy();
        });
      });

      cy.get('[data-cy="testSubject_textinput"]').click();
      cy.get('gui-list:not([hidden])').should('exist');

      // Escape closes the list and is consumed — it must not reach document
      cy.get('[data-cy="testSubject_textinput"]').type('{esc}');
      cy.get('gui-list').should('have.attr', 'hidden');
      cy.get('@escSpy').should('not.have.been.called');

      // With the list closed, Escape is free to bubble (so a modal can close)
      cy.get('[data-cy="testSubject_textinput"]').type('{esc}');
      cy.get('@escSpy').should('have.been.called');
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

    describe('field icon', () => {
      it('should render the icon and pad the input clear of it', () => {
        mountWithItems(['one', 'two'], { icon: 'search' });

        cy.get('.gui-dropdown .gui-widget-icon')
          .should('have.attr', 'data-icon', 'search')
          .and('have.attr', 'aria-hidden', 'true');
        cy.get('[data-cy="testSubject_textinput"]')
          .should('have.class', 'gui-dropdown--icon')
          .and('have.css', 'padding-left', '40px'); // 2.5rem clears the icon
      });

      it('should not render the icon span without the icon prop', () => {
        mountWithItems(['one', 'two']);
        cy.get('.gui-dropdown .gui-widget-icon').should('not.exist');
      });
    });

    describe('panel toggle button', () => {
      const toggleSel = 'button.gui-dropdown__arrow';
      const panelSel = '.gui-dropdown .gui-widget > .gui-picker__panel';

      it('should expose a named toggle button wired to the listbox', () => {
        mountWithItems(['one', 'two']);

        cy.get(toggleSel)
          .should('have.attr', 'aria-label', 'Show options')
          .should('have.attr', 'aria-haspopup', 'listbox')
          .should('have.attr', 'aria-expanded', 'false')
          .should('have.attr', 'aria-controls', 'testSubject-list');
        cy.get(toggleSel).then(($btn) => {
          cy.get(`[id="${$btn.attr('aria-controls')}"]`).should('exist');
        });
      });

      it('should open and close the panel from the toggle button, keeping focus in the input', () => {
        mountWithItems(['one', 'two']);

        cy.get(toggleSel).click();
        cy.get(panelSel).should('be.visible');
        cy.get(toggleSel).should('have.attr', 'aria-expanded', 'true');
        cy.focused().should('have.attr', 'data-cy', 'testSubject_textinput');

        cy.get(toggleSel).click();
        cy.get(panelSel).should('not.be.visible');
        cy.get(toggleSel).should('have.attr', 'aria-expanded', 'false');
        cy.focused().should('have.attr', 'data-cy', 'testSubject_textinput');
      });

      it('should respect a custom toggleAriaLabel', () => {
        mountWithItems(['one'], { toggleAriaLabel: 'Abrir opciones' });
        cy.get(toggleSel).should('have.attr', 'aria-label', 'Abrir opciones');
      });

      // The whole widget is one focus scope, like the pickers: moving focus
      // between its parts keeps the panel open; leaving the widget closes it.
      it('should keep the panel open when focus moves from the input to the toggle button', () => {
        mountWithItems(['one', 'two']);

        cy.get('[data-cy="testSubject_textinput"]').focus();
        cy.get(panelSel).should('be.visible');

        cy.get(toggleSel).focus();
        cy.get(panelSel).should('be.visible');
      });

      it('should close the panel when focus leaves the widget from the toggle button', () => {
        mountWithItems(['one', 'two']);

        cy.get('[data-cy="testSubject_textinput"]').focus();
        cy.get(toggleSel).focus();
        cy.get(toggleSel).blur();
        cy.get(panelSel).should('not.be.visible');
      });
    });

    describe('accessibility', () => {
      const inputSel = '[data-cy="testSubject_textinput"]';

      it('should expose the input as a combobox controlling the listbox', () => {
        mountWithItems(['React', 'Angular', 'Vue']);

        cy.get(inputSel)
          .should('have.attr', 'role', 'combobox')
          .should('have.attr', 'aria-autocomplete', 'list')
          .should('have.attr', 'aria-expanded', 'false')
          .should('have.attr', 'aria-controls', 'testSubject-list');
        cy.get('gui-list#testSubject-list').should('have.attr', 'role', 'listbox');

        cy.get(inputSel).click();
        cy.get(inputSel).should('have.attr', 'aria-expanded', 'true');
      });

      it('should keep the listbox host as the single tab stop', () => {
        mountWithItems(['React', 'Angular', 'Vue']);

        // The scroll viewport opts out of Chrome's implicit scrollable-region
        // focusability — otherwise a scrollable list gets a second tab stop.
        cy.get('gui-list').should('have.attr', 'tabindex', '0');
        cy.get('gui-list')
          .shadow()
          .find('.gui-list__scroll-viewport')
          .should('have.attr', 'tabindex', '-1');
      });

      it('should not render duplicate ids for the input and the list', () => {
        mountWithItems(['React', 'Angular', 'Vue']);
        cy.get('[id="testSubject"]').should('have.length', 1);
        cy.get('[id="testSubject-list"]').should('have.length', 1);
      });

      it('should point aria-activedescendant at a resolvable option', () => {
        mountWithItems(['React', 'Angular', 'Vue']);

        cy.get(inputSel).click();
        cy.get('gui-list').focus();
        cy.get('gui-list').trigger('keydown', { key: 'ArrowDown' });

        cy.get('gui-list')
          .should('have.attr', 'aria-activedescendant')
          .then((activeId) => {
            cy.get(`#${activeId}`).should('exist').should('have.attr', 'role', 'option');
          });
      });
    });

    describe('panel chrome and in-panel errors', () => {
      const inputSel = '[data-cy="testSubject_textinput"]';
      const panelSel = '.gui-dropdown .gui-widget > .gui-picker__panel';

      const mountWithValidator = (items: unknown[]) => {
        mountFn({
          formDef: defineForm({
            form: [
              {
                uid: 'testSubject',
                kind: 'input',
                type: 'dropdown',
                path: 'myField',
                validator: { type: 'string', required: true } as any,
                props: { items, inputDebounce: 0 },
              },
            ],
          }),
        });
      };

      it('should hide the panel while closed and show it while open', () => {
        mountWithItems(['React', 'Angular', 'Vue']);
        cy.get(panelSel).should('have.attr', 'hidden');

        cy.get(inputSel).click();
        cy.get(panelSel).should('not.have.attr', 'hidden');
        cy.get(panelSel).should('be.visible');
      });

      it('should repeat the field error inside the open panel with the red border', () => {
        mountWithValidator(['React', 'Angular', 'Vue']);

        // Touch and leave → the required error shows below the field
        cy.get(inputSel).focus();
        cy.get(inputSel).blur();
        cy.get('[data-cy="testSubject_validator-error"]').should('be.visible');

        cy.get(inputSel).click();
        cy.get('[data-cy="testSubject_panel-validator-error"]').should('be.visible');
        cy.get('#testSubject_panel_errors')
          .should('have.attr', 'aria-hidden', 'true')
          .and('not.have.attr', 'role');
        cy.get('[id="testSubject_errors"]').should('have.length', 1);

        // Invalid field → input and panel share the red border; the inner
        // listbox keeps its default border (the panel owns the invalid
        // chrome, parity with the pickers)
        cy.get(inputSel).should('have.attr', 'aria-invalid', 'true');
        cy.get('[data-cy="testSubject_validator-error"]').then(($li) => {
          cy.get(panelSel).should('have.css', 'border-top-color', $li.css('color'));
          cy.get('gui-list')
            .should('have.attr', 'aria-invalid', 'true')
            .and('not.have.css', 'border-top-color', $li.css('color'));
        });
      });

      it('should keep the list open when the panel error text is clicked', () => {
        mountWithValidator(['React', 'Angular', 'Vue']);

        cy.get(inputSel).focus();
        cy.get(inputSel).blur();
        cy.get('[data-cy="testSubject_validator-error"]').should('be.visible');

        cy.get(inputSel).click();
        cy.get('[data-cy="testSubject_panel-validator-error"]').should('be.visible');
        cy.get('[data-cy="testSubject_panel-validator-error"]').click();
        cy.get('gui-list:not([hidden])').should('exist');
      });

      it('should not render the panel error copy when the value is valid', () => {
        mountWithItems(['React', 'Angular', 'Vue']);
        cy.get(inputSel).click();
        cy.get(panelSel).should('be.visible');
        cy.get('[data-cy="testSubject_panel-validator-errors"]').should('not.exist');
      });
    });
  });
};
