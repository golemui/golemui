import { defineForm, type FormWidget } from '@golemui/core';
import { expectNoDuplicateIds, type MountComponentFn, testDomId, withTestFormName } from '../utils';

export const runMenuButtonComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('Menu Component', () => {
    const UID = 'rowActions';
    const items = [
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { separator: true },
      { label: 'Archive', value: 'archive', disabled: true },
      { label: 'Delete', value: 'delete' },
    ];

    const menuWidget = (overrides: Record<string, unknown> = {}, props = {}) =>
      ({
        uid: UID,
        kind: 'action',
        type: 'menuButton',
        label: 'Actions',
        on: { click: 'rowAction' },
        props: { items, ...props },
        ...overrides,
      }) as FormWidget<string>;

    const mountMenu = (overrides: Record<string, unknown> = {}, props = {}) => {
      const formEvent = cy.stub().as('formEvent');
      mountFn({ formDef: defineForm({ form: [menuWidget(overrides, props)] }), formEvent });
    };

    const button = (uid = UID) => cy.get(`[data-cy="${uid}_button"]`);
    const panel = (uid = UID) => cy.get(`[data-cy="${uid}_menu"]`);
    const item = (value: string, uid = UID) => cy.get(`[data-cy="${uid}_item_${value}"]`);
    const isOpen = (expected: boolean, uid = UID) =>
      panel(uid).should(([element]) =>
        expect(element.matches(':popover-open'), 'menu open').to.equal(expected),
      );
    const picks = (name = 'rowAction', field: 'detail' | 'row' = 'detail') =>
      cy.get('@formEvent').then((stub) =>
        (stub as unknown as sinon.SinonStub)
          .getCalls()
          .filter((call) => call.args[0].name === name)
          .map((call) => call.args[0][field]),
      );

    it('renders a button that names a menu of its items, closed', () => {
      mountMenu();

      button()
        .should('contain.text', 'Actions')
        .and('have.attr', 'popovertarget', testDomId(`${UID}_menu`))
        .and('have.attr', 'aria-haspopup', 'menu');
      panel()
        .should('have.attr', 'role', 'menu')
        .and('have.attr', 'aria-labelledby', testDomId(UID));
      panel().find('[role="menuitem"]').should('have.length', 4);
      panel().find('hr').should('have.length', 1);
      isOpen(false);
    });

    it('opens from its button at the first item', () => {
      mountMenu();

      button().click();
      isOpen(true);
      cy.focused().should('have.attr', 'data-cy', `${UID}_item_edit`);
    });

    it('emits the click event with the picked value, closes and returns focus to the button', () => {
      mountMenu();

      button().click();
      item('duplicate').click();

      picks().should('deep.equal', [{ value: 'duplicate' }]);
      isOpen(false);
      cy.focused().should('have.attr', 'data-cy', `${UID}_button`);
    });

    it('moves through the items with the arrows, skipping a disabled one', () => {
      mountMenu();

      button().click();
      cy.focused().trigger('keydown', { key: 'End' });
      cy.focused().should('have.attr', 'data-cy', `${UID}_item_delete`);
      cy.focused().trigger('keydown', { key: 'ArrowUp' });
      cy.focused().should('have.attr', 'data-cy', `${UID}_item_duplicate`);
    });

    it('ignores a disabled item', () => {
      mountMenu();

      button().click();
      item('archive').should('be.disabled').click({ force: true });

      picks().should('deep.equal', []);
      isOpen(true);
    });

    it('disables its button, so the menu does not open', () => {
      mountMenu({ disabled: true });

      button().should('be.disabled').click({ force: true });
      isOpen(false);
    });

    it('shows the button variant and icon', () => {
      mountMenu({}, { variant: 'outlined', icon: 'more_vert', iconPosition: 'right' });

      button()
        .should('have.class', 'gui-button--outlined')
        .and('have.class', 'gui-button-with-icon')
        .and('have.class', 'gui-button-icon-right');
      button().find('[data-icon="more_vert"]').should('have.attr', 'aria-hidden', 'true');
    });

    it('names an icon-only button with ariaLabel, and the menu after it', () => {
      mountMenu({ label: undefined }, { icon: 'more_vert', ariaLabel: 'Row actions' });

      button()
        .should('have.attr', 'aria-label', 'Row actions')
        .find('span')
        .should('have.length', 1);
      panel().should('have.attr', 'aria-labelledby', testDomId(UID));
    });

    it('keeps a visible label as the name, ignoring ariaLabel', () => {
      mountMenu({}, { ariaLabel: 'Row actions' });

      button().should('not.have.attr', 'aria-label');
    });

    it('describes its button with a tooltip, which closes when the button opens the menu', () => {
      mountMenu(
        { label: undefined },
        { icon: 'more_vert', ariaLabel: 'Row actions', tooltip: 'Edit or delete the row' },
      );
      const tooltip = () => cy.get('gui-tooltip');
      const tooltipIsOpen = (open: boolean) =>
        tooltip().should(([element]) =>
          expect(element.matches(':popover-open'), 'tooltip open').to.equal(open),
        );

      tooltip()
        .should('have.attr', 'id', testDomId(`${UID}_tooltip`))
        .and('have.attr', 'role', 'tooltip')
        .and('have.text', 'Edit or delete the row');
      button()
        .should('have.attr', 'aria-describedby', testDomId(`${UID}_tooltip`))
        .and('have.attr', 'aria-label', 'Row actions');

      button().trigger('pointerenter', { pointerType: 'mouse' });
      tooltipIsOpen(true);
      button().trigger('pointerdown').click();
      tooltipIsOpen(false);
      isOpen(true);
      expectNoDuplicateIds();
    });

    it('names an icon-only button, and the menu after it, by its tooltip when it has no ariaLabel', () => {
      mountMenu({ label: undefined }, { icon: 'more_vert', tooltip: 'Row actions' });

      button()
        .should('have.attr', 'aria-label', 'Row actions')
        .and('not.have.attr', 'aria-describedby');
      panel().should('have.attr', 'aria-labelledby', testDomId(UID));
      cy.get('gui-tooltip').should(([element]) =>
        expect((element as HTMLElement & { type: string }).type).to.equal('label'),
      );
    });

    it('gives each repeater row its own menu', () => {
      const formEvent = cy.stub().as('formEvent');
      mountFn({
        data: { rows: [{ name: 'A' }, { name: 'B' }] },
        formDef: defineForm({
          form: [
            {
              uid: 'rows',
              kind: 'input',
              type: 'repeater',
              path: 'rows',
              props: {
                template: {
                  kind: 'layout',
                  type: 'grid',
                  children: [menuWidget()],
                },
              },
            } as FormWidget<string>,
          ],
        }),
        formEvent,
      });

      button(`${UID}[1]`)
        .should('have.attr', 'popovertarget', testDomId(`${UID}[1]_menu`))
        .click();
      isOpen(true, `${UID}[1]`);
      isOpen(false, `${UID}[0]`);
      item('edit', `${UID}[1]`).click();

      picks().should('deep.equal', [{ value: 'edit' }]);
      expectNoDuplicateIds();
    });

    it('sends the row of the menu with the pick, also in a row reused after a removal', () => {
      const formEvent = cy.stub().as('formEvent');
      mountFn({
        data: { rows: [{ name: 'A' }, { name: 'B' }] },
        formDef: defineForm({
          form: [
            {
              uid: 'rows',
              kind: 'input',
              type: 'repeater',
              path: 'rows',
              props: {
                template: {
                  kind: 'layout',
                  type: 'grid',
                  children: [menuWidget()],
                },
              },
            } as FormWidget<string>,
          ],
        }),
        formEvent,
      });
      button(`${UID}[1]`).click();
      item('edit', `${UID}[1]`).click();
      picks('rowAction', 'row').should('deep.equal', [{ index: 1, indexes: [1], path: 'rows.1' }]);

      cy.get('.gui-repeater__remove-btn').eq(0).click();
      button(`${UID}[1]`).should('not.exist');
      button(`${UID}[0]`).click();
      item('edit', `${UID}[0]`).click();
      picks('rowAction', 'row').should('deep.equal', [
        { index: 1, indexes: [1], path: 'rows.1' },
        { index: 0, indexes: [0], path: 'rows.0' },
      ]);
    });
  });
};
