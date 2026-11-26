import { defineForm, type FormWidget } from '@golemui/core';
import {
  dictionaryTranslator,
  eventsNamed,
  expectNoDuplicateIds,
  type MountComponentFn,
  testDomId,
  withTestFormName,
} from '../utils';

export const runMenuComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('Menu Component', () => {
    const UID = 'mainMenu';
    const items = [
      { label: 'Home', value: 'home', icon: 'home' },
      {
        label: 'Settings',
        value: 'settings',
        items: [
          { label: 'Profile', value: 'profile' },
          {
            label: 'Billing',
            value: 'billing',
            items: [
              { label: 'Invoices', value: 'invoices' },
              { label: 'Cards', value: 'cards' },
            ],
          },
          { label: 'Archived', value: 'archived', disabled: true },
        ],
      },
      {
        label: 'Reports',
        value: 'reports',
        items: [
          { label: 'Sales', value: 'sales' },
          { label: 'Stock', value: 'stock' },
        ],
      },
    ];

    const menuWidget = (overrides: Record<string, unknown> = {}, props = {}) =>
      ({
        uid: UID,
        kind: 'action',
        type: 'menu',
        label: 'Main',
        on: { click: 'navigate' },
        props: { items, ...props },
        ...overrides,
      }) as FormWidget<any>;

    const mountMenu = (overrides: Record<string, unknown> = {}, props = {}) => {
      const formEvent = cy.stub().as('formEvent');
      mountFn({ formDef: defineForm({ form: [menuWidget(overrides, props)] }), formEvent });
    };

    const nav = () => cy.get(`#${testDomId(UID)}`);
    const item = (value: string, uid = UID) => cy.get(`[data-cy="${uid}_item_${value}"]`);
    const list = (value: string, uid = UID) => cy.get(`#${testDomId(`${uid}_group_${value}`)}`);
    const expectGroup = (value: string, open: boolean) => {
      item(value).should('have.attr', 'aria-expanded', String(open));
      list(value).should(open ? 'not.have.attr' : 'have.attr', 'hidden');
    };
    const picks = () =>
      cy
        .get('@formEvent')
        .then((stub) =>
          eventsNamed(stub as unknown as sinon.SinonStub, 'navigate').map((event) => event.detail),
        );

    describe('vertical', () => {
      it('renders a named menu, its groups closed, each naming its list', () => {
        mountMenu();

        nav().should('have.attr', 'aria-label', 'Main');
        nav().closest('gui-menu').should('not.have.attr', 'orientation');
        nav().children('ul').children('li').should('have.length', 3);
        item('settings')
          .should('match', 'button')
          .and('have.attr', 'aria-controls', testDomId(`${UID}_group_settings`));
        expectGroup('settings', false);
        expectGroup('reports', false);
        item('home').should('not.have.attr', 'aria-expanded');
      });

      it('marks the current item, and opens the groups that hold it', () => {
        mountMenu({}, { current: 'cards' });

        item('cards').should('have.attr', 'aria-current', 'page');
        item('profile').should('not.have.attr', 'aria-current');
        expectGroup('settings', true);
        expectGroup('billing', true);
        expectGroup('reports', false);
      });

      it('opens a group without an event, and emits a destination as the click event', () => {
        mountMenu();

        item('settings').click();
        expectGroup('settings', true);
        item('billing').click();
        expectGroup('billing', true);
        item('invoices').click();
        item('home').click();

        picks().should('deep.equal', [{ value: 'invoices' }, { value: 'home' }]);
      });

      it('keeps the groups the user closed until the current item changes', () => {
        mountFn({
          data: { view: 'profile' },
          formDef: defineForm({
            form: [
              { uid: 'view', kind: 'input', type: 'textinput', path: 'view' },
              { uid: 'note', kind: 'input', type: 'textinput', path: 'note' },
              menuWidget({}, { current: '{{ $form.view }}' }),
            ],
          }),
        });

        expectGroup('settings', true);
        item('profile').should('have.attr', 'aria-current', 'page');
        item('settings').click();
        expectGroup('settings', false);
        // Another change to the form leaves the user's choice alone.
        cy.get('[data-cy="note_textinput"]').type('x');
        expectGroup('settings', false);

        cy.get('[data-cy="view_textinput"]').clear().type('cards');
        item('cards').should('have.attr', 'aria-current', 'page');
        item('profile').should('not.have.attr', 'aria-current');
        expectGroup('settings', true);
        expectGroup('billing', true);
      });

      it('disables an item, or every item with the widget', () => {
        mountMenu({}, { current: 'profile' });
        item('archived').should('be.disabled').click({ force: true });
        picks().should('deep.equal', []);

        mountMenu({ disabled: true });
        item('home').should('be.disabled');
        item('settings').should('be.disabled').click({ force: true });
        expectGroup('settings', false);
      });

      it('shows an item icon, hidden from screen readers', () => {
        mountMenu();

        item('home')
          .find('[data-icon="home"]')
          .should('have.class', 'gui-widget-icon')
          .and('have.attr', 'aria-hidden', 'true');
        // In line before the label, not in a field's icon slot.
        item('home').should(([button]) => {
          const [icon, label] = Array.from(button.children);
          expect(getComputedStyle(icon).position).to.equal('static');
          expect(icon.getBoundingClientRect().right).to.be.at.most(
            label.getBoundingClientRect().left,
          );
        });
      });
    });

    describe('horizontal', () => {
      const dropdown = (value: string) => list(value);
      const isOpen = (value: string, expected: boolean) =>
        dropdown(value).should(([element]) =>
          expect(element.matches(':popover-open'), `${value} open`).to.equal(expected),
        );

      it('opens a first-level group as a dropdown, and closes it when an item is picked', () => {
        mountMenu({}, { orientation: 'horizontal' });

        nav().closest('gui-menu').should('have.attr', 'orientation', 'horizontal');
        item('settings')
          .should('have.attr', 'popovertarget', testDomId(`${UID}_group_settings`))
          .and('not.have.attr', 'aria-expanded');
        isOpen('settings', false);

        item('settings').click();
        isOpen('settings', true);
        // A deeper group opens in place, inside the dropdown.
        item('billing').should('have.attr', 'aria-expanded', 'false').click();
        expectGroup('billing', true);
        item('cards').click();

        picks().should('deep.equal', [{ value: 'cards' }]);
        isOpen('settings', false);
      });

      it('closes one dropdown when another opens', () => {
        mountMenu({}, { orientation: 'horizontal' });

        item('settings').click();
        isOpen('settings', true);
        item('reports').click();
        isOpen('reports', true);
        isOpen('settings', false);
      });
    });

    it('translates its name and its items, nested ones too', () => {
      const translator = dictionaryTranslator('en-US', {
        'en-US': { 'nav.main': 'Main', 'nav.settings': 'Settings', 'nav.profile': 'Profile' },
        'es-ES': { 'nav.main': 'Principal', 'nav.settings': 'Ajustes', 'nav.profile': 'Perfil' },
      });
      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            menuWidget(
              { label: { key: 'nav.main' } },
              {
                items: [
                  {
                    label: { key: 'nav.settings' },
                    value: 'settings',
                    items: [{ label: { key: 'nav.profile' }, value: 'profile' }],
                  },
                ],
              },
            ),
          ],
        }),
      });

      nav().should('have.attr', 'aria-label', 'Main');
      item('settings').should('contain.text', 'Settings');
      cy.then(() => translator.setLang('es-ES'));
      nav().should('have.attr', 'aria-label', 'Principal');
      item('settings').should('contain.text', 'Ajustes');
      item('profile').should('contain.text', 'Perfil');
    });

    it('gives each repeater row its own menu, and sends the row with the click', () => {
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
                template: { kind: 'layout', type: 'grid', children: [menuWidget()] },
              },
            } as FormWidget<string>,
          ],
        }),
        formEvent,
      });

      item('settings', `${UID}[1]`).click();
      item('profile', `${UID}[1]`).should('be.visible').click();
      item('profile', `${UID}[0]`).should('not.be.visible');
      cy.get('@formEvent').then((stub) =>
        expect(
          eventsNamed(stub as unknown as sinon.SinonStub, 'navigate').map((event) => [
            event.detail,
            event.row?.index,
          ]),
        ).to.deep.equal([[{ value: 'profile' }, 1]]),
      );
      expectNoDuplicateIds();
    });
  });
};
