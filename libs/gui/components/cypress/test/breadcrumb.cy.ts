import { html, nothing, type TemplateResult } from 'lit';
import { realPress, takesRealInput } from '../support/real-input';

const element = () => cy.get('gui-breadcrumb');
const items = () => cy.get('gui-breadcrumb li');

/** A trail to an order: two buttons, a link and the current page. */
const trail = ({
  name = 'Breadcrumb',
  current = true,
  extra = nothing,
}: { name?: string | null; current?: boolean; extra?: TemplateResult | typeof nothing } = {}) =>
  html`<gui-breadcrumb>
    <nav aria-label=${name ?? nothing}>
      <ol>
        <li><button type="button" value="home">Home</button></li>
        <li><button type="button">Orders</button></li>
        <li><a href="#year-2026">2026</a></li>
        ${extra}
        <li><span aria-current=${current ? 'page' : nothing}>A-1042</span></li>
      </ol>
    </nav>
  </gui-breadcrumb>`;

/** The `::before` of the nth item: its separator. */
const separator = (index: number) =>
  items()
    .eq(index)
    .then(([item]) => getComputedStyle(item, '::before'));

describe('gui-breadcrumb', () => {
  describe('layout', () => {
    it('draws a separator between items, with no text, and none before the first', () => {
      cy.mount(trail());

      separator(0).its('content').should('be.oneOf', ['none', 'normal']);
      for (const index of [1, 2, 3]) {
        separator(index).its('content').should('equal', '""');
        separator(index).its('rotate').should('equal', '-90deg');
      }
    });

    it('points the separators the other way right to left', () => {
      cy.mount(html`<div dir="rtl">${trail()}</div>`);

      separator(1).its('rotate').should('equal', '90deg');
      items().should(([first, second]) =>
        expect(second.getBoundingClientRect().right).to.be.lessThan(
          first.getBoundingClientRect().left,
        ),
      );
    });

    it('wraps a trail longer than its container, and never scrolls the page', () => {
      cy.mount(html`<div style="inline-size: 160px">${trail()}</div>`);

      items().should(($items) => {
        const tops = new Set(Array.from($items, (item) => item.getBoundingClientRect().top));
        expect(tops.size, 'rows').to.be.greaterThan(1);
      });
      cy.document().should((doc) =>
        expect(doc.documentElement.scrollWidth).to.equal(doc.documentElement.clientWidth),
      );
    });

    it('sets the current item apart from the ones the user can activate', () => {
      cy.mount(trail());

      cy.get('[aria-current="page"]').should('have.css', 'font-weight', '500');
      cy.get('gui-breadcrumb button')
        .first()
        .should(([button]) => {
          const current = document.querySelector('[aria-current="page"]') as HTMLElement;
          expect(getComputedStyle(button).color).not.to.equal(getComputedStyle(current).color);
        });
    });

    it('writes no attribute on itself or on the trail', () => {
      cy.mount(trail());

      element().should(([el]) => {
        expect(el.getAttributeNames()).to.deep.equal([]);
        for (const item of el.querySelectorAll('button, a')) {
          expect(item.hasAttribute('role'), 'role').to.equal(false);
          expect(item.hasAttribute('tabindex'), 'tabindex').to.equal(false);
        }
      });
    });
  });

  describe('activating an item', () => {
    it('fires gui-action with the value of a button, or its text', () => {
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${trail()}</div>`);

      cy.contains('button', 'Home').click();
      cy.get('@action').its('lastCall.args.0.detail.value').should('equal', 'home');
      cy.contains('button', 'Orders').click();
      cy.get('@action').its('lastCall.args.0.detail.value').should('equal', 'Orders');
      cy.get('@action')
        .its('lastCall.args.0.detail.item')
        .should('have.prop', 'textContent', 'Orders');
    });

    it('fires gui-action for a link, and leaves its navigation alone', () => {
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${trail()}</div>`);

      cy.contains('a', '2026').click();
      cy.get('@action').its('lastCall.args.0.detail.value').should('equal', '2026');
      cy.location('hash').should('equal', '#year-2026');
    });

    it('ignores the current item and a disabled one', () => {
      const onAction = cy.spy().as('action');
      cy.mount(
        html`<div @gui-action=${onAction}>
          ${trail({
            extra: html`<li><button type="button" disabled>Archived</button></li>
              <li><a href="#closed" aria-disabled="true">Closed</a></li>`,
          })}
        </div>`,
      );

      cy.get('[aria-current="page"]').click();
      cy.contains('button', 'Archived').click({ force: true });
      cy.contains('a', 'Closed').click();
      cy.location('hash').should('not.equal', '#closed');
      cy.get('@action').should('not.have.been.called');
    });

    it('activates a focused item with Enter', function () {
      if (!takesRealInput()) this.skip();
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${trail()}</div>`);

      cy.contains('button', 'Orders').focus();
      realPress('Enter');
      cy.get('@action').its('lastCall.args.0.detail.value').should('equal', 'Orders');
    });
  });

  describe('development warnings', () => {
    beforeEach(() => cy.window().then((win) => cy.spy(win.console, 'warn').as('warn')));

    it('warns about a <nav> with no name', () => {
      cy.mount(trail({ name: null }));
      cy.get('@warn').should(
        'have.been.calledWithMatch',
        /<gui-breadcrumb> has a <nav> with no aria-label/,
      );
    });

    it('warns about a trail with no current item', () => {
      cy.mount(trail({ current: false }));
      cy.get('@warn').should(
        'have.been.calledWithMatch',
        /<gui-breadcrumb> has no item with aria-current="page"/,
      );
    });

    it('warns about items outside a <nav>', () => {
      cy.mount(
        html`<gui-breadcrumb>
          <ol>
            <li><span aria-current="page">Home</span></li>
          </ol>
        </gui-breadcrumb>`,
      );
      cy.get('@warn').should('have.been.calledWithMatch', /<gui-breadcrumb> has no <nav> child/);
    });

    it('does not warn about a named trail with a current item, rendered after it connects', () => {
      cy.mount(html`<gui-breadcrumb></gui-breadcrumb>`);
      element().then(([el]) => {
        el.innerHTML =
          '<nav aria-label="Breadcrumb"><ol><li><button type="button">Home</button></li><li><span aria-current="page">Orders</span></li></ol></nav>';
      });

      element().find('[aria-current]').should('exist');
      cy.get('@warn').should('not.have.been.calledWithMatch', /<gui-breadcrumb>/);
    });
  });
});
