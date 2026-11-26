import { defineForm, type FormWidget } from '@golemui/core';
import {
  dictionaryTranslator,
  eventsNamed,
  type MountComponentFn,
  testDomId,
  withTestFormName,
} from '../utils';

export const runBreadcrumbComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('Breadcrumb Component', () => {
    const UID = 'trail';
    const items = [
      { label: 'Orders', value: 'orders' },
      { label: '2026', value: 'orders-2026' },
      { label: 'A-1042', value: 'order' },
    ];

    const breadcrumbWidget = (overrides: Record<string, unknown> = {}, props = {}) =>
      ({
        uid: UID,
        kind: 'action',
        type: 'breadcrumb',
        on: { click: 'navigate' },
        props: { items, ...props },
        ...overrides,
      }) as FormWidget<any>;

    const mountTrail = (overrides: Record<string, unknown> = {}, props = {}) => {
      const formEvent = cy.stub().as('formEvent');
      mountFn({ formDef: defineForm({ form: [breadcrumbWidget(overrides, props)] }), formEvent });
    };

    const nav = () => cy.get(`#${testDomId(UID)}`);
    const step = (value: string) => cy.get(`[data-cy="${UID}_item_${value}"]`);
    /** Asserts, retrying, the text of an element without the whitespace a template adds. */
    const hasText =
      (expected: string) =>
      ([element]: JQuery<HTMLElement>) =>
        expect(element.textContent?.trim()).to.equal(expected);
    const picks = () =>
      cy
        .get('@formEvent')
        .then((stub) =>
          eventsNamed(stub as unknown as sinon.SinonStub, 'navigate').map((event) => event.detail),
        );

    it('renders a named trail: steps the user can pick, then the current page as text', () => {
      mountTrail({ label: 'You are here' });

      nav().should('have.attr', 'aria-label', 'You are here');
      nav().closest('gui-breadcrumb').should('exist');
      nav().find('ol > li').should('have.length', 3);
      step('orders').should('match', 'button').and(hasText('Orders'));
      step('orders-2026').should('match', 'button');
      step('order')
        .should('match', 'span')
        .and('have.attr', 'aria-current', 'page')
        .and(hasText('A-1042'));
    });

    it('names the trail "Breadcrumb" without a label', () => {
      mountTrail();

      nav().should('have.attr', 'aria-label', 'Breadcrumb');
    });

    it('emits the click event with the value of the picked step', () => {
      mountTrail();

      step('orders-2026').click();
      step('order').click();
      step('orders').click();

      picks().should('deep.equal', [{ value: 'orders-2026' }, { value: 'orders' }]);
    });

    it('disables every step, so none can be picked', () => {
      mountTrail({ disabled: true });

      step('orders').should('be.disabled').click({ force: true });
      step('orders-2026').should('be.disabled');
      picks().should('deep.equal', []);
    });

    it('takes the steps of the active state', () => {
      mountFn({
        formDef: defineForm({
          states: { short: "$form.view === 'short'" },
          form: [
            { uid: 'view', kind: 'input', type: 'textinput', path: 'view' },
            breadcrumbWidget({}, { 'items.short': [{ label: 'Orders', value: 'orders' }] }),
          ],
        }),
      });

      nav().find('li').should('have.length', 3);
      cy.get('[data-cy="view_textinput"]').type('short');
      nav().find('li').should('have.length', 1);
      step('orders').should('match', 'span').and('have.attr', 'aria-current', 'page');
    });

    it('translates its name and its steps', () => {
      const translator = dictionaryTranslator('en-US', {
        'en-US': { 'nav.trail': 'You are here', 'nav.orders': 'Orders' },
        'es-ES': { 'nav.trail': 'Estás aquí', 'nav.orders': 'Pedidos' },
      });
      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            breadcrumbWidget(
              { label: { key: 'nav.trail' } },
              {
                items: [
                  { label: { key: 'nav.orders' }, value: 'orders' },
                  { label: 'A-1042', value: 'order' },
                ],
              },
            ),
          ],
        }),
      });

      nav().should('have.attr', 'aria-label', 'You are here');
      step('orders').should(hasText('Orders'));
      cy.then(() => translator.setLang('es-ES'));
      nav().should('have.attr', 'aria-label', 'Estás aquí');
      step('orders').should(hasText('Pedidos'));
    });
  });
};
