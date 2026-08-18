import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the single-choice list widget: a listbox whose value is
// the selected item value. Pins the invalid chrome (the label's aria
// controller stamps aria-invalid onto the listbox host) and the
// single-tab-stop contract shared with gui-multi-list.
export const runListComponentTests = (mountFn: MountComponentFn) => {
  describe('List Component', () => {
    const uid = 'testSubject';
    const sel = {
      row: 'gui-list .gui-list__item-wrapper',
    };

    const mountList = (options?: {
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
              type: 'list',
              path: 'myField',
              ...(options?.validator ? { validator: options.validator as any } : {}),
              props: {
                items: options?.items ?? ['React', 'Angular', 'Vue'],
                ...options?.props,
              },
            },
          ],
        }),
      });
    };

    describe('selection', () => {
      it('should select a row on click and reflect it with aria-selected', () => {
        mountList();

        cy.get(sel.row).first().click();
        cy.get(sel.row).first().should('have.attr', 'aria-selected', 'true');
        cy.get(sel.row).eq(1).should('have.attr', 'aria-selected', 'false');
      });
    });

    describe('keyboard navigation', () => {
      const objectItems = (disabledIndex?: number) =>
        ['React', 'Angular', 'Vue'].map((label, i) => ({
          label,
          value: label.toLowerCase(),
          ...(i === disabledIndex ? { disabled: true } : {}),
        }));

      it('should move aria-activedescendant with ArrowDown/ArrowUp', () => {
        mountList();

        cy.get('gui-list').focus();
        cy.focused().type('{downarrow}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-0`);

        cy.focused().type('{downarrow}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-1`);

        cy.focused().type('{uparrow}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-0`);
      });

      it('should skip disabled items when stepping', () => {
        mountList({
          items: objectItems(1),
          props: { labelField: 'label', valueField: 'value' },
        });

        cy.get('gui-list').focus();
        cy.focused().type('{downarrow}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-0`);

        cy.focused().type('{downarrow}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-2`);
      });

      it('should land on the first/last enabled item on Home/End', () => {
        mountList({
          items: objectItems(2),
          props: { labelField: 'label', valueField: 'value' },
        });

        cy.get('gui-list').focus();
        // The last item is disabled — End lands on the last enabled one.
        cy.focused().type('{end}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-1`);

        cy.focused().type('{home}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-0`);
      });

      it('should page by floor(height / itemHeight) rows on PageDown/PageUp', () => {
        mountList({
          items: Array.from({ length: 10 }, (_, i) => `Item ${i}`),
          props: { height: 120, itemHeight: 40 },
        });

        cy.get('gui-list').focus();
        cy.focused().type('{downarrow}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-0`);

        // 120px viewport / 40px rows = a 3-row page (floor semantics, grid-nav)
        cy.focused().type('{pagedown}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-3`);

        cy.focused().type('{pageup}');
        cy.get('gui-list').should('have.attr', 'aria-activedescendant', `${uid}-item-0`);
      });
    });

    describe('validation', () => {
      it('should mark the listbox invalid with the red border after touch', () => {
        mountList({ validator: { type: 'string', required: true } });

        cy.get('gui-list').focus();
        cy.get('gui-list').blur();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('be.visible');

        cy.get('gui-list').should('have.attr', 'aria-invalid', 'true');
        cy.get(`[data-cy="${uid}_validator-error"]`).then(($li) => {
          cy.get('gui-list').should('have.css', 'border-top-color', $li.css('color'));
        });
      });
    });

    describe('accessibility', () => {
      it('should expose a listbox with the host as the single tab stop', () => {
        mountList();

        cy.get('gui-list').should('have.attr', 'role', 'listbox');

        // The scroll viewport opts out of Chrome's implicit scrollable-region
        // focusability — otherwise a scrollable list gets a second tab stop.
        cy.get('gui-list').should('have.attr', 'tabindex', '0');
        cy.get('gui-list')
          .shadow()
          .find('.gui-list__scroll-viewport')
          .should('have.attr', 'tabindex', '-1');
      });
    });
  });
};
