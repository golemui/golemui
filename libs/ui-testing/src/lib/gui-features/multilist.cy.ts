import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the multiList widget: a multiselectable listbox whose
// value is the array of toggled item values. Selection state lives on the
// rows themselves (aria-selected + the default renderer's check square).
export const runMultiListComponentTests = (mountFn: MountComponentFn) => {
  describe('MultiList Component', () => {
    const uid = 'testSubject';
    const sel = {
      row: 'gui-multi-list .gui-list__item-wrapper',
    };

    const mountMultiList = (options?: {
      data?: Record<string, any>;
      items?: unknown[];
      props?: Record<string, unknown>;
    }) => {
      mountFn({
        localization: identityTranslator('en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'multiList',
              path: 'myField',
              props: {
                items: options?.items ?? ['React', 'Angular', 'Vue'],
                ...options?.props,
              },
            },
          ],
        }),
      });
    };

    describe('toggle semantics', () => {
      it('should toggle values on click, and back off on a second click', () => {
        mountMultiList();

        cy.get(sel.row).first().click();
        cy.get(sel.row).first().should('have.attr', 'aria-selected', 'true');
        cy.get(sel.row).eq(2).click();
        cy.get(sel.row).eq(2).should('have.attr', 'aria-selected', 'true');
        cy.get(sel.row).eq(1).should('have.attr', 'aria-selected', 'false');

        // Toggling a selected row removes it
        cy.get(sel.row).first().click();
        cy.get(sel.row).first().should('have.attr', 'aria-selected', 'false');
        cy.get(sel.row).eq(2).should('have.attr', 'aria-selected', 'true');
      });

      it('should toggle the focused option with Enter and Space', () => {
        mountMultiList();

        cy.get('gui-multi-list').focus();
        cy.get('gui-multi-list').trigger('keydown', { key: 'ArrowDown' });
        cy.get('gui-multi-list').trigger('keydown', { key: 'Enter' });
        cy.get(sel.row).first().should('have.attr', 'aria-selected', 'true');

        cy.get('gui-multi-list').trigger('keydown', { key: ' ' });
        cy.get(sel.row).first().should('have.attr', 'aria-selected', 'false');
      });

      it('should mark preselected values resolved through valueField', () => {
        mountMultiList({
          items: [
            { label: 'React', value: 'react' },
            { label: 'Angular', value: 'angular' },
            { label: 'Vue', value: 'vue' },
          ],
          props: { labelField: 'label', valueField: 'value' },
          data: { myField: ['react', 'vue'] },
        });

        cy.get(sel.row).first().should('have.attr', 'aria-selected', 'true');
        cy.get(sel.row).eq(1).should('have.attr', 'aria-selected', 'false');
        cy.get(sel.row).eq(2).should('have.attr', 'aria-selected', 'true');
      });
    });

    describe('default multi item renderer', () => {
      it('should render a check square that reflects toggle state', () => {
        mountMultiList({ data: { myField: ['React'] } });

        cy.get(sel.row).first().find('.gui-list__item-check svg').should('be.visible');
        cy.get(sel.row).eq(1).find('.gui-list__item-check svg').should('not.be.visible');

        cy.get(sel.row).eq(1).click();
        cy.get(sel.row).eq(1).find('.gui-list__item-check svg').should('be.visible');
      });
    });

    describe('validation', () => {
      it('should mark the listbox invalid with the red border after touch', () => {
        mountFn({
          localization: identityTranslator('en-US'),
          formDef: defineForm({
            form: [
              {
                uid,
                kind: 'input',
                type: 'multiList',
                path: 'myField',
                validator: { type: 'array', required: true } as any,
                props: { items: ['React', 'Angular', 'Vue'] },
              },
            ],
          }),
        });

        cy.get('gui-multi-list').focus();
        cy.get('gui-multi-list').blur();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('be.visible');

        cy.get('gui-multi-list').should('have.attr', 'aria-invalid', 'true');
        cy.get(`[data-cy="${uid}_validator-error"]`).then(($li) => {
          cy.get('gui-multi-list').should('have.css', 'border-top-color', $li.css('color'));
        });
      });
    });

    describe('accessibility', () => {
      it('should expose a multiselectable listbox with aria-selected rows', () => {
        mountMultiList({ data: { myField: ['React'] } });

        cy.get('gui-multi-list')
          .should('have.attr', 'role', 'listbox')
          .should('have.attr', 'aria-multiselectable', 'true');
        cy.get(sel.row).first().should('have.attr', 'aria-selected', 'true');
        cy.get(sel.row).eq(1).should('have.attr', 'aria-selected', 'false');
      });

      it('should keep the listbox host as the single tab stop', () => {
        mountMultiList();

        // The scroll viewport opts out of Chrome's implicit scrollable-region
        // focusability — otherwise a scrollable list gets a second tab stop.
        cy.get('gui-multi-list').should('have.attr', 'tabindex', '0');
        cy.get('gui-multi-list')
          .shadow()
          .find('.gui-list__scroll-viewport')
          .should('have.attr', 'tabindex', '-1');
      });
    });
  });
};
