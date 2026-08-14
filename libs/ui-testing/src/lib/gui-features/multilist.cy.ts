import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the multiList widget: a multiselectable listbox with the
// selected values rendered as pills above it (the range calendar model —
// pills are ordinary tab stops, removable and clickable).
export const runMultiListComponentTests = (mountFn: MountComponentFn) => {
  describe('MultiList Component', () => {
    const uid = 'testSubject';
    const sel = {
      pill: '.gui-multi-list-widget button.gui-pills__pill',
      pillText: '.gui-multi-list-widget .gui-pills__pill-text',
      pillRemove: '.gui-multi-list-widget .gui-pills__pill-remove',
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
      it('should toggle values on click and render their pills above the list', () => {
        mountMultiList();

        cy.get(sel.row).first().click();
        cy.get(sel.pillText).should('have.length', 1).and('contain', 'React');
        cy.get(sel.row).eq(2).click();
        cy.get(sel.pillText).should('have.length', 2);

        // The pills strip renders before the listbox
        cy.get('.gui-multi-list-widget .gui-widget > gui-pills + gui-multi-list').should('exist');

        // Toggling a selected row removes it
        cy.get(sel.row).first().click();
        cy.get(sel.pillText).should('have.length', 1).and('contain', 'Vue');
      });

      it('should toggle the focused option with Enter and Space', () => {
        mountMultiList();

        cy.get('gui-multi-list').focus();
        cy.get('gui-multi-list').trigger('keydown', { key: 'ArrowDown' });
        cy.get('gui-multi-list').trigger('keydown', { key: 'Enter' });
        cy.get(sel.pillText).should('have.length', 1).and('contain', 'React');

        cy.get('gui-multi-list').trigger('keydown', { key: ' ' });
        cy.get(sel.pillText).should('have.length', 0);
      });

      it('should not add beyond the limit', () => {
        mountMultiList({ props: { limit: 1 } });

        cy.get(sel.row).first().click();
        cy.get(sel.row).eq(1).click();
        cy.get(sel.pillText).should('have.length', 1);
      });
    });

    describe('pills', () => {
      it('should render pills for preselected values with labels from labelField', () => {
        mountMultiList({
          items: [
            { label: 'React', value: 'react' },
            { label: 'Angular', value: 'angular' },
            { label: 'Vue', value: 'vue' },
          ],
          props: { labelField: 'label', valueField: 'value' },
          data: { myField: ['react', 'vue'] },
        });

        cy.get(sel.pillText).should('have.length', 2);
        cy.get(sel.pillText).first().should('contain', 'React');
        cy.get(sel.pillText).eq(1).should('contain', 'Vue');
      });

      it('should remove the value when its pill is removed', () => {
        mountMultiList({ data: { myField: ['React', 'Vue'] } });

        cy.get(sel.pillRemove).first().click();
        cy.get(sel.pillText).should('have.length', 1).and('contain', 'Vue');
        cy.get(sel.row).first().should('have.attr', 'aria-selected', 'false');
      });

      it('should focus its option when a pill is clicked', () => {
        mountMultiList({ data: { myField: ['Vue'] } });

        cy.get(sel.pill).first().click();
        cy.get('gui-multi-list')
          .should('have.attr', 'aria-activedescendant')
          .then((activeId) => {
            cy.get(`#${activeId}`).should('contain.text', 'Vue');
          });
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

    describe('accessibility', () => {
      it('should expose a multiselectable listbox with aria-selected rows', () => {
        mountMultiList({ data: { myField: ['React'] } });

        cy.get('gui-multi-list')
          .should('have.attr', 'role', 'listbox')
          .should('have.attr', 'aria-multiselectable', 'true');
        cy.get(sel.row).first().should('have.attr', 'aria-selected', 'true');
        cy.get(sel.row).eq(1).should('have.attr', 'aria-selected', 'false');
      });
    });
  });
};
