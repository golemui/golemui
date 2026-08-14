import { defineForm, identityTranslator } from '@golemui/core';
import {
  clearPillsWidthOverride,
  forcePillsCompactMode,
  forcePillsStripMode,
  type MountComponentFn,
} from '../utils';

// Behavior tests for the multiDropdown widget: a combobox whose selected
// values render as pills to the left of the filter input. Pins the keyboard
// model shared with tags/range inputs (ArrowLeft at caret 0 / Backspace on an
// empty draft enter the pill list, ArrowRight past the last pill returns to
// the input) with one deliberate divergence: ArrowDown ALWAYS opens the
// option panel — never the pills bubble — because the input is a combobox.
export const runMultiDropdownComponentTests = (mountFn: MountComponentFn) => {
  describe('MultiDropdown Component', () => {
    const uid = 'testSubject';
    const sel = {
      input: `[data-cy="${uid}_textinput"]`,
      field: '.gui-multi-select__field',
      pill: '.gui-multi-dropdown button.gui-pills__pill',
      pillText: '.gui-multi-dropdown .gui-pills__pill-text',
      pillRemove: '.gui-multi-dropdown .gui-pills__pill-remove',
      panel: '.gui-multi-dropdown .gui-widget > .gui-picker__panel',
      pillsDropdown: '.gui-multi-dropdown .gui-pills__dropdown',
    };

    const mountMultiDropdown = (options?: {
      data?: Record<string, any>;
      items?: unknown[];
      props?: Record<string, unknown>;
      validator?: Record<string, unknown>;
    }) => {
      mountFn({
        localization: identityTranslator('en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'multiDropdown',
              path: 'myField',
              ...(options?.validator ? { validator: options.validator as any } : {}),
              props: {
                items: options?.items ?? ['React', 'Angular', 'Vue'],
                inputDebounce: 0,
                ...options?.props,
              },
            },
          ],
        }),
      });
    };

    const visibleItems = () =>
      cy.get('gui-multi-list:not([hidden]) .gui-list__item-wrapper').filter(':visible');

    describe('toggle semantics', () => {
      it('should keep the panel open after toggling an option and render its pill', () => {
        mountMultiDropdown();

        cy.get(sel.input).click();
        visibleItems().should('have.length', 3);

        visibleItems().first().click();
        cy.get(sel.panel).should('not.have.attr', 'hidden');
        cy.get(sel.pillText).should('have.length', 1).and('contain', 'React');

        visibleItems().eq(2).click();
        cy.get(sel.panel).should('not.have.attr', 'hidden');
        cy.get(sel.pillText).should('have.length', 2);
      });

      it('should remove the value when its option is toggled again', () => {
        mountMultiDropdown({ data: { myField: ['React'] } });

        cy.get(sel.input).click();
        visibleItems().first().click();
        cy.get(sel.pillText).should('have.length', 0);
      });

      it('should keep the filter text after a toggle', () => {
        mountMultiDropdown();

        cy.get(sel.input).type('a');
        visibleItems().should('have.length', 2);

        visibleItems().first().click();
        cy.get(sel.input).should('have.value', 'a');
        visibleItems().should('have.length', 2);
      });

      it('should render pill labels from labelField for object items', () => {
        mountMultiDropdown({
          items: [
            { label: 'React', value: 'react' },
            { label: 'Angular', value: 'angular' },
          ],
          props: { labelField: 'label', valueField: 'value' },
          data: { myField: ['angular'] },
        });

        cy.get(sel.pillText).should('have.length', 1).and('contain', 'Angular');
      });
    });

    describe('default multi item renderer', () => {
      it('should render a check square that reflects toggle state', () => {
        mountMultiDropdown({ data: { myField: ['React'] } });

        cy.get(sel.input).click();
        visibleItems().first().find('.gui-list__item-check').should('exist');
        visibleItems()
          .first()
          .find('.gui-list__item')
          .should('have.class', 'gui-list__item-selected');
        visibleItems().first().find('.gui-list__item-check svg').should('be.visible');
        visibleItems().eq(1).find('.gui-list__item-check svg').should('not.be.visible');

        visibleItems().eq(1).click();
        visibleItems().eq(1).find('.gui-list__item-check svg').should('be.visible');
      });
    });

    describe('pills and pill removal', () => {
      beforeEach(() => forcePillsStripMode(sel.field));
      afterEach(clearPillsWidthOverride);

      it('should render the pills before the input inside the field', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get(`${sel.field} > gui-pills + input[role="combobox"]`).should('exist');
        cy.get(sel.pillText).should('have.length', 2);
      });

      it('should remove a pill with its remove affordance', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get(sel.pillRemove).first().click();
        cy.get(sel.pillText).should('have.length', 1).and('contain', 'Vue');
      });

      it('should remove pills on Delete with focus handoff, ending at the input', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get(sel.input).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', 'Vue');

        cy.focused().type('{del}');
        cy.get(sel.pillText).should('have.length', 1);
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', 'React');

        cy.focused().type('{del}');
        cy.get(sel.pillText).should('have.length', 0);
        cy.focused().should('have.attr', 'data-cy', `${uid}_textinput`);
      });
    });

    describe('pill keyboard navigation (strip)', () => {
      beforeEach(() => forcePillsStripMode(sel.field));
      afterEach(clearPillsWidthOverride);

      it('should enter the strip at the LAST pill on ArrowLeft at caret 0', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get(sel.input).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', 'Vue');
      });

      it('should NOT enter the strip while the caret is inside the draft', () => {
        mountMultiDropdown({ data: { myField: ['React'] } });

        cy.get(sel.input).type('x');
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-cy', `${uid}_textinput`);
      });

      it('should focus (not delete) the last pill on Backspace with an empty draft', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get(sel.input).focus();
        cy.focused().type('{backspace}');
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', 'Vue');
        cy.get(sel.pillText).should('have.length', 2);
      });

      it('should return focus to the input on ArrowRight past the last pill', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get(sel.input).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.class', 'gui-pills__pill');

        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-cy', `${uid}_textinput`);
      });

      it('should open the option panel on ArrowDown, never the pills bubble', () => {
        mountMultiDropdown({ data: { myField: ['React'] } });

        cy.get(sel.input).focus();
        cy.focused().type('{downArrow}');
        cy.get(sel.panel).should('not.have.attr', 'hidden');
        cy.get(sel.pillsDropdown).should('not.exist');
      });
    });

    describe('pill keyboard navigation (compact)', () => {
      beforeEach(() => forcePillsCompactMode(sel.field));
      afterEach(clearPillsWidthOverride);

      it('should open the option panel on ArrowDown, never the pills bubble', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get(sel.input).focus();
        cy.focused().type('{downArrow}');
        cy.get(sel.panel).should('not.have.attr', 'hidden');
        cy.get(sel.pillsDropdown).should('not.exist');
      });

      it('should enter the pills dropdown on ArrowLeft at caret 0 and close the panel', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        // Focusing the input opens the panel first
        cy.get(sel.input).focus();
        cy.get(sel.panel).should('not.have.attr', 'hidden');

        cy.focused().type('{leftArrow}');
        cy.get(sel.pillsDropdown).should('exist');
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', 'React');
        cy.get(sel.panel).should('have.attr', 'hidden');
      });

      it('should close the panel when the count bubble opens the pills dropdown', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get(sel.input).click();
        cy.get(sel.panel).should('not.have.attr', 'hidden');

        cy.get('.gui-pills__count').click();
        cy.get(sel.pillsDropdown).should('exist');
        cy.get(sel.panel).should('have.attr', 'hidden');
      });

      it('should close the pills dropdown on Escape and return focus to the input', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get('.gui-pills__count').click();
        cy.get('.gui-pills__dropdown button.gui-pills__pill').first().focus();
        cy.focused().type('{esc}');
        cy.get(sel.pillsDropdown).should('not.exist');
        cy.focused().should('have.attr', 'data-cy', `${uid}_textinput`);
      });
    });

    describe('filtering', () => {
      it('should filter primitive items with a multi-character search', () => {
        mountMultiDropdown();

        cy.get(sel.input).type('R');
        visibleItems().should('have.length', 2);

        cy.get(sel.input).type('e');
        visibleItems().should('have.length', 1);
        visibleItems().first().should('contain.text', 'React');
      });

      it('should close the list with Escape from the input', () => {
        mountMultiDropdown();

        cy.get(sel.input).click();
        cy.get('gui-multi-list:not([hidden])').should('exist');

        cy.get(sel.input).type('{esc}');
        cy.get('gui-multi-list').should('have.attr', 'hidden');
      });
    });

    describe('validation and error chrome', () => {
      const mountWithValidator = (items: unknown[]) => {
        mountFn({
          localization: identityTranslator('en-US'),
          formDef: defineForm({
            form: [
              {
                uid,
                kind: 'input',
                type: 'multiDropdown',
                path: 'myField',
                validator: { type: 'array', required: true } as any,
                props: { items, inputDebounce: 0 },
              },
            ],
          }),
        });
      };

      it('should mark the field invalid with the red border after touch', () => {
        mountWithValidator(['React', 'Angular', 'Vue']);

        // Touch and leave → the required error shows below the field
        cy.get(sel.input).focus();
        cy.get(sel.input).blur();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('be.visible');

        // The field wrapper and the combobox input carry aria-invalid; the
        // wrapper paints the error border
        cy.get(sel.field).should('have.attr', 'aria-invalid', 'true');
        cy.get(sel.input).should('have.attr', 'aria-invalid', 'true');
        cy.get(`[data-cy="${uid}_validator-error"]`).then(($li) => {
          cy.get(sel.field).should('have.css', 'border-top-color', $li.css('color'));
        });
      });

      it('should repeat the field error inside the open panel with the red border', () => {
        mountWithValidator(['React', 'Angular', 'Vue']);

        cy.get(sel.input).focus();
        cy.get(sel.input).blur();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('be.visible');

        cy.get(sel.input).click();
        cy.get(`[data-cy="${uid}_panel-validator-error"]`).should('be.visible');

        // Invalid field → the panel shares the red border
        cy.get(`[data-cy="${uid}_validator-error"]`).then(($li) => {
          cy.get(sel.panel).should('have.css', 'border-top-color', $li.css('color'));
        });
      });

      it('should not render the panel error copy when the value is valid', () => {
        mountMultiDropdown();
        cy.get(sel.input).click();
        cy.get(sel.panel).should('be.visible');
        cy.get(`[data-cy="${uid}_panel-validator-errors"]`).should('not.exist');
        cy.get(sel.field).should('not.have.attr', 'aria-invalid');
      });
    });

    describe('accessibility', () => {
      it('should expose the input as a combobox controlling a multiselectable listbox', () => {
        mountMultiDropdown();

        cy.get(sel.input)
          .should('have.attr', 'role', 'combobox')
          .should('have.attr', 'aria-autocomplete', 'list')
          .should('have.attr', 'aria-expanded', 'false')
          .should('have.attr', 'aria-controls', `${uid}-list`);
        cy.get(`gui-multi-list#${uid}-list`)
          .should('have.attr', 'role', 'listbox')
          .should('have.attr', 'aria-multiselectable', 'true');

        cy.get(sel.input).click();
        cy.get(sel.input).should('have.attr', 'aria-expanded', 'true');
      });

      it('should mark toggled rows with aria-selected', () => {
        mountMultiDropdown({ data: { myField: ['React', 'Vue'] } });

        cy.get(sel.input).click();
        visibleItems().first().should('have.attr', 'aria-selected', 'true');
        visibleItems().eq(1).should('have.attr', 'aria-selected', 'false');
        visibleItems().eq(2).should('have.attr', 'aria-selected', 'true');
      });

      it('should point aria-activedescendant at a resolvable option', () => {
        mountMultiDropdown();

        cy.get(sel.input).click();
        cy.get('gui-multi-list').focus();
        cy.get('gui-multi-list').trigger('keydown', { key: 'ArrowDown' });

        cy.get('gui-multi-list')
          .should('have.attr', 'aria-activedescendant')
          .then((activeId) => {
            cy.get(`#${activeId}`).should('exist').should('have.attr', 'role', 'option');
          });
      });
    });
  });
};
