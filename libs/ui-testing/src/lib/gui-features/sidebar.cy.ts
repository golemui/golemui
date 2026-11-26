import { defineForm, type FormWidget } from '@golemui/core';
import {
  dictionaryTranslator,
  eventsNamed,
  expectNoDuplicateIds,
  type MountComponentFn,
  testDomId,
  withTestFormName,
} from '../utils';

export const runSidebarComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('Sidebar Component', () => {
    const UID = 'shell';

    const sideChild = {
      uid: 'nav',
      kind: 'layout',
      type: 'grid',
      children: [
        {
          uid: 'mainMenu',
          kind: 'action',
          type: 'menu',
          label: 'Main',
          on: { click: 'navigate' },
          props: {
            items: [
              { label: 'Orders', value: 'orders' },
              { label: 'Customers', value: 'customers' },
            ],
          },
        },
        { uid: 'filter', kind: 'input', type: 'textinput', path: 'filter', label: 'Filter' },
      ],
    };
    const mainChild = {
      uid: 'content',
      kind: 'layout',
      type: 'grid',
      children: [{ uid: 'notes', kind: 'input', type: 'textarea', path: 'notes', label: 'Notes' }],
    };

    const sidebarWidget = (overrides: Record<string, unknown> = {}, props = {}) =>
      ({
        uid: UID,
        kind: 'layout',
        type: 'sidebar',
        on: { change: 'drawerToggled' },
        props,
        children: [sideChild, mainChild],
        ...overrides,
      }) as FormWidget<any>;

    const mountSidebar = (overrides: Record<string, unknown> = {}, props = {}) => {
      const formEvent = cy.stub().as('formEvent');
      mountFn({ formDef: defineForm({ form: [sidebarWidget(overrides, props)] }), formEvent });
    };

    const part = (name: 'toggle' | 'side' | 'main') => cy.get(`[data-cy="${UID}_${name}"]`);
    const drawerIsOpen = (open: boolean) =>
      part('side').should(([aside]) =>
        expect(aside.matches(':popover-open'), 'drawer open').to.equal(open),
      );
    const events = (name: string) =>
      cy
        .get('@formEvent')
        .then((stub) =>
          eventsNamed(stub as unknown as sinon.SinonStub, name).map((event) => event.detail),
        );
    const openDrawer = () => part('side').then(([aside]) => aside.showPopover());

    describe('wide', () => {
      beforeEach(() => cy.viewport(1200, 800));

      it('puts the side child in a column next to the main one, with no toggle', () => {
        mountSidebar();

        part('side').should('be.visible').find('gui-menu').should('exist');
        part('main').should('be.visible').find('textarea').should('exist');
        part('toggle').should('not.be.visible');
        drawerIsOpen(false);
        cy.get('gui-sidebar').should('have.attr', 'id', testDomId(UID));
      });

      it('renders the side child once, as the side region the toggle opens', () => {
        mountSidebar();

        cy.get('gui-menu').should('have.length', 1);
        part('side').should('have.attr', 'popover');
        part('side').should('have.attr', 'id', testDomId(`${UID}_side`));
        part('toggle').should('have.attr', 'popovertarget', testDomId(`${UID}_side`));
        expectNoDuplicateIds();
      });

      it('names the side region and the toggle "Menu" and "Open menu" by default', () => {
        mountSidebar();

        part('side').should('have.attr', 'aria-label', 'Menu');
        part('toggle').should('have.attr', 'aria-label', 'Open menu');
      });

      it('names them with sideLabel and toggleLabel', () => {
        mountSidebar({}, { sideLabel: 'Workspace', toggleLabel: 'Open the workspace menu' });

        part('side').should('have.attr', 'aria-label', 'Workspace');
        part('toggle').should('have.attr', 'aria-label', 'Open the workspace menu');
      });

      it('puts the side at the end with side "end"', () => {
        mountSidebar({}, { side: 'end', sideSize: 'lg' });

        cy.get('gui-sidebar')
          .should('have.attr', 'side', 'end')
          .and('have.attr', 'side-size', 'lg');
        part('side').should(([aside]) => {
          const main = document.querySelector(`[data-cy="${UID}_main"]`) as Element;
          expect(aside.getBoundingClientRect().left).to.be.at.least(
            main.getBoundingClientRect().right,
          );
        });
      });

      it('gives the main child the full width, and no toggle, when a state hides the side one', () => {
        mountFn({
          formDef: defineForm({
            states: { focused: "$form.focus === 'yes'" },
            form: [
              { uid: 'focus', kind: 'input', type: 'textinput', path: 'focus' },
              sidebarWidget({
                children: [{ ...sideChild, exclude: { from: ['focused'] } }, mainChild],
              }),
            ],
          }),
        });

        part('side').should('exist');
        cy.get('[data-cy="focus_textinput"]').type('yes');
        part('side').should('not.exist');
        part('toggle').should('not.exist');
        part('main').should(([main]) => {
          const sidebar = main.closest('gui-sidebar') as Element;
          expect(main.getBoundingClientRect().width).to.equal(
            sidebar.getBoundingClientRect().width,
          );
        });
      });

      it('translates the names', () => {
        const translator = dictionaryTranslator('en-US', {
          'en-US': { 'nav.side': 'Workspace' },
          'es-ES': { 'nav.side': 'Espacio de trabajo' },
        });
        mountFn({
          localization: translator,
          formDef: defineForm({ form: [sidebarWidget({}, { sideLabel: { key: 'nav.side' } })] }),
        });

        part('side').should('have.attr', 'aria-label', 'Workspace');
        cy.then(() => translator.setLang('es-ES'));
        part('side').should('have.attr', 'aria-label', 'Espacio de trabajo');
      });
    });

    describe('narrow', () => {
      beforeEach(() => cy.viewport(500, 800));

      it('hides the side column and shows the toggle', () => {
        mountSidebar();

        part('side').should('not.be.visible');
        part('toggle').should('be.visible');
        part('main').should('be.visible');
      });

      it('opens the side region from the toggle and reports it, then closes it on a pick', () => {
        mountSidebar();

        part('toggle').click();
        drawerIsOpen(true);
        part('side').find('[data-cy="mainMenu_item_customers"]').click();

        drawerIsOpen(false);
        events('navigate').should('deep.equal', [{ value: 'customers' }]);
        events('drawerToggled').should('deep.equal', [{ open: true }, { open: false }]);
      });

      it('keeps the side child as it was across the switch', () => {
        cy.viewport(1200, 800);
        mountSidebar();
        part('side').find('input').type('late');

        cy.viewport(500, 800);
        part('toggle').should('be.visible');
        openDrawer();
        part('side').find('input').should('have.value', 'late');
      });

      it('keeps the drawer open when nothing was picked', () => {
        mountSidebar();
        openDrawer();

        part('side').find('input').click();
        drawerIsOpen(true);
      });
    });
  });
};
